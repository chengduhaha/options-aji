/**
 * Typed API client for OptionsAji backend.
 * All calls go through Next.js /api proxy routes.
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE || "";

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ── Market Overview ────────────────────────────────────────────────────────────
export const api = {
  market: {
    sectors: () => fetchJSON("/api/market/sectors"),
    gainers: () => fetchJSON("/api/market/gainers"),
    losers: () => fetchJSON("/api/market/losers"),
    actives: () => fetchJSON("/api/market/actives"),
    hours: () => fetchJSON("/api/market/hours"),
    indices: () => fetchJSON("/api/market/indices"),
    overview: () => fetchJSON("/api/market/overview"),
    aiSummary: () => fetchJSON("/api/market/ai-summary"),
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
  },

  stock: {
    search: (q: string) => fetchJSON(`/api/stock/search?q=${encodeURIComponent(q)}`),
    quote: (symbol: string) => fetchJSON(`/api/stock/${symbol}/quote`),
    overview: (symbol: string) => fetchJSON(`/api/stock/${symbol}/overview`),
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

  insider: {
    latest: (limit?: number) => fetchJSON(`/api/insider/latest${limit ? `?limit=${limit}` : ""}`),
    bySymbol: (symbol: string) => fetchJSON(`/api/insider/${symbol}`),
  },

  congress: {
    latest: (chamber?: string) =>
      fetchJSON(`/api/congress/latest${chamber ? `?chamber=${chamber}` : ""}`),
    bySymbol: (symbol: string) => fetchJSON(`/api/congress/${symbol}`),
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
    priceTarget: (symbol: string) => fetchJSON(`/api/analyst/${symbol}/price-target`),
  },

  watchlist: {
    get: (apiKey = "default") => fetchJSON(`/api/watchlist?api_key=${apiKey}`),
    add: (symbol: string, apiKey = "default") =>
      fetchJSON("/api/watchlist", { method: "POST", body: JSON.stringify({ symbol, api_key: apiKey }) }),
    remove: (symbol: string, apiKey = "default") =>
      fetchJSON(`/api/watchlist/${symbol}?api_key=${apiKey}`, { method: "DELETE" }),
  },
};
