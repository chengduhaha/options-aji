import type { NextRequest } from "next/server";
import { proxySseToBackend } from "@/lib/proxyBackend";

export const runtime = "nodejs";
export const maxDuration = 120;

/** 将浏览器请求代理到自建 FastAPI SSE 服务（环境变量仅存于服务端）。 */

export async function POST(req: NextRequest) {
  return proxySseToBackend(req, "/api/agent/query");
}
