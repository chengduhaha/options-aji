import { proxyBackend } from "@/lib/proxyBackend";

export const GET = proxyBackend("/api/alerts");
export const POST = proxyBackend("/api/alerts");
