import { proxyBackend } from "@/lib/proxyBackend";
export const GET = (req: Request, { params }: { params: Promise<{ symbol: string }> }) =>
  params.then(p => proxyBackend(`/api/analyst/${p.symbol}`)(req));
