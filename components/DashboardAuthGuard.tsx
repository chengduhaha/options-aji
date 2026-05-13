"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (user) return;
    const qs = new URLSearchParams();
    qs.set("next", pathname || "/");
    router.replace(`/login?${qs.toString()}`);
  }, [ready, user, router, pathname]);

  if (!ready || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground text-[13px]">
        加载会话…
      </div>
    );
  }

  return children;
}
