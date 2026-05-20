/**
 * Typed API client for OptionsAji backend.
 * All calls go through Next.js /api proxy routes.
 */
import type {
  AgentBriefContract,
  AnalystPriceTargetContract,
  AlertCreateEnvelopeContract,
  AlertsListEnvelopeContract,
  AuthRegisterContract,
  AuthResendVerificationContract,
  AuthTokenContract,
  FeedEnvelopeContract,
  KolDirectoryContract,
  MarketOverviewContract,
  MvpMarketInsightsContract,
  PushSettingsContract,
  ResonanceStreamContract,
  ScannerRunContract,
  ScannerRunPayload,
  ScannerTemplateConfigContract,
  ScannerTemplateContract,
  SignalsFeedEnvelopeContract,
  SmartVsRetailContract,
  SocialRadarContract,
  StockOverviewContract,
  WatchlistAddContract,
  WatchlistGetContract,
  WatchlistRemoveContract,
} from "@/lib/contracts";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

function asJsonObject(value: JsonValue | null | undefined): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as JsonObject;
}

function parseApiError(payload: JsonObject | null): string | null {
  if (!payload) return null;
  const detail = asJsonObject(payload.detail ?? null) ?? payload.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (
    detail &&
    typeof detail === "object" &&
    !Array.isArray(detail) &&
    typeof asJsonObject(detail)?.message === "string" &&
    String(asJsonObject(detail)?.message).trim()
  ) {
    return String(asJsonObject(detail)?.message);
  }
  const error = asJsonObject(payload.error ?? null);
  if (
    error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }
  return null;
}

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as JsonObject | null;
    const msg = parseApiError(payload);
    throw new Error(msg || `API ${path} failed: ${res.status}`);
  }
  return res.json();
}

// ── Market Overview ────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (payload: { email: string; password: string; display_name?: string | null }) =>
      fetchJSON<AuthRegisterContract>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    verifyRegister: (payload: { email: string; code: string }) =>
      fetchJSON<AuthTokenContract>("/api/auth/register/verify", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    resendVerification: (email: string) =>
      fetchJSON<AuthResendVerificationContract>("/api/auth/register/resend", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    login: (payload: { email: string; password: string }) =>
      fetchJSON<AuthTokenContract>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    me: (token: string) =>
      fetchJSON<AuthTokenContract["user"]>("/api/auth/me", {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      }),
    logout: (token: string) =>
      fetchJSON<{ success: boolean }>("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      }),
  },

  market: {
    sectors: () => fetchJSON("/api/market/sectors"),
    gainers: () => fetchJSON("/api/market/gainers"),
    losers: () => fetchJSON("/api/market/losers"),
    actives: () => fetchJSON("/api/market/actives"),
    hours: () => fetchJSON("/api/market/hours"),
    indices: () => fetchJSON("/api/market/indices"),
    overview: () => fetchJSON<MarketOverviewContract>("/api/market/overview"),
    aiSummary: () => fetchJSON("/api/market/ai-summary"),
    brief: () => fetchJSON<AgentBriefContract>("/api/agent/brief"),
    signalsFeed: () => fetchJSON<SignalsFeedEnvelopeContract>("/api/signals/feed"),
    mvpMarketInsights: () => fetchJSON<MvpMarketInsightsContract>("/api/mvp/market-insights"),
  },

  options: {
    chain: (symbol: string, expiry?: string, type?: string) => {
      const params = new URLSearchParams();
      if (expiry) params.set("expiration_date", expiry);
      if (type) params.set("contract_type", type);
      return fetchJSON(`/api/options/chain/${symbol}?${params}`);
    },
    expirations: (symbol: string) => fetchJSON(`/api/options/expirations/${symbol}`),
    gex: (symbol: string) => fetchJSON(`/api/options/gex/${symbol}`),
    unusual: (volOiMin?: number, volumeMin?: number) => {
      const params = new URLSearchParams();
      if (volOiMin) params.set("vol_oi_min", String(volOiMin));
      if (volumeMin) params.set("volume_min", String(volumeMin));
      return fetchJSON(`/api/options/unusual?${params}`);
    },
    atmHistory: (symbol: string, expiration: string, contractType = "call", daysBack = 60) =>
      fetchJSON(`/api/options/atm-history/${symbol}?expiration=${expiration}&contract_type=${contractType}&days_back=${daysBack}`),
    bars: (ticker: string, from: string, to: string) =>
      fetchJSON(`/api/options/bars/${ticker}?from_date=${from}&to_date=${to}`),
  },

  stock: {
    search: (q: string) => fetchJSON(`/api/stock/search?q=${encodeURIComponent(q)}`),
    quote: (symbol: string) => fetchJSON(`/api/stock/${symbol}/quote`),
    overview: (symbol: string) => fetchJSON<StockOverviewContract>(`/api/stock/${symbol}/overview`),
    profile: (symbol: string) => fetchJSON(`/api/stock/${symbol}/profile`),
    chain: (symbol: string, expiry?: string) =>
      fetchJSON(`/api/stock/${symbol}/chain${expiry ? `?expiration=${expiry}` : ""}`),
    volatility: (symbol: string) => fetchJSON(`/api/stock/${symbol}/volatility`),
    earnings: (symbol: string) => fetchJSON(`/api/stock/${symbol}/earnings-calendar`),
    financials: (symbol: string, stmt: string, period = "quarter") =>
      fetchJSON(`/api/stock/${symbol}/financials?statement=${stmt}&period=${period}`),
    metrics: (symbol: string) => fetchJSON(`/api/stock/${symbol}/metrics`),
    dcf: (symbol: string) => fetchJSON(`/api/stock/${symbol}/dcf`),
    history: (symbol: string, interval = "daily", from = "", to = "") => {
      const params = new URLSearchParams({ interval });
      if (from) params.set("from_date", from);
      if (to) params.set("to_date", to);
      return fetchJSON(`/api/stock/${symbol}/history?${params}`);
    },
    unusual: (symbol: string) => fetchJSON(`/api/stock/${symbol}/unusual`),
    strategyIdeas: (symbol: string) => fetchJSON(`/api/stock/${symbol}/strategy-ideas`),
  },

  macro: {
    calendar: (from?: string, to?: string, country?: string, impact?: string) => {
      const params = new URLSearchParams();
      if (from) params.set("from_date", from);
      if (to) params.set("to_date", to);
      if (country) params.set("country", country);
      if (impact) params.set("impact", impact);
      return fetchJSON(`/api/macro/calendar?${params}`);
    },
    treasury: (days?: number) =>
      fetchJSON(`/api/macro/treasury${days ? `?days=${days}` : ""}`),
    indicator: (name: string) =>
      fetchJSON(`/api/macro/indicator?name=${encodeURIComponent(name)}`),
  },

  etf: {
    list: () => fetchJSON("/api/etf/list"),
    holdings: (symbol: string) => fetchJSON(`/api/etf/${symbol}/holdings`),
    sectors: (symbol: string) => fetchJSON(`/api/etf/${symbol}/sectors`),
    info: (symbol: string) => fetchJSON(`/api/etf/${symbol}/info`),
  },

  news: {
    latest: (page?: number) => fetchJSON(`/api/news/latest${page ? `?page=${page}` : ""}`),
    stock: (tickers: string) => fetchJSON(`/api/news/stock?tickers=${tickers}`),
    search: (q: string) => fetchJSON(`/api/news/search?q=${encodeURIComponent(q)}`),
  },

  analyst: {
    ratings: (symbol: string) => fetchJSON(`/api/analyst/${symbol}`),
    priceTarget: (symbol: string) =>
      fetchJSON<AnalystPriceTargetContract>(`/api/analyst/${symbol}/price-target`),
  },

  feed: {
    unified: (
      limit = 100,
      ticker?: string,
      filters?: {
        kind?: string;
        sentiment?: string;
        priority?: string;
        kol_only?: boolean;
        /** Rolling window for Discord/macro rows (default 72 on backend). */
        hours?: number;
      },
    ) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (ticker) params.set("ticker", ticker);
      if (filters?.kind) params.set("kind", filters.kind);
      if (filters?.sentiment) params.set("sentiment", filters.sentiment);
      if (filters?.priority) params.set("priority", filters.priority);
      if (filters?.kol_only) params.set("kol_only", "true");
      if (filters?.hours != null && filters.hours > 0) {
        params.set("hours", String(filters.hours));
      }
      return fetchJSON<FeedEnvelopeContract>(`/api/feed/unified?${params}`);
    },
  },

  scanner: {
    run: (payload: ScannerRunPayload) =>
      fetchJSON<ScannerRunContract>("/api/scanner/run", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  social: {
    radar: (limit = 10) => fetchJSON<SocialRadarContract>(`/api/social/radar?limit=${limit}`),
    smartVsRetail: (symbol: string) =>
      fetchJSON<SmartVsRetailContract>(`/api/social/smart-vs-retail/${symbol}`),
    kolDirectory: () => fetchJSON<KolDirectoryContract>("/api/social/kol"),
    resonanceStream: (limit = 30, symbol?: string) => {
      const qs = new URLSearchParams({ limit: String(limit) });
      if (symbol?.trim()) qs.set("symbol", symbol.trim().toUpperCase());
      return fetchJSON<ResonanceStreamContract>(`/api/social/resonance?${qs}`);
    },
  },

  alerts: {
    list: (apiKey: string) =>
      fetchJSON<AlertsListEnvelopeContract>(`/api/alerts?api_key=${encodeURIComponent(apiKey)}`),
    create: (payload: {
      api_key: string;
      alert_type: string;
      symbol: string;
      threshold?: number | null;
    }) =>
      fetchJSON<AlertCreateEnvelopeContract>("/api/alerts", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  profile: {
    getPushSettings: (apiKey: string) =>
      fetchJSON<{ success: boolean; data: PushSettingsContract }>(
        `/api/profile/push-settings?api_key=${encodeURIComponent(apiKey)}`,
      ),
    savePushSettings: (payload: {
      api_key: string;
      push_discord: boolean;
      push_telegram: boolean;
      push_email: boolean;
      keywords: string;
    }) =>
      fetchJSON<{ success: boolean; data: PushSettingsContract }>(
        "/api/profile/push-settings",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      ),
    listScannerTemplates: (apiKey: string) =>
      fetchJSON<{ success: boolean; data: ScannerTemplateContract[] }>(
        `/api/profile/scanner-templates?api_key=${encodeURIComponent(apiKey)}`,
      ),
    upsertScannerTemplate: (payload: {
      api_key: string;
      template_id?: number;
      name: string;
      config: ScannerTemplateConfigContract;
    }) =>
      fetchJSON<{ success: boolean; data: ScannerTemplateContract }>(
        "/api/profile/scanner-templates",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      ),
    deleteScannerTemplate: (apiKey: string, templateId: number) =>
      fetchJSON<{ success: boolean; deleted: number }>(
        `/api/profile/scanner-templates/${templateId}?api_key=${encodeURIComponent(apiKey)}`,
        { method: "DELETE" },
      ),
  },

  watchlist: {
    get: (apiKey = "default") => fetchJSON<WatchlistGetContract>(`/api/watchlist?api_key=${apiKey}`),
    add: (symbol: string, apiKey = "default") =>
      fetchJSON<WatchlistAddContract>("/api/watchlist", {
        method: "POST",
        body: JSON.stringify({ symbol, api_key: apiKey }),
      }),
    remove: (symbol: string, apiKey = "default") =>
      fetchJSON<WatchlistRemoveContract>(`/api/watchlist/${symbol}?api_key=${apiKey}`, {
        method: "DELETE",
      }),
  },
};
