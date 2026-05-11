import { proxyBackend } from "@/lib/proxyBackend";
export const POST = (req: Request) => proxyBackend("/api/portfolio/greeks", { method: "POST" })(req);