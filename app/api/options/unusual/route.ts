import { proxyBackend, backendBaseUrl } from "@/lib/proxyBackend";

// Mock unusual options activity for demo when backend is unavailable
const MOCK_UNUSUAL = [
  { symbol: "NVDA", type: "CALL", strike: 950, expiration: "2026-05-16", volOiRatio: 12.5, sentiment: "bullish", volume: 45000, openInterest: 3600 },
  { symbol: "AAPL", type: "PUT", strike: 180, expiration: "2026-05-09", volOiRatio: 8.2, sentiment: "bearish", volume: 32000, openInterest: 3900 },
  { symbol: "TSLA", type: "CALL", strike: 200, expiration: "2026-05-16", volOiRatio: 6.8, sentiment: "bullish", volume: 28000, openInterest: 4100 },
  { symbol: "SPY", type: "PUT", strike: 520, expiration: "2026-05-09", volOiRatio: 5.3, sentiment: "bearish", volume: 52000, openInterest: 9800 },
  { symbol: "META", type: "CALL", strike: 550, expiration: "2026-05-23", volOiRatio: 4.7, sentiment: "bullish", volume: 18000, openInterest: 3800 },
];

export const GET = async (req: Request) => {
  // If backend is not configured, return mock data
  if (!backendBaseUrl()) {
    return Response.json({
      unusual: MOCK_UNUSUAL,
      total: MOCK_UNUSUAL.length,
      _mock: true,
    });
  }
  
  return proxyBackend("/api/options/unusual")(req);
};
