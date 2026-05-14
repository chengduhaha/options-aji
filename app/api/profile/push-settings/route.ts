import { proxyBackend } from "@/lib/proxyBackend";

export const GET = proxyBackend("/api/profile/push-settings");
export const POST = proxyBackend("/api/profile/push-settings");
