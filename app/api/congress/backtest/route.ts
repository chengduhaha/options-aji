import { proxyToBackend } from "@/lib/proxyBackend";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  return proxyToBackend(req, "/api/congress/backtest", {
    method: "POST",
    body,
  });
}
