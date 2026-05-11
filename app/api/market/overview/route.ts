import type { NextRequest } from "next/server";

import { proxyToBackend, backendBaseUrl } from "@/lib/proxyBackend";

export const runtime = "nodejs";

// Mock market overview data for demo when backend is unavailable
const MOCK_OVERVIEW = {
  generatedAt: new Date().toISOString(),
  marketSessionLabel: "盘前交易",
  pulse: [
    { symbol: "SPY", yahooSymbol: "SPY", price: 528.45, changePct: 0.32 },
    { symbol: "QQQ", yahooSymbol: "QQQ", price: 452.18, changePct: 0.58 },
    { symbol: "IWM", yahooSymbol: "IWM", price: 208.92, changePct: -0.15 },
    { symbol: "DIA", yahooSymbol: "DIA", price: 398.67, changePct: 0.21 },
    { symbol: "VIX", yahooSymbol: "^VIX", price: 14.82, changePct: -2.35, invertColors: true },
  ],
  volatility: {
    vix: 14.82,
    vixChangePct: -2.35,
    band: "低波动",
    vixSeries: [16.2, 15.8, 15.5, 15.1, 14.9, 14.7, 14.82],
    termStructure: { structure: "Contango", front: 14.82, second: 15.45 },
  },
  liquidity: {
    putCallRatioVolumeApprox: 0.85,
    methodology: "通过 watchlist 估算全市场 P/C，非交易所官方口径。",
    symbolsSampled: ["SPY", "QQQ", "AAPL", "NVDA", "TSLA"],
  },
  unusual: [
    { symbol: "NVDA", type: "CALL", strike: 950, expiration: "2026-05-16", volOiRatio: 12.5, sentiment: "bullish" },
    { symbol: "AAPL", type: "PUT", strike: 180, expiration: "2026-05-09", volOiRatio: 8.2, sentiment: "bearish" },
    { symbol: "TSLA", type: "CALL", strike: 200, expiration: "2026-05-16", volOiRatio: 6.8, sentiment: "bullish" },
  ],
  earnings: [
    { symbol: "DIS", date: "2026-05-07", note: "盘后" },
    { symbol: "UBER", date: "2026-05-08", note: "盘前" },
    { symbol: "ARM", date: "2026-05-08", note: "盘后" },
  ],
  gexQuick: [
    { symbol: "SPY", netGex: 2450000000, gammaFlip: 525, regime: "正 Gamma" },
    { symbol: "QQQ", netGex: 890000000, gammaFlip: 448, regime: "正 Gamma" },
  ],
  _mock: true,
};

export async function GET(req: NextRequest) {
  // If backend is not configured, return mock data
  if (!backendBaseUrl()) {
    return Response.json(MOCK_OVERVIEW);
  }
  
  return proxyToBackend(req, "/api/market/overview");
}
