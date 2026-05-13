"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { AuthUser } from "@/lib/auth-context";

type RoleOption = "user" | "admin" | "disabled";

function parseError(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "请求失败";
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof (detail as { message: unknown }).message === "string"
  ) {
    return (detail as { message: string }).message;
  }
  return "请求失败";
}

export default function AdminUsersPage() {
  const { token, user, ready, isAdmin } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) return;
    if (!isAdmin) {
      router.replace("/");
      return;
    }
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    fetch("/api/auth/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const raw = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error(parseError(raw));
        return raw as AuthUser[];
      })
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, user, isAdmin, token, router]);

  async function patchRole(id: string, role: RoleOption) {
    if (!token) return;
    setError(null);
    const res = await fetch(`/api/auth/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(parseError(raw));
      return;
    }
    const updated = raw as AuthUser;
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  if (!ready || !user || !isAdmin) {
    return (
      <div className="p-6 text-muted text-[13px]">
        {!ready ? "加载…" : "无权限访问"}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-5xl mx-auto space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[17px] font-semibold text-foreground">用户管理</h1>
          <p className="text-[12px] text-muted mt-1">管理员可调整角色或禁用账号。</p>
        </div>
        <Link href="/settings" className="text-[12px] text-primary hover:underline">
          ← 返回设置
        </Link>
      </header>

      {error ? (
        <div className="rounded-md border border-red/40 bg-red/10 px-3 py-2 text-[12px] text-red">{error}</div>
      ) : null}

      {loading ? (
        <p className="text-muted text-[13px]">加载用户列表…</p>
      ) : (
        <div className="rounded-[10px] border border-border2 bg-panel2 overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-bg/80 text-muted uppercase tracking-wide text-[10px]">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">邮箱</th>
                <th className="text-left px-3 py-2 font-semibold">显示名</th>
                <th className="text-left px-3 py-2 font-semibold">角色</th>
                <th className="text-left px-3 py-2 font-semibold">注册时间</th>
                <th className="text-left px-3 py-2 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border2">
                  <td className="px-3 py-2 font-mono text-[11px] break-all">{r.email}</td>
                  <td className="px-3 py-2">{r.display_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        r.role === "admin"
                          ? "text-primary font-semibold"
                          : r.role === "disabled"
                            ? "text-red"
                            : ""
                      }
                    >
                      {r.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="bg-bg border border-border2 rounded px-2 py-1 text-[11px] text-text"
                      value={r.role}
                      onChange={(e) => patchRole(r.id, e.target.value as RoleOption)}
                      disabled={r.id === user.id}
                      aria-label={`role-${r.email}`}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="disabled">disabled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[10px] text-muted text-center pb-8">
        本平台仅提供数据分析和教育内容，不构成投资建议。
      </p>
    </div>
  );
}
