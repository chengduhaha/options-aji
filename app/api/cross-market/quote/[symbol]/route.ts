import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxyBackend";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params;
  const qs = req.nextUrl.searchParams.toString();
  const suffix = qs.length > 0 ? `?${qs}` : "";
  return proxyToBackend(req, `/api/cross-market/quote/${encodeURIComponent(symbol)}${suffix}`);
}
