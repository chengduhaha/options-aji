import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxyBackend";

export const runtime = "nodejs";

/** Proxies backend `GET /api/signals/feed`（OpenBBToolkit / yfinance 合成信号卡片） */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/api/signals/feed");
}
