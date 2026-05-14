import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxyBackend";

export const runtime = "nodejs";

/** 代理到后端 `GET /api/integration/status`，用于检查 Discord + 期权拉数。 */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/api/integration/status");
}
