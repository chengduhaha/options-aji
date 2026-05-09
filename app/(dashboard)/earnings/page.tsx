/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { ListFilter } from "lucide-react";

export default function EarningsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setFetchError(null);
    fetch(`/api/stock/AAPL/earnings-calendar`)
      .then(async r => {
        const d = (await r.json()) as {
          success?: boolean;
          earnings?: unknown[];
          error?: { message?: string };
        };
        if (!r.ok && d?.error?.message) {
          throw new Error(d.error.message);
        }
        if (d?.success === false && d?.error?.message) {
          throw new Error(d.error.message);
        }
        return d;
      })
      .then((d: { earnings?: unknown[] }) =>
        setEvents(Array.isArray(d.earnings) ? d.earnings : []),
      )
      .catch((err: unknown) => {
        setEvents([]);
        setFetchError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <ListFilter className="w-5 h-5 text-gold" />
        <h1 className="text-xl font-bold text-text">财报日历</h1>
      </div>

      <div className="text-sm text-muted">
        请在「个股深度」中搜索特定股票查看其财报历史和预期。
        全市场财报日历功能即将上线。
      </div>

      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <div className="text-center text-muted py-8">加载中...</div>
        ) : fetchError ? (
          <div className="bg-panel2 border border-red-400/30 rounded-xl p-6 text-muted text-sm space-y-2">
            <p className="text-red-400 font-medium">请求失败</p>
            <p className="font-mono text-[11px] break-all">{fetchError}</p>
            <p>
              若在 Vercel 部署，请设置公网可访问的 OPTIONS_AJI_BACKEND_URL；后端需配置 FMP_API_KEY。
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-panel2 border border-border2 rounded-xl p-6 text-center text-muted text-sm">
            暂无数据 — 请在 FastAPI 服务端配置 FMP_API_KEY 并同步财报数据（或使用个股深度页查看单标的）
          </div>
        ) : (
          events.map((ev: any, i: number) => (
            <div key={i} className="bg-panel2 border border-border2 rounded-xl p-4 flex items-center gap-4">
              <div className="w-20">
                <div className="text-xs text-muted">{ev.date}</div>
                <div className="text-[11px] text-muted">{ev.time === "BMO" ? "盘前" : "盘后"}</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-text">{ev.symbol || ev.date}</div>
                <div className="flex gap-4 mt-0.5 text-[11px] text-muted">
                  {ev.eps_estimate != null && <span>EPS预期: {ev.eps_estimate}</span>}
                  {ev.eps_actual != null && <span className="text-gold">实际: {ev.eps_actual}</span>}
                  {ev.surprise_pct != null && (
                    <span className={ev.surprise_pct >= 0 ? "text-green-400" : "text-red-400"}>
                      超预期: {ev.surprise_pct >= 0 ? "+" : ""}{ev.surprise_pct.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
