import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxyBackend";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  return proxyToBackend(req, "/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
