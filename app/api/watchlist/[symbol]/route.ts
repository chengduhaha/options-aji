import { proxyBackend } from "@/lib/proxyBackend";
export const DELETE = (req: Request, { params }: { params: Promise<{ symbol: string }> }) =>
  params.then(p => proxyBackend(`/api/watchlist/${p.symbol}`)(req));
