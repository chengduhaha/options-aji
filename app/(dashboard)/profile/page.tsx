"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { OPTIONS_AJI_API_KEY_LS, type AlertContract } from "@/lib/contracts";

export default function ProfilePage() {
  const { user, ready, token, refreshMe, loading: authLoading } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [wlSymbols, setWlSymbols] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<AlertContract[]>([]);
  const [wlBusy, setWlBusy] = useState(false);
  const [wlMsg, setWlMsg] = useState<string | null>(null);
  const [alertsMsg, setAlertsMsg] = useState<string | null>(null);
  const [newSym, setNewSym] = useState("");
  const [alertType, setAlertType] = useState("resonance");
  const [alertSymbol, setAlertSymbol] = useState("SPY");
  const [alertThreshold, setAlertThreshold] = useState("70");
  const [meBusy, setMeBusy] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(OPTIONS_AJI_API_KEY_LS);
      if (v) setApiKey(v);
    } catch {
      /* ignore */
    }
  }, []);

  const loadIntegration = useCallback(async () => {
    const key = apiKey.trim();
    if (key.length < 8) {
      setWlSymbols([]);
      setAlerts([]);
      return;
    }
    setWlBusy(true);
    setWlMsg(null);
    setAlertsMsg(null);
    try {
      const [wl, al] = await Promise.all([api.watchlist.get(key), api.alerts.list(key)]);
      setWlSymbols(wl.symbols);
      setAlerts(al.data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "加载失败";
      setWlMsg(msg);
    } finally {
      setWlBusy(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void loadIntegration();
  }, [loadIntegration]);

  const persistKey = (raw: string) => {
    const v = raw.trim();
    setApiKey(v);
    try {
      if (v.length >= 8) window.localStorage.setItem(OPTIONS_AJI_API_KEY_LS, v);
      else window.localStorage.removeItem(OPTIONS_AJI_API_KEY_LS);
    } catch {
      /* ignore */
    }
  };

  const addWatch = async () => {
    const sym = newSym.trim().toUpperCase();
    const key = apiKey.trim();
    if (!sym || key.length < 8) {
      setWlMsg("请输入标的，并确认 API Key 已保存（≥8 字符）");
      return;
    }
    setWlBusy(true);
    setWlMsg(null);
    try {
      await api.watchlist.add(sym, key);
      setNewSym("");
      await loadIntegration();
    } catch (e) {
      setWlMsg(e instanceof Error ? e.message : "添加失败");
    } finally {
      setWlBusy(false);
    }
  };

  const removeWatch = async (sym: string) => {
    const key = apiKey.trim();
    if (key.length < 8) return;
    setWlBusy(true);
    setWlMsg(null);
    try {
      await api.watchlist.remove(sym, key);
      await loadIntegration();
    } catch (e) {
      setWlMsg(e instanceof Error ? e.message : "删除失败");
    } finally {
      setWlBusy(false);
    }
  };

  const createAlert = async () => {
    const key = apiKey.trim();
    if (key.length < 8) {
      setAlertsMsg("请先在下方保存 Integration API Key");
      return;
    }
    const sym = alertSymbol.trim().toUpperCase();
    const th = Number(alertThreshold);
    setAlertsMsg(null);
    try {
      await api.alerts.create({
        api_key: key,
        alert_type: alertType,
        symbol: sym,
        threshold: Number.isFinite(th) ? th : null,
      });
      setAlertSymbol(sym);
      await loadIntegration();
      setAlertsMsg("已创建");
    } catch (e) {
      setAlertsMsg(e instanceof Error ? e.message : "创建失败");
    }
  };

  const handleRefreshMe = async () => {
    if (!token) return;
    setMeBusy(true);
    try {
      await refreshMe();
    } finally {
      setMeBusy(false);
    }
  };

  if (!ready || authLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground gap-2 text-[13px]">
        <Loader2 className="w-4 h-4 animate-spin" />
        加载会话…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 max-w-3xl">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-primary" />
          个人中心
        </h1>
        <p className="text-[12px] text-muted-foreground">
          自选与提醒绑定 Integration API Key；账户信息来自 JWT。未登录仅显示部分能力。
        </p>
      </header>

      {!user ? (
        <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3 text-[13px]">
          <p className="text-foreground/95 leading-relaxed">
            登录后可查看邮箱与角色等账户摘要；您仍可在下方用 API Key 管理自选与提醒。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login?next=/profile"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-95"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-glass-border text-[13px] hover:border-primary/30"
            >
              注册
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-glass-border bg-glass/40 p-4 space-y-3">
          <h2 className="text-[13px] font-semibold text-foreground flex items-center justify-between gap-2">
            账户摘要
            <button
              type="button"
              onClick={() => void handleRefreshMe()}
              disabled={meBusy}
              className="text-[11px] text-primary hover:underline disabled:opacity-50"
            >
              {meBusy ? "刷新中…" : "刷新 /me"}
            </button>
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] font-mono">
            <div>
              <dt className="text-muted-foreground text-[10px] uppercase tracking-wide">Email</dt>
              <dd className="text-foreground truncate" title={user.email}>
                {user.email}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[10px] uppercase tracking-wide">显示名</dt>
              <dd className="text-foreground">{user.display_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[10px] uppercase tracking-wide">角色</dt>
              <dd className="text-foreground">{user.role}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[10px] uppercase tracking-wide">邮箱验证</dt>
              <dd className="text-foreground">{user.email_verified ? "已验证" : "未验证"}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="rounded-xl border border-glass-border bg-glass/40 p-4 space-y-3">
        <h2 className="text-[13px] font-semibold text-foreground">Integration API Key</h2>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          用于自选、提醒与推送设置；与「设置」页共用{" "}
          <span className="font-mono text-foreground/90">{OPTIONS_AJI_API_KEY_LS}</span>{" "}
          本地存储。
        </p>
        <input
          value={apiKey}
          onChange={(e) => persistKey(e.target.value)}
          placeholder="至少 8 位"
          className="w-full rounded-lg border border-glass-border bg-background/80 px-3 py-2 text-[13px] font-mono"
        />
        <button
          type="button"
          onClick={() => void loadIntegration()}
          disabled={wlBusy}
          className="text-[12px] px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50"
        >
          重新加载自选 / 提醒
        </button>
      </section>

      <section className="rounded-xl border border-glass-border bg-glass/40 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold text-foreground">自选列表</h2>
          {wlBusy ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : null}
        </div>
        {wlMsg ? <p className="text-[12px] text-red">{wlMsg}</p> : null}
        <div className="flex flex-wrap gap-2">
          <input
            value={newSym}
            onChange={(e) => setNewSym(e.target.value.toUpperCase())}
            placeholder="例如 NVDA"
            className="flex-1 min-w-[120px] rounded-lg border border-glass-border bg-background/80 px-3 py-2 text-[13px] font-mono uppercase"
          />
          <button
            type="button"
            onClick={() => void addWatch()}
            disabled={wlBusy}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50"
          >
            添加
          </button>
        </div>
        {wlSymbols.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">暂无自选（或 API Key 未配置）。</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {wlSymbols.map((s) => (
              <li
                key={s}
                className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-background/60 border border-glass-border text-[12px] font-mono"
              >
                <Link href={`/stock/${s}/overview`} className="text-primary hover:underline">
                  {s}
                </Link>
                <button
                  type="button"
                  onClick={() => void removeWatch(s)}
                  disabled={wlBusy}
                  className="text-[11px] text-red px-1.5 py-0.5 rounded hover:bg-red/10 disabled:opacity-50"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-glass-border bg-glass/40 p-4 space-y-3">
        <h2 className="text-[13px] font-semibold text-foreground">提醒</h2>
        {alertsMsg ? (
          <p
            className={`text-[12px] ${alertsMsg.startsWith("已") ? "text-green" : "text-red"}`}
          >
            {alertsMsg}
          </p>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
          <label className="space-y-1 block">
            <span className="text-[10px] text-muted-foreground uppercase">类型</span>
            <input
              value={alertType}
              onChange={(e) => setAlertType(e.target.value)}
              className="w-full rounded-lg border border-glass-border bg-background/80 px-2 py-1.5 font-mono"
            />
          </label>
          <label className="space-y-1 block">
            <span className="text-[10px] text-muted-foreground uppercase">标的</span>
            <input
              value={alertSymbol}
              onChange={(e) => setAlertSymbol(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-glass-border bg-background/80 px-2 py-1.5 font-mono uppercase"
            />
          </label>
          <label className="space-y-1 block sm:col-span-2">
            <span className="text-[10px] text-muted-foreground uppercase">阈值（可选）</span>
            <input
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full rounded-lg border border-glass-border bg-background/80 px-2 py-1.5 font-mono"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void createAlert()}
          className="px-4 py-2 rounded-lg border border-accent/40 text-accent text-[12px] font-medium hover:bg-accent/10"
        >
          创建提醒
        </button>
        {alerts.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">暂无提醒。</p>
        ) : (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto text-[12px] font-mono">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap gap-x-3 gap-y-0.5 border-b border-glass-border/60 pb-1.5"
              >
                <span className="text-foreground">{a.symbol}</span>
                <span className="text-muted-foreground">{a.alert_type}</span>
                {typeof a.threshold === "number" ? (
                  <span className="text-muted-foreground">threshold {a.threshold}</span>
                ) : null}
                <span className="text-[10px] text-muted-foreground">{a.created_at}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-glass-border bg-glass/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground">更多</h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            部署基线与预发布检查清单见后端仓库{" "}
            <code className="text-foreground/90">RELEASE_CHECKLIST.md</code>。
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 self-start sm:self-center px-4 py-2 rounded-lg bg-primary/10 border border-primary/25 text-primary text-[12px] font-medium hover:bg-primary/15"
        >
          前往设置 / 集成
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </Link>
      </section>
    </div>
  );
}
