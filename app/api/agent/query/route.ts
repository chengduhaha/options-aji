import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/** 将浏览器请求代理到自建 FastAPI SSE 服务（环境变量仅存于服务端）。 */

export async function POST(req: NextRequest) {
  const base = (process.env.OPTIONS_AJI_BACKEND_URL ?? "").trim();
  const bodyPayload = await req.text();

  if (!base) {
    return Response.json(
      {
        success: false,
        error: {
          code: "backend_not_configured",
          message: "缺少 OPTIONS_AJI_BACKEND_URL（例如 http://127.0.0.1:8787）。",
        },
      },
      { status: 503 },
    );
  }

  const target = `${base.replace(/\/$/, "")}/api/agent/query`;

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        Authorization:
          req.headers.get("authorization") ??
          "",
      },
      body: bodyPayload,
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
    const rendered =
      error instanceof Error ? `${error.name}: ${error.message}` : "proxy_failed";
    return Response.json({ success: false, error: { code: "proxy_failed", message: rendered } }, { status: 502 });
  }
}
