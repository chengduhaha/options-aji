import { proxyToBackend } from "@/lib/proxyBackend";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

/** Browser-safe proxy: Vercel (HTTPS) → your FastAPI (often HTTP) on `OPTIONS_AJI_BACKEND_URL`. */

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await context.params;
  return proxyToBackend(req, `/api/market/${encodeURIComponent(symbol)}`);
}
