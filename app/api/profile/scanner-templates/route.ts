import { proxyBackend } from "@/lib/proxyBackend";

export const GET = proxyBackend("/api/profile/scanner-templates");
export const POST = proxyBackend("/api/profile/scanner-templates");
