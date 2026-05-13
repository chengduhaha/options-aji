"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

function LoginInner() {
  const { ready, user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(nextPath);
  }, [ready, user, router, nextPath]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace(nextPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border2 bg-panel2 p-8 shadow-xl">
        <h1 className="text-[18px] font-semibold text-foreground mb-1">登录 OptionsAji</h1>
        <p className="text-[12px] text-muted mb-6">使用邮箱与密码访问控制台。</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-muted uppercase tracking-wide mb-1">邮箱</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-bg border border-border2 rounded-md px-3 py-2 text-[13px] text-text"
            />
          </div>
          <div>
            <label className="block text-[11px] text-muted uppercase tracking-wide mb-1">密码</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-bg border border-border2 rounded-md px-3 py-2 text-[13px] text-text"
            />
          </div>
          {error ? <p className="text-[12px] text-red">{error}</p> : null}
          <button
            type="submit"
            disabled={busy || !ready}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold disabled:opacity-50"
          >
            {busy ? "登录中…" : "登录"}
          </button>
        </form>
        <p className="mt-4 text-[12px] text-muted text-center">
          没有账号？{" "}
          <Link href="/register" className="text-primary hover:underline">
            注册
          </Link>
          {" · "}
          <Link href="/landing" className="text-muted-foreground hover:underline">
            产品介绍
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted text-[13px]">
          加载…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
