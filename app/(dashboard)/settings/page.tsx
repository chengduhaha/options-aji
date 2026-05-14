"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

type IntegrationPayload = {
  generated_at_utc?: string;
  discord?: {
    discord_listener_setting: boolean;
    token_present: boolean;
    channel_ids: string[];
    channel_ids_count: number;
    newest_message_age_seconds?: number | null;
    stored_message_count_total: number;
    hints: string[];
    recent_preview: Array<{
      id: string;
      channel_id: string;
      author: string | null;
      timestamp: string;
      tickers: string[];
      content_preview: string;
    }>;
  };
  options_via_yfinance?: {
    symbol: string;
    quote: Record<string, unknown>;
    option_chain_summary: Record<string, unknown>;
  };
  stripe_billing_configured?: boolean;
};

const API_KEY_LS = "optionsaji_api_key";

type BillingStatusPayload = {
  registered?: boolean;
  plan?: string | null;
  stripe_customer_id?: string | null;
  current_period_end_utc?: string | null;
  agent_queries_today?: number;
  free_daily_limit?: number;
  stripe_configured?: boolean;
};

type AlertItem = {
  id: number;
  alert_type: string;
  symbol: string;
  threshold?: number | null;
  enabled: boolean;
  created_at: string;
};

export default function SettingsPage() {
  const { user, logout, isAdmin } = useAuth();
  const [data, setData] = useState<IntegrationPayload | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [billingStatus, setBillingStatus] = useState<BillingStatusPayload | null>(null);
  const [billingMsg, setBillingMsg] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertType, setAlertType] = useState("resonance");
  const [alertSymbol, setAlertSymbol] = useState("SPY");
  const [alertThreshold, setAlertThreshold] = useState("70");
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [pushDiscord, setPushDiscord] = useState(true);
  const [pushTelegram, setPushTelegram] = useState(false);
  const [pushEmail, setPushEmail] = useState(false);
  const [pushKeywords, setPushKeywords] = useState("NVDA, TSLA, CPI, FOMC");
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(API_KEY_LS);
      if (v) setApiKey(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!apiKey || apiKey.length < 8) {
      setBillingStatus(null);
      return;
    }
    let cancel = false;
    fetch("/api/billing/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    })
      .then(async (r) => {
        const j = (await r.json()) as BillingStatusPayload;
        if (!cancel) setBillingStatus(j);
      })
      .catch(() => {
        if (!cancel) setBillingStatus(null);
      });
    return () => {
      cancel = true;
    };
  }, [apiKey]);

  useEffect(() => {
    const key = apiKey.trim();
    if (key.length < 8) return;
    let cancel = false;
    api.profile
      .getPushSettings(key)
      .then((payload) => {
        if (cancel) return;
        setPushDiscord(Boolean(payload.data.push_discord));
        setPushTelegram(Boolean(payload.data.push_telegram));
        setPushEmail(Boolean(payload.data.push_email));
        setPushKeywords(payload.data.keywords || "");
      })
      .catch(() => {
        if (!cancel) setPushMsg("推送设置读取失败，已使用本地默认值。");
      });
    return () => {
      cancel = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey || apiKey.length < 8) {
      setAlerts([]);
      return;
    }
    let cancel = false;
    fetch(`/api/alerts?api_key=${encodeURIComponent(apiKey)}`, { cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json()) as { data?: AlertItem[] };
        if (!cancel) setAlerts(json.data ?? []);
      })
      .catch(() => {
        if (!cancel) setAlerts([]);
      });
    return () => {
      cancel = true;
    };
  }, [apiKey]);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetch("/api/integration/status?symbol=SPY")
      .then(async (resp) => {
        const txt = await resp.text();
        if (!resp.ok) {
          throw new Error(txt || `HTTP ${resp.status}`);
        }
        try {
          return JSON.parse(txt) as IntegrationPayload;
        } catch {
          throw new Error("响应不是合法 JSON");
        }
      })
      .then((json) => {
        if (!cancel) {
          setData(json);
          setErrorText(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancel)
          setErrorText(err instanceof Error ? err.message : "请求失败");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });

    return () => {
      cancel = true;
    };
  }, []);

  const dq = data?.discord;

  async function persistApiKey() {
    setBillingMsg(null);
    try {
      window.localStorage.setItem(API_KEY_LS, apiKey.trim());
      setBillingMsg("已保存到浏览器本地。AI 分析师请求请使用 Header：Authorization: Bearer <同一密钥>。");
    } catch (e: unknown) {
      setBillingMsg(e instanceof Error ? e.message : "保存失败");
    }
  }

  async function startCheckout() {
    setBillingMsg(null);
    const k = apiKey.trim();
    if (k.length < 8) {
      setBillingMsg("请先输入至少 8 位 API 密钥并保存。");
      return;
    }
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: k }),
    });
    const j = (await res.json()) as { url?: string; detail?: unknown };
    if (!res.ok) {
      setBillingMsg(typeof j.detail === "string" ? j.detail : "结账创建失败");
      return;
    }
    if (j.url) window.location.href = j.url;
  }

  async function openPortal() {
    setBillingMsg(null);
    const k = apiKey.trim();
    if (k.length < 8) return;
    const res = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: k }),
    });
    const j = (await res.json()) as { url?: string };
    if (!res.ok) {
      setBillingMsg("客户门户打开失败（可能尚未完成首次结账）。");
      return;
    }
    if (j.url) window.location.href = j.url;
  }

  async function createAlert() {
    setAlertMsg(null);
    const key = apiKey.trim();
    if (key.length < 8) {
      setAlertMsg("请先配置 API 密钥。");
      return;
    }
    const threshold = Number(alertThreshold);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        alert_type: alertType,
        symbol: alertSymbol.trim().toUpperCase(),
        threshold: Number.isFinite(threshold) ? threshold : null,
      }),
    });
    if (!res.ok) {
      setAlertMsg("预警创建失败。");
      return;
    }
    setAlertMsg("预警创建成功。");
    const refresh = await fetch(`/api/alerts?api_key=${encodeURIComponent(key)}`);
    const payload = (await refresh.json()) as { data?: AlertItem[] };
    setAlerts(payload.data ?? []);
  }

  async function savePushSettings() {
    setPushMsg(null);
    const key = apiKey.trim();
    if (key.length < 8) {
      setPushMsg("请先保存 API 密钥。");
      return;
    }
    try {
      await api.profile.savePushSettings({
        api_key: key,
        push_discord: pushDiscord,
        push_telegram: pushTelegram,
        push_email: pushEmail,
        keywords: pushKeywords,
      });
      setPushMsg("推送设置已保存。");
    } catch {
      setPushMsg("推送设置保存失败。");
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto space-y-6 text-[13px] text-text">
      <header>
        <h1 className="text-[17px] font-semibold mb-1">设置</h1>
        <p className="text-muted text-[12px] leading-relaxed">
          对接自检：Discord 存档与美股期权链路（后端 Phase1 使用 yfinance，后续可替换 OpenBB Platform）。
        </p>
        <Link
          href="/settings/deployment"
          className="inline-flex mt-2 text-[12px] text-blue hover:underline"
        >
          打开部署健康检查 →
        </Link>
      </header>

      <section className="rounded-[10px] border border-border2 bg-panel2 p-4 space-y-3">
        <h2 className="text-[13px] font-semibold text-muted uppercase tracking-wide">账户</h2>
        {user ? (
          <dl className="grid grid-cols-1 gap-2 text-[12px] max-w-lg">
            <div>
              <dt className="text-muted">邮箱</dt>
              <dd className="font-mono text-text break-all">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted">角色</dt>
              <dd className="font-mono text-gold">{user.role}</dd>
            </div>
            <div>
              <dt className="text-muted">注册时间</dt>
              <dd className="font-mono text-[11px]">
                {user.created_at ? new Date(user.created_at).toLocaleString() : "—"}
              </dd>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => logout()}
                className="text-[12px] px-3 py-1.5 rounded-md border border-border2 text-text hover:border-red/50 hover:text-red"
              >
                退出登录
              </button>
              {isAdmin ? (
                <Link
                  href="/admin/users"
                  className="text-[12px] px-3 py-1.5 rounded-md border border-gold text-gold hover:bg-gold/10 inline-flex items-center"
                >
                  用户管理 →
                </Link>
              ) : null}
            </div>
          </dl>
        ) : (
          <p className="text-muted text-[12px]">未加载用户信息。</p>
        )}
      </section>

      <section className="rounded-[10px] border border-border2 bg-panel2 p-4 space-y-3">
        <h2 className="text-[13px] font-semibold text-muted uppercase tracking-wide">预警中心</h2>
        <p className="text-[12px] text-muted">
          支持共振、异动和情绪阈值预警。当前版本提供基础订阅，后续可扩展 Telegram / Email 推送。
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={alertType}
            onChange={(e) => setAlertType(e.target.value)}
            className="bg-bg border border-border2 rounded-md px-2 py-1.5 text-[12px]"
          >
            <option value="resonance">共振信号</option>
            <option value="unusual_option">异动期权</option>
            <option value="sentiment_score">情绪阈值</option>
          </select>
          <input
            value={alertSymbol}
            onChange={(e) => setAlertSymbol(e.target.value.toUpperCase())}
            className="bg-bg border border-border2 rounded-md px-2 py-1.5 text-[12px] font-mono w-24"
          />
          <input
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(e.target.value)}
            className="bg-bg border border-border2 rounded-md px-2 py-1.5 text-[12px] font-mono w-24"
          />
          <button
            type="button"
            onClick={createAlert}
            className="text-[12px] px-3 py-1.5 rounded-md border border-gold text-gold"
          >
            新建预警
          </button>
        </div>
        {alertMsg ? <p className="text-[11px] text-gold">{alertMsg}</p> : null}
        <div className="space-y-2">
          {alerts.map((item) => (
            <div key={item.id} className="text-[11px] bg-bg/60 border border-border2 rounded-md px-3 py-2">
              <span className="font-mono text-gold">{item.symbol}</span>
              <span className="mx-2 text-muted">{item.alert_type}</span>
              <span className="font-mono text-text">{item.threshold ?? "—"}</span>
            </div>
          ))}
          {alerts.length === 0 ? <p className="text-[11px] text-muted">暂无预警。</p> : null}
        </div>
      </section>

      <section className="rounded-[10px] border border-border2 bg-panel2 p-4 space-y-3">
        <h2 className="text-[13px] font-semibold text-muted uppercase tracking-wide">推送设置</h2>
        <p className="text-[12px] text-muted">
          用于配置统一信息流推送渠道与关键词触发规则。当前配置保存在浏览器本地，后续将同步到后端用户配置。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <label className="text-[12px] flex items-center gap-2">
            <input type="checkbox" checked={pushDiscord} onChange={(e) => setPushDiscord(e.target.checked)} />
            Discord
          </label>
          <label className="text-[12px] flex items-center gap-2">
            <input type="checkbox" checked={pushTelegram} onChange={(e) => setPushTelegram(e.target.checked)} />
            Telegram
          </label>
          <label className="text-[12px] flex items-center gap-2">
            <input type="checkbox" checked={pushEmail} onChange={(e) => setPushEmail(e.target.checked)} />
            Email
          </label>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted uppercase tracking-wide">关键词触发</label>
          <input
            value={pushKeywords}
            onChange={(e) => setPushKeywords(e.target.value)}
            className="w-full bg-bg border border-border2 rounded-md px-2 py-1.5 text-[12px] font-mono"
            placeholder="逗号分隔关键词"
          />
          <p className="text-[10px] text-muted">示例：NVDA, VIX, CPI, FOMC, BREAKOUT</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={savePushSettings}
            className="text-[12px] px-3 py-1.5 rounded-md border border-gold text-gold"
          >
            保存推送设置
          </button>
          {pushMsg ? <span className="text-[11px] text-gold">{pushMsg}</span> : null}
        </div>
      </section>

      <section className="rounded-[10px] border border-border2 bg-panel2 p-4 space-y-3">
        <h2 className="text-[13px] font-semibold text-muted uppercase tracking-wide">
          订阅与用量（Stripe）
        </h2>
        <p className="text-[12px] text-muted leading-relaxed">
          自管 API 密钥模式：自定义一串密钥（≥8 字符），在下方完成 Stripe 结账后，后端将其与 Stripe
          客户绑定。调用 AI 分析师时使用{" "}
          <code className="text-gold">Authorization: Bearer &lt;密钥&gt;</code>。
          未配置 Stripe 时本节按钮将不可用；开发环境可继续用后端{" "}
          <code className="text-gold">SUBSCRIPTION_TOKENS</code>。
        </p>
        {data?.stripe_billing_configured ? (
          <p className="text-[11px] text-green">后端已配置 Stripe Price / Secret，可开启结账。</p>
        ) : (
          <p className="text-[11px] text-muted">集成状态中 Stripe 未就绪：请在 backend 配置 STRIPE_SECRET_KEY 与 STRIPE_PRICE_ID_PRO。</p>
        )}
        <div className="flex flex-col gap-2 max-w-lg">
          <label className="text-[11px] text-muted uppercase tracking-wide">API 密钥</label>
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-bg border border-border2 rounded-md px-2 py-1.5 text-text text-[13px] font-mono"
            placeholder="例如 dev-my-secret-key-01"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={persistApiKey}
              className="text-[12px] px-3 py-1.5 rounded-md border border-border2 text-text hover:border-gold"
            >
              保存到本地
            </button>
            <button
              type="button"
              onClick={startCheckout}
              disabled={!data?.stripe_billing_configured}
              className="text-[12px] px-3 py-1.5 rounded-md border border-gold text-gold disabled:opacity-40"
            >
              前往 Stripe 结账（Pro）
            </button>
            <button
              type="button"
              onClick={openPortal}
              disabled={!data?.stripe_billing_configured}
              className="text-[12px] px-3 py-1.5 rounded-md border border-border2 text-muted disabled:opacity-40"
            >
              管理订阅（客户门户）
            </button>
          </div>
        </div>
        {billingMsg ? <p className="text-[11px] text-gold whitespace-pre-wrap">{billingMsg}</p> : null}
        {billingStatus?.registered ? (
          <dl className="grid grid-cols-2 gap-2 text-[12px] max-w-lg border border-border2 rounded-md p-3 bg-bg/60">
            <div>
              <dt className="text-muted">套餐</dt>
              <dd className="font-mono text-gold">{billingStatus.plan ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">今日 AI 次数</dt>
              <dd className="font-mono">
                {billingStatus.agent_queries_today ?? 0} / {billingStatus.free_daily_limit ?? "—"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted">当前周期结束 (UTC)</dt>
              <dd className="font-mono text-[11px] break-all">
                {billingStatus.current_period_end_utc ?? "—"}
              </dd>
            </div>
          </dl>
        ) : apiKey.length >= 8 ? (
          <p className="text-[11px] text-muted">该密钥尚未出现在后端登记（完成结账后 Webhook 会写入）。</p>
        ) : null}
      </section>

      {loading ? (
        <div className="rounded-[10px] border border-border2 bg-panel2 px-4 py-3 text-muted">
          加载集成状态中…
        </div>
      ) : errorText ? (
        <div className="rounded-[10px] border border-red/40 bg-red/10 px-4 py-3 text-red whitespace-pre-wrap text-[12px]">
          <div className="font-semibold mb-1 text-text">未能拉取后端状态</div>
          {errorText}
          <div className="mt-2 text-muted text-[11px]">
            本地开发：在 Next `.env.local` 配置 OPTIONS_AJI_BACKEND_URL（例如 http://127.0.0.1:8787）。
            Vercel 部署：必须填写公网可达的后端地址（不可填 localhost），否则所有 /api 代理与 Agent SSE 都会失败。
          </div>
        </div>
      ) : data ? (
        <>
          <section className="rounded-[10px] border border-border2 bg-panel2 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
                Discord → SQLite
              </h2>
              <span className="text-[10px] font-mono text-muted">
                UTC {data.generated_at_utc?.slice?.(11, 19) ?? "--"}
              </span>
            </div>
            {dq ? (
              <dl className="grid grid-cols-2 gap-2 text-[12px]">
                <div>
                  <dt className="text-muted">网关开关</dt>
                  <dd
                    className={clsx(
                      "font-semibold mt-0.5",
                      dq.discord_listener_setting ? "text-green" : "text-red",
                    )}
                  >
                    {dq.discord_listener_setting ? "已启用监听" : "未启用监听"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Token</dt>
                  <dd className={clsx("font-semibold mt-0.5", dq.token_present ? "text-green" : "text-red")}>
                    {dq.token_present ? "已配置" : "未配置"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">监听频道数量</dt>
                  <dd className="font-mono text-gold">{dq.channel_ids_count}</dd>
                </div>
                <div>
                  <dt className="text-muted">库内总行数</dt>
                  <dd className="font-mono text-gold">{dq.stored_message_count_total}</dd>
                </div>
              </dl>
            ) : null}

            {dq?.hints?.length ? (
              <div className="space-y-1 text-[11.5px] text-gold bg-bg/60 rounded-[8px] p-3 border border-border2">
                {dq.hints.map((h) => (
                  <p key={h}>• {h}</p>
                ))}
              </div>
            ) : null}

            {dq?.recent_preview?.length ? (
              <div>
                <h3 className="text-[11px] text-muted uppercase tracking-wider mb-2">最近存档摘要</h3>
                <ul className="space-y-2 max-h-[220px] overflow-y-auto border border-border2 rounded-[8px] p-2 bg-bg/60">
                  {dq.recent_preview.map((msg) => (
                    <li key={msg.id} className="text-[11px] border-b border-border2/70 pb-2 last:border-none">
                      <div className="flex justify-between gap-2 text-muted">
                        <span className="truncate font-mono text-text">{msg.author ?? "未知"}</span>
                        <span className="shrink-0">{msg.tickers.length ? msg.tickers.join(", ") : "—"}</span>
                      </div>
                      <p className="text-text mt-1 leading-snug">{msg.content_preview}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : dq && dq.token_present ? (
              <p className="text-muted text-[11.5px]">暂无示例消息（请先确认监听频道有新的发言）。</p>
            ) : null}
          </section>

          <section className="rounded-[10px] border border-border2 bg-panel2 p-4 space-y-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
              yfinance · 美股 / 期权快照
            </h2>
            <p className="text-[11.5px] text-muted mb-2">
              OpenBB 尚未直接暴露在页面；`/market`、Agent、`option_chain_digest` 等在后端均以 yfinance 为主。
              下方为当前标的（默认 SPY）原始探测 JSON。
            </p>
            <pre className="text-[11px] font-mono bg-bg/80 border border-border2 rounded-[8px] p-3 overflow-auto max-h-[320px] text-muted whitespace-pre-wrap break-all">
              {JSON.stringify(data.options_via_yfinance ?? {}, null, 2)}
            </pre>
          </section>

          <p className="text-[10px] text-muted text-center pb-8">
            若需停用该接口可在后端 .env 设置 INTEGRATION_STATUS_PUBLIC=false
          </p>
        </>
      ) : (
        <p className="text-muted text-[12px]">无数据。</p>
      )}
    </div>
  );
}
