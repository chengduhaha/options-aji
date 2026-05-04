import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxyBackend";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/api/market/overview");
}
