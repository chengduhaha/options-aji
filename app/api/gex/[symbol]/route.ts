import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await context.params;
  const base = (process.env.OPTIONS_AJI_BACKEND_URL ?? "").trim();

  if (!base) {
    return Response.json(
      {
        success: false,
        error: {
          code: "backend_not_configured",
          message: "缺少 OPTIONS_AJI_BACKEND_URL。FastAPI 需配置 GEX_BACKEND_URL 以透传旧 GEX 服务。",
        },
      },
      { status: 503 },
    );
  }

  const target = `${base.replace(/\/$/, "")}/gex/${encodeURIComponent(symbol)}`;

  try {
    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": req.headers.get("x-api-key") ?? "",
      },
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
