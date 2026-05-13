"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { ready, user, register } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(email.trim(), password, displayName.trim() || undefined);
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border2 bg-panel2 p-8 shadow-xl">
        <h1 className="text-[18px] font-semibold text-foreground mb-1">注册账号</h1>
        <p className="text-[12px] text-muted mb-6">密码至少 8 位，且需同时包含字母与数字。</p>
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
            <label className="block text-[11px] text-muted uppercase tracking-wide mb-1">显示名（可选）</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={128}
              className="w-full bg-bg border border-border2 rounded-md px-3 py-2 text-[13px] text-text"
            />
          </div>
          <div>
            <label className="block text-[11px] text-muted uppercase tracking-wide mb-1">密码</label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-bg border border-border2 rounded-md px-3 py-2 text-[13px] text-text"
            />
          </div>
          {error ? <p className="text-[12px] text-red">{error}</p> : null}
          <button
            type="submit"
            disabled={busy || !ready}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold disabled:opacity-50"
          >
            {busy ? "提交中…" : "注册并登录"}
          </button>
        </form>
        <p className="mt-4 text-[12px] text-muted text-center">
          已有账号？{" "}
          <Link href="/login" className="text-primary hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
