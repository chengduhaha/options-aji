import { proxyBackend } from "@/lib/proxyBackend";
export const GET = (req: Request, { params }: { params: Promise<{ symbol: string }> }) =>
  params.then(p => proxyBackend(`/api/options/chain/${p.symbol}`)(req));
