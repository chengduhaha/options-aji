import { proxyToBackend } from "@/lib/proxyBackend";
import type { NextRequest } from "next/server";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ templateId: string }> },
) {
  const { templateId } = await context.params;
  const qs = req.nextUrl.search ? req.nextUrl.search : "";
  return proxyToBackend(req, `/api/profile/scanner-templates/${encodeURIComponent(templateId)}${qs}`, {
    method: "DELETE",
  });
}
