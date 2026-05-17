"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { ready, user, register, verifyRegistration } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<"register" | "verify">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  async function onRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const resp = await register(email.trim(), password, displayName.trim() || undefined);
      setPendingEmail(resp.user.email);
      setVerificationExpiresAt(resp.verification_expires_at);
      setDebugCode(resp.verification_code);
      setPhase("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await verifyRegistration(pendingEmail, code.trim());
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "验证失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border2 bg-panel2 p-8 shadow-xl">
        <h1 className="text-[18px] font-semibold text-foreground mb-1">
          {phase === "register" ? "注册账号" : "邮箱验证"}
        </h1>
        <p className="text-[12px] text-muted mb-6">
          {phase === "register"
            ? "密码至少 8 位，且需同时包含字母与数字。"
            : `请输入发送到 ${pendingEmail} 的验证码。`}
        </p>
        {phase === "register" ? (
          <form onSubmit={onRegisterSubmit} className="space-y-4">
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
              {busy ? "提交中…" : "注册"}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerifySubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] text-muted uppercase tracking-wide mb-1">验证码</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full bg-bg border border-border2 rounded-md px-3 py-2 text-[13px] text-text"
              />
            </div>
            {verificationExpiresAt ? (
              <p className="text-[11px] text-muted">有效期至：{new Date(verificationExpiresAt).toLocaleString()}</p>
            ) : null}
            {debugCode ? (
              <p className="text-[11px] text-primary">开发环境验证码：{debugCode}</p>
            ) : null}
            {error ? <p className="text-[12px] text-red">{error}</p> : null}
            <button
              type="submit"
              disabled={busy || !ready}
              className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold disabled:opacity-50"
            >
              {busy ? "验证中…" : "验证并登录"}
            </button>
            <button
              type="button"
              onClick={() => setPhase("register")}
              className="w-full py-2.5 rounded-md border border-border2 text-[13px] text-muted-foreground hover:text-foreground"
            >
              返回修改注册信息
            </button>
          </form>
        )}
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
