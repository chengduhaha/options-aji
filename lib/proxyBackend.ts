import type { NextRequest } from "next/server";

const DEFAULT_BACKEND_TIMEOUT_MS = 25_000;
const IP_FORWARD_HEADERS = [
  "x-forwarded-for",
  "x-real-ip",
  "x-vercel-forwarded-for",
  "cf-connecting-ip",
] as const;

const STRICT_HTTPS_MSG =
  "OPTIONS_AJI_REQUIRE_HTTPS_BACKEND=1 时，OPTIONS_AJI_BACKEND_URL 必须是 https:// 地址。";

export function backendBaseUrl(): string {
  return (process.env.OPTIONS_AJI_BACKEND_URL ?? "").trim();
}

/**
 * When `OPTIONS_AJI_REQUIRE_HTTPS_BACKEND=1`, the backend base URL must use `https:`.
 * When strict mode is off, always returns true.
 */
export function backendUrlSatisfiesHttpsPolicy(baseUrl: string): boolean {
  const strict = (process.env.OPTIONS_AJI_REQUIRE_HTTPS_BACKEND ?? "").trim() === "1";
  if (!strict) return true;
  try {
    const parsed = new URL(baseUrl);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * @deprecated Prefer `backendUrlSatisfiesHttpsPolicy` — same behavior, clearer name.
 */
export function requireHttpsBackend(baseUrl: string): boolean {
  return backendUrlSatisfiesHttpsPolicy(baseUrl);
}

function resolveTimeoutMs(): number {
  const raw = Number(process.env.OPTIONS_AJI_BACKEND_TIMEOUT_MS ?? "");
  if (Number.isFinite(raw) && raw >= 1_000) return Math.floor(raw);
  return DEFAULT_BACKEND_TIMEOUT_MS;
}

function buildForwardHeaders(req: Request, initHeaders?: HeadersInit): Headers {
  const hdrs = new Headers(initHeaders ?? {});
  if (!hdrs.has("Accept")) hdrs.set("Accept", "application/json");
  const requestId = req.headers.get("x-request-id");
  if (requestId) hdrs.set("X-Request-Id", requestId);
  const authorization = req.headers.get("authorization");
  if (authorization) hdrs.set("Authorization", authorization);
  const contentType = req.headers.get("content-type");
  if (contentType && !hdrs.has("Content-Type")) hdrs.set("Content-Type", contentType);

  for (const name of IP_FORWARD_HEADERS) {
    const value = req.headers.get(name);
    if (value) hdrs.set(name, value);
  }

  const apiKey = req.headers.get("x-api-key") ?? process.env.OPTIONS_AJI_API_KEY ?? "";
  if (apiKey) hdrs.set("X-API-Key", apiKey);
  return hdrs;
}

async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const timeoutMs = resolveTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

type ProxyGuardError = "not_configured" | "https_policy";

function guardBackendProxy(base: string): ProxyGuardError | null {
  if (!base) return "not_configured";
  if (!backendUrlSatisfiesHttpsPolicy(base)) return "https_policy";
  return null;
}

function guardToResponse(code: ProxyGuardError): Response {
  if (code === "not_configured") return backendNotConfiguredResponse();
  return backendMisconfiguredResponse(STRICT_HTTPS_MSG);
}

function normalizeBackendPath(backendPath: string): string {
  return backendPath.startsWith("/") ? backendPath : `/${backendPath}`;
}

async function proxyJsonThroughBackend(
  target: string,
  req: Request,
  init?: RequestInit,
): Promise<Response> {
  const hdrs = buildForwardHeaders(req, init?.headers);
  try {
    const upstream = await fetchWithTimeout(target, {
      ...init,
      headers: hdrs,
    });
    const bodyText = await upstream.text();
    return new Response(bodyText, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const rendered =
      error instanceof Error ? `${error.name}: ${error.message}` : "proxy_failed";
    return Response.json(
      { success: false, error: { code: "proxy_failed", message: rendered } },
      { status: 502 },
    );
  }
}

export function backendNotConfiguredResponse(): Response {
  return Response.json(
    {
      success: false,
      error: {
        code: "backend_not_configured",
        message: "缺少 OPTIONS_AJI_BACKEND_URL。",
      },
    },
    { status: 503 },
  );
}

export function backendMisconfiguredResponse(message: string): Response {
  return Response.json(
    {
      success: false,
      error: {
        code: "backend_misconfigured",
        message,
      },
    },
    { status: 503 },
  );
}

export async function proxyToBackend(
  req: NextRequest,
  backendPath: string,
  init?: RequestInit,
): Promise<Response> {
  const base = backendBaseUrl();
  const guard = guardBackendProxy(base);
  if (guard) return guardToResponse(guard);

  const normalized = normalizeBackendPath(backendPath);
  const target = `${base.replace(/\/$/, "")}${normalized}`;
  return proxyJsonThroughBackend(target, req, init);
}

/**
 * Curried helper used by new v2 API routes:
 *   export const GET = proxyBackend('/api/some/path');
 *   // or with path params:
 *   export const GET = (req, ctx) => ctx.params.then(p => proxyBackend(`/api/foo/${p.id}`)(req));
 */
export function proxyBackend(
  backendPath: string,
  init?: RequestInit,
): (req: Request) => Promise<Response> {
  return (req: Request) => {
    const base = backendBaseUrl();
    const guard = guardBackendProxy(base);
    if (guard) return Promise.resolve(guardToResponse(guard));

    const incomingUrl = new URL(req.url);
    const normalized = normalizeBackendPath(backendPath);
    const target = `${base.replace(/\/$/, "")}${normalized}${incomingUrl.search}`;
    return proxyJsonThroughBackend(target, req, { method: req.method, ...init });
  };
}

export async function proxySseToBackend(
  req: NextRequest,
  backendPath: string,
  init?: Omit<RequestInit, "method">,
): Promise<Response> {
  const base = backendBaseUrl();
  const guard = guardBackendProxy(base);
  if (guard) return guardToResponse(guard);

  const normalized = normalizeBackendPath(backendPath);
  const target = `${base.replace(/\/$/, "")}${normalized}`;
  const headers = buildForwardHeaders(req, init?.headers);
  headers.set("Accept", "text/event-stream");

  const payload = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();

  try {
    const upstream = await fetch(target, {
      ...init,
      method: req.method,
      headers,
      body: payload,
      cache: "no-store",
    });
    if (!upstream.ok || upstream.body === null) {
      const snippet = await upstream.text();
      return new Response(snippet || upstream.statusText, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("content-type") ?? "text/plain",
        },
      });
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream",
        Connection: upstream.headers.get("connection") ?? "keep-alive",
        "Cache-Control": "no-store, no-transform",
      },
    });
  } catch (error: unknown) {
    const rendered = error instanceof Error ? `${error.name}: ${error.message}` : "proxy_failed";
    return Response.json(
      { success: false, error: { code: "proxy_failed", message: rendered } },
      { status: 502 },
    );
  }
}
