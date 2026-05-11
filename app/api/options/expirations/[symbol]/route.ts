import { proxyBackend, backendBaseUrl } from "@/lib/proxyBackend";

// Mock expiration dates for demo when backend is unavailable
function getMockExpirations(): string[] {
  const today = new Date();
  const expirations: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + (i + 1) * 7); // Weekly expirations
    expirations.push(d.toISOString().split("T")[0]);
  }
  return expirations;
}

export const GET = async (req: Request, { params }: { params: Promise<{ symbol: string }> }) => {
  const p = await params;
  
  // If backend is not configured, return mock data
  if (!backendBaseUrl()) {
    return Response.json({
      symbol: p.symbol,
      expirations: getMockExpirations(),
      _mock: true,
    });
  }
  
  return proxyBackend(`/api/options/expirations/${p.symbol}`)(req);
};
