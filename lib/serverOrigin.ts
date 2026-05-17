import { headers } from "next/headers";

/**
 * Build absolute origin for same-host API routes in Server Components
 * (middleware may set x-forwarded-*).
 */
export async function getServerOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "127.0.0.1:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
