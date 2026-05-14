import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxyBackend";

export const runtime = "nodejs";

/** 代理后端 `GET /api/messages`（Discord SQLite 存档）。 */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/api/messages");
}
