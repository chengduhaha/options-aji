"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const PUBLIC_DASHBOARD_PREFIXES = ["/profile"];

function isPublicDashboardPath(path: string | null): boolean {
  if (!path) return false;
  return PUBLIC_DASHBOARD_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export default function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (user) return;
    if (isPublicDashboardPath(pathname)) return;
    const qs = new URLSearchParams();
    qs.set("next", pathname || "/");
    router.replace(`/login?${qs.toString()}`);
  }, [ready, user, router, pathname]);

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground text-[13px]">
        加载会话…
      </div>
    );
  }

  if (!user && isPublicDashboardPath(pathname)) {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground text-[13px]">
        重定向到登录…
      </div>
    );
  }

  return children;
}
