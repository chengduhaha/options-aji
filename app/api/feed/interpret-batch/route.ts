import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxyBackend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  return proxyToBackend(req, "/api/feed/interpret-batch", {
    method: "POST",
    body,
    headers: { "Content-Type": req.headers.get("content-type") ?? "application/json" },
  });
}
