import type { NextRequest } from "next/server";

export const runtime = "nodejs";

/** 代理后端 `GET /api/messages`（Discord SQLite 存档）。 */

export async function GET(req: NextRequest) {
  const base = (process.env.OPTIONS_AJI_BACKEND_URL ?? "").trim();
  const qs = req.nextUrl.searchParams.toString();
  const suffix = qs.length > 0 ? `?${qs}` : "";

  if (!base) {
    return Response.json(
      {
        success: false,
        error: {
          code: "backend_not_configured",
          message: "需要在环境变量 OPTIONS_AJI_BACKEND_URL 中指明 FastAPI。",
        },
      },
      { status: 503 },
    );
  }

  const target = `${base.replace(/\/$/, "")}/api/messages${suffix}`;

  try {
    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: req.headers.get("authorization") ?? "",
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
