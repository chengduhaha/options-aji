import { proxyBackend } from "@/lib/proxyBackend";

/** Data source: FastAPI scans `options_snapshots` (PostgreSQL), filled by Massive API sync (`MASSIVE_API_KEY`). Not FMP. */

export const runtime = "nodejs";

export const GET = proxyBackend("/api/options/unusual-v2");
