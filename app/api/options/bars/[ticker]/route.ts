import { proxyBackend } from "@/lib/proxyBackend";
export const GET = (req: Request, { params }: { params: Promise<{ ticker: string }> }) =>
  params.then(p => proxyBackend(`/api/options/bars/${p.ticker}`)(req));