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
  const apiKey = req.headers.get("x-api-key") ?? process.env.OPTIONS_AJI_API_KEY ?? "";
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
