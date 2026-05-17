/**
 * Cross-market + ontology HTTP client. All paths hit Next.js route handlers
 * that proxy to OPTIONS_AJI_BACKEND_URL (see app/api/cross-market/*).
 */

export interface HotEvent {
  event_id: string;
  title_zh: string;
  event_type: string;
  event_time: string;
  probabilities: {
    options: number;
    polymarket: number;
    social: number;
    institutional: number;
  };
  consensus: number;
  disagreement: number;
  arbitrage_direction: string;
}

export interface BackendArbitrageOpportunity {
  event_id: string;
  question: string;
  options_probability: number;
  polymarket_probability: number;
  social_probability: number;
  institutional_probability: number;
  consensus_probability: number;
  disagreement: number;
  arbitrage_direction: string;
  confidence_score: number;
}

export interface FeedItem {
  item_id: string;
  kind: string;
  source: string;
  timestamp: string;
  title: string;
  sentiment: string;
  urgency: string;
  affected_tickers: string[];
  ai_summary_zh: string;
}

export interface StockOverviewCrossMarket {
  symbol: string;
  price: number;
  change_pct: number;
  iv_rank: number;
  volume: number;
  market_cap: number;
  bid?: number | null;
  ask?: number | null;
  high?: number | null;
  low?: number | null;
  data_source?: string;
}

export interface OntologyTrace {
  trace_id: string;
  source: string;
  query: string;
  matched_pattern: string | null;
  used_objects: string[];
  used_relations: string[];
  created_at: string;
}

export interface OntologyInspectorPayload {
  objects: string[];
  relations: string[];
  patterns: string[];
  recent_traces: OntologyTrace[];
}

async function parseJson<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${path} ${res.status}: ${t.slice(0, 240)}`);
  }
  return res.json() as Promise<T>;
}

const noStore: RequestInit = { cache: "no-store" };

export async function getHotEvents(): Promise<{ events: HotEvent[] }> {
  const res = await fetch("/api/cross-market/events/hot", noStore);
  return parseJson(res, "/api/cross-market/events/hot");
}

export async function scanArbitrage(): Promise<{ opportunities: BackendArbitrageOpportunity[] }> {
  const res = await fetch("/api/cross-market/scanner/arbitrage", noStore);
  return parseJson(res, "/api/cross-market/scanner/arbitrage");
}

export async function getCrossMarketFeed(): Promise<{ items: FeedItem[] }> {
  const res = await fetch("/api/cross-market/feed", noStore);
  return parseJson(res, "/api/cross-market/feed");
}

/** Same as getCrossMarketFeed — alias for ported pages. */
export async function getFeed(): Promise<{ items: FeedItem[] }> {
  return getCrossMarketFeed();
}

export async function getCrossMarketQuote(symbol: string): Promise<StockOverviewCrossMarket> {
  const clean = encodeURIComponent(symbol.toUpperCase());
  const res = await fetch(`/api/cross-market/quote/${clean}`, noStore);
  return parseJson(res, `/api/cross-market/quote/${clean}`);
}

export interface CopilotQueryResponse {
  response: string;
  error?: string;
}

export async function queryCopilot(query: string, traderId = "demo_user"): Promise<CopilotQueryResponse> {
  const res = await fetch("/api/copilot/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, trader_id: traderId }),
    ...noStore,
  });
  const data = (await res.json().catch(() => ({}))) as CopilotQueryResponse & { detail?: unknown };
  if (!res.ok) {
    const msg =
      typeof data.error === "string"
        ? data.error
        : `copilot ${res.status}: ${JSON.stringify(data.detail ?? data).slice(0, 200)}`;
    throw new Error(msg);
  }
  return data;
}

export async function fetchOntologyObjects(): Promise<{ objects: string[] }> {
  const res = await fetch("/api/ontology/objects", noStore);
  return parseJson(res, "/api/ontology/objects");
}

export async function fetchOntologyPatterns(): Promise<{ patterns: string[] }> {
  const res = await fetch("/api/ontology/patterns", noStore);
  return parseJson(res, "/api/ontology/patterns");
}

export async function getOntologyInspector(): Promise<OntologyInspectorPayload> {
  const res = await fetch("/api/ontology/inspector", noStore);
  return parseJson(res, "/api/ontology/inspector");
}

export async function getCrossMarketDiagnostics(): Promise<unknown> {
  const res = await fetch("/api/cross-market/diagnostics/data-sources", noStore);
  return parseJson(res, "/api/cross-market/diagnostics/data-sources");
}
