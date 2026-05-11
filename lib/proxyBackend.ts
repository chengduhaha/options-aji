import type { NextRequest } from "next/server";

export function backendBaseUrl(): string {
  return (process.env.OPTIONS_AJI_BACKEND_URL ?? "").trim();
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

export async function proxyToBackend(
  req: NextRequest,
  backendPath: string,
  init?: RequestInit,
): Promise<Response> {
  const base = backendBaseUrl();
  if (!base) return backendNotConfiguredResponse();

  const normalized = backendPath.startsWith("/") ? backendPath : `/${backendPath}`;
  const target = `${base.replace(/\/$/, "")}${normalized}`;

  const hdrs = new Headers(init?.headers ?? {});
  if (!hdrs.has("Accept")) hdrs.set("Accept", "application/json");
  const apiKey = (req as NextRequest).headers?.get("x-api-key") ?? process.env.OPTIONS_AJI_API_KEY ?? "";
  if (apiKey) hdrs.set("X-API-Key", apiKey);

  try {
    const upstream = await fetch(target, {
      ...init,
      headers: hdrs,
      cache: "no-store",
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
    if (!base) return Promise.resolve(backendNotConfiguredResponse());

    const normalized = backendPath.startsWith("/") ? backendPath : `/${backendPath}`;

    // Forward query string from incoming request
    const incomingUrl = new URL(req.url);
    const qs = incomingUrl.search; // e.g. "?limit=50&page=1"
    const target = `${base.replace(/\/$/, "")}${normalized}${qs}`;

    const hdrs = new Headers(init?.headers ?? {});
    if (!hdrs.has("Accept")) hdrs.set("Accept", "application/json");
    const apiKey =
      (req as NextRequest).headers?.get("x-api-key") ??
      process.env.OPTIONS_AJI_API_KEY ??
      "";
    if (apiKey) hdrs.set("X-API-Key", apiKey);

    return fetch(target, {
      method: req.method,
      ...init,
      headers: hdrs,
      cache: "no-store",
    })
      .then(async (upstream) => {
        const bodyText = await upstream.text();
        return new Response(bodyText, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "application/json",
            "Cache-Control": "no-store",
          },
        });
      })
      .catch((error: unknown) => {
        const rendered =
          error instanceof Error ? `${error.name}: ${error.message}` : "proxy_failed";
        return Response.json(
          { success: false, error: { code: "proxy_failed", message: rendered } },
          { status: 502 },
        );
      });
  };
}
