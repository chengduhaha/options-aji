import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ path?: string[] }> };

async function forward(req: NextRequest, segments: string[]): Promise<Response> {
  const base = (process.env.OPTIONS_AJI_BACKEND_URL ?? "").trim();
  if (!base) {
    return Response.json(
      {
        success: false,
        error: { code: "backend_not_configured", message: "缺少 OPTIONS_AJI_BACKEND_URL。" },
      },
      { status: 503 },
    );
  }

  const subpath = segments.length ? segments.join("/") : "";
  const incoming = new URL(req.url);
  const targetUrl = `${base.replace(/\/$/, "")}/api/auth/${subpath}${incoming.search}`;

  const headers = new Headers();
  headers.set("Accept", "application/json");
  const ct = req.headers.get("content-type");
  if (ct) headers.set("Content-Type", ct);
  const auth = req.headers.get("authorization");
  if (auth) headers.set("Authorization", auth);

  const forwardIpHeaders = [
    "x-forwarded-for",
    "x-real-ip",
    "x-vercel-forwarded-for",
    "cf-connecting-ip",
  ] as const;
  for (const name of forwardIpHeaders) {
    const v = req.headers.get(name);
    if (v) headers.set(name, v);
  }

  const apiKey = process.env.OPTIONS_AJI_API_KEY ?? "";
  if (apiKey) headers.set("X-API-Key", apiKey);

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const upstream = await fetch(targetUrl, init);
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

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path ?? []);
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path ?? []);
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path ?? []);
}
