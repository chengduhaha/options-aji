export interface MarketPulseRow {
  symbol: string;
  yahooSymbol?: string;
  price: number | null;
  changePct: number | null;
  invertColors?: boolean;
  error?: string;
}

export interface MarketOverviewContract {
  generatedAt: string;
  marketSessionLabel: string;
  pulse: MarketPulseRow[];
  volatility: {
    vix: number | null;
    vixChangePct: number | null;
    band: string;
    vixSeries: number[];
    termStructure: Record<string, unknown>;
  };
  liquidity: {
    putCallRatioVolumeApprox: number | null;
    methodology?: string;
    symbolsSampled?: string[];
  };
  unusual: Array<{
    symbol: string;
    type: string;
    strike: number;
    expiration: string;
    volOiRatio: number;
    sentiment?: string;
  }>;
  earnings: Array<{ symbol: string; date: string; note?: string }>;
  gexQuick: Array<{ symbol: string; netGex?: number; gammaFlip?: number; regime?: string }>;
}

export interface AgentBriefContract {
  brief?: string;
}

export interface StockOverviewContract {
  symbol: string;
  priceSeries: Array<{ date: string; close: number | null }>;
  keyStats: Record<string, unknown>;
  optionLiquidity: Record<string, unknown>;
  expectedMoves: Array<{ bucket: string; pct: number; straddleUsd: number; expiration: string }>;
  earnings: { nextDate: string | null; daysTo: number | null };
  bar?: { price?: number; changePct?: number };
}

export interface AnalystPriceTargetContract {
  summary?: {
    lastMonthAvgPriceTarget?: number;
    lastQuarterAvgPriceTarget?: number;
    lastYearAvgPriceTarget?: number;
    allTimeAvgPriceTarget?: number;
    lastMonthCount?: number;
    allTimeCount?: number;
  } | null;
  consensus?: {
    priceTarget?: number;
    high?: number;
    low?: number;
    median?: number;
    buyCount?: number;
    holdCount?: number;
    sellCount?: number;
  } | null;
}

export interface FeedItemContract {
  id: string;
  kind: "signal" | "discord" | "macro" | "twitter" | "news" | "resonance";
  created_at_utc: string;
  title: string;
  body: string;
  tickers: string[];
  sentiment?: string | null;
  priority?: string | null;
  raw_body?: string | null;
  original_lang?: string | null;
  bullets_zh?: string[] | null;
  risk_note_zh?: string | null;
}

export interface FeedEnvelopeContract {
  generated_at_utc: string;
  items: FeedItemContract[];
}

export interface ScannerRunContract {
  preset: string;
  generated_at_unix: number;
  duration_ms: number;
  count: number;
  results: Array<{
    symbol: string;
    option_type: string;
    strike: number;
    expiration: string;
    dte: number | null;
    volume: number;
    openInterest: number;
    volOiRatio: number;
    ivRankProxy: number | null;
    iv: number | null;
    delta: number | null;
  }>;
}

export interface ScannerRunPayload {
  preset: string;
  min_volume: number;
  vol_oi_ratio: number;
  iv_rank_min?: number;
  iv_rank_max?: number;
  dte_min?: number | null;
  dte_max?: number | null;
  delta_min?: number | null;
  delta_max?: number | null;
  iv_min?: number | null;
  iv_max?: number | null;
  expiration_scope?: "all" | "front" | "next_three";
  query_text?: string;
  symbols?: string[];
}

export interface SocialRadarItemContract {
  symbol: string;
  mentions_24h: number;
  mentions_growth_pct: number;
  sentiment_score: number;
  direction: string;
  resonance: string;
}

export interface SocialRadarContract {
  generated_at_utc: string;
  items: SocialRadarItemContract[];
}

export interface SmartVsRetailContract {
  symbol: string;
  snapshot_time: string;
  institutional_direction: string;
  institutional_strength: number;
  unusual_flow_count_24h: number;
  premium_flow_usd: number;
  retail_direction: string;
  retail_sentiment_score: number;
  mentions_24h: number;
  mention_growth_pct: number;
  consensus_type: string;
  ai_narrative_zh: string;
  confidence: number;
}

export interface KolProfileContract {
  handle: string;
  label: string;
  posts_24h: number;
}

export interface KolDirectoryContract {
  generated_at_utc: string;
  items: KolProfileContract[];
}

export interface ResonanceStreamItemContract {
  id: number;
  symbol: string;
  signal_type: string;
  triggered_at_utc: string;
  institutional_direction: string;
  retail_direction: string;
  institutional_strength: number;
  retail_strength: number;
  confidence?: number | null;
  narrative_zh?: string | null;
}

export interface ResonanceStreamContract {
  generated_at_utc: string;
  items: ResonanceStreamItemContract[];
}

export interface AlertContract {
  id: number;
  alert_type: string;
  symbol: string;
  threshold?: number | null;
  enabled: boolean;
  created_at: string;
}

export interface PushSettingsContract {
  push_discord: boolean;
  push_telegram: boolean;
  push_email: boolean;
  keywords: string;
  updated_at?: string | null;
}

export interface ScannerTemplateConfigContract {
  preset: string;
  query_text: string;
  symbol_scope: string;
  dte_min: string;
  dte_max: string;
  delta_min: string;
  delta_max: string;
  iv_min: string;
  iv_max: string;
  expiration_scope: "all" | "front" | "next_three";
  sort_field: "volOiRatio" | "iv" | "dte" | "delta";
  sort_direction: "asc" | "desc";
}

export interface ScannerTemplateContract {
  id: number;
  name: string;
  config: ScannerTemplateConfigContract;
  updated_at: string;
}

export interface AuthUserContract {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string | null;
  email_verified: boolean;
}

export interface AuthTokenContract {
  access_token: string;
  token_type: "bearer";
  user: AuthUserContract;
}

export interface AuthRegisterContract {
  user: AuthUserContract;
  verification_required: boolean;
  verification_expires_at: string;
  verification_code: string | null;
}

/** LocalStorage key for integration API key (alerts, watchlist, push settings). */
export const OPTIONS_AJI_API_KEY_LS = "optionsaji_api_key";

export interface WatchlistGetContract {
  symbols: string[];
}

export interface WatchlistAddContract {
  status: "added" | "already_exists";
  symbol: string;
}

export interface WatchlistRemoveContract {
  status: "removed";
  symbol: string;
}

export interface AlertsListEnvelopeContract {
  success: boolean;
  data: AlertContract[];
}

export interface AlertCreateEnvelopeContract {
  success: boolean;
  data: AlertContract;
}

export interface OptionsGexProfileContract {
  symbol: string;
  expiration?: string;
  underlyingPrice?: number;
  netGex?: number;
  callWall?: number;
  putWall?: number;
  gammaFlip?: number;
  maxPain?: number;
  regime?: string;
  error?: string;
}

export interface StockChainLegAnalysisContract {
  dayVolume?: number | null;
  openInterest?: number | null;
  impliedVolatilityPct?: number | null;
  delta?: number | null;
  gamma?: number | null;
  theta?: number | null;
  vega?: number | null;
  bid?: number | null;
  ask?: number | null;
  midpoint?: number | null;
  oiSpike?: boolean;
  ivSkewOutlier?: boolean;
  liquidity?: string;
  spreadRatio?: number | null;
}

export interface StockChainAnalysisStrikeRowContract {
  strike: number;
  parity: { flag: boolean };
  call: StockChainLegAnalysisContract | null;
  put: StockChainLegAnalysisContract | null;
}

export interface StockChainAnalysisContract {
  symbol: string;
  expiration?: string;
  source?: string;
  expirations?: string[];
  underlyingPrice?: number | null;
  ivMedian?: number | null;
  summary?: {
    totalCallOi?: number;
    totalPutOi?: number;
    putCallOiRatio?: number | null;
  };
  highlights?: Array<{ type: string; strike: number; side?: string; detail: string }>;
  strikes?: StockChainAnalysisStrikeRowContract[];
  riskFreeRate?: number;
  error?: string;
}
