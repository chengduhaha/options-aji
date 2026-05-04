"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

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
};

export default function SettingsPage() {
  const [data, setData] = useState<IntegrationPayload | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto space-y-6 text-[13px] text-text">
      <header>
        <h1 className="text-[17px] font-semibold mb-1">设置</h1>
        <p className="text-muted text-[12px] leading-relaxed">
          对接自检：Discord 存档与美股期权链路（后端 Phase1 使用 yfinance，后续可替换 OpenBB Platform）。
        </p>
      </header>

      <section className="rounded-[10px] border border-border2 bg-panel2 p-4 space-y-2">
        <h2 className="text-[13px] font-semibold text-muted uppercase tracking-wide">订阅与推送（规划）</h2>
        <p className="text-[12px] text-muted leading-relaxed">
          Free / Pro / Alpha 套餐与 Stripe 结账、Telegram 推送等功能将接入统一账户系统。当前环境不扣费、不限次数演示。
        </p>
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
            本地开发需在 Next `.env.local` 配置 OPTIONS_AJI_BACKEND_URL（指向 uvicorn，例如 http://127.0.0.1:8787）。
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
