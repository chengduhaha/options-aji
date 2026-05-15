"use client";

import { useState, useEffect } from "react";
import { BarChart2, Eye, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { clsx } from "clsx";

interface MarketTide {
  trade_date: string;
  call_premium_total: number;
  put_premium_total: number;
  net_call_flow: number;
  call_volume: number;
  put_volume: number;
  put_call_ratio: number;
  tide_direction: string;
  history?: Array<{
    trade_date: string;
    net_call_flow: number;
    tide_direction: string;
  }>;
}

interface FlowItem {
  symbol: string;
  call_premium: number;
  put_premium: number;
  net_flow: number;
  call_volume: number;
  put_volume: number;
}

function fmt(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  return `${v.toFixed(0)}`;
}

export default function DarkPoolPage() {
  const [tide, setTide] = useState<MarketTide | null>(null);
  const [flow, setFlow] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [tideRes, flowRes] = await Promise.all([
        fetch("/api/darkpool/market-tide"),
        fetch("/api/darkpool/flow-summary"),
      ]);
      if (!tideRes.ok || !flowRes.ok) throw new Error("加载失败");
      const [tideData, flowData] = await Promise.all([
        tideRes.json(),
        flowRes.json(),
      ]);
      setTide(tideData);
      setFlow(flowData.items ?? flowData ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Eye className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">暗池雷达</h1>
            <p className="text-sm text-muted-foreground">
              机构资金流向与期权市场情绪分析
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-glass border border-glass-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-50"
        >
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          刷新
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="rounded-xl border border-glass-border bg-glass/40 p-8 text-center text-muted-foreground text-sm">
          加载中…
        </div>
      )}

      {/* Market Tide */}
      {!loading && tide && (
        <div className="rounded-xl border border-glass-border bg-glass/40 p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">市场潮汐</h2>
            <span
              className={clsx(
                "ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                tide.tide_direction === "BULLISH"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400",
              )}
            >
              {tide.tide_direction === "BULLISH" ? "看涨" : "看跌"}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Call 权利金", value: fmt(tide.call_premium_total), color: "text-green-400" },
              { label: "Put 权利金", value: fmt(tide.put_premium_total), color: "text-red-400" },
              {
                label: "净 Call 流向",
                value: (tide.net_call_flow >= 0 ? "+" : "") + fmt(tide.net_call_flow),
                color: tide.net_call_flow >= 0 ? "text-green-400" : "text-red-400",
              },
              {
                label: "Put/Call 比率",
                value: tide.put_call_ratio?.toFixed(2) ?? "—",
                color: (tide.put_call_ratio ?? 1) < 1 ? "text-green-400" : "text-red-400",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-lg border border-glass-border bg-glass/40 p-3"
              >
                <div className="text-[10px] text-muted uppercase tracking-wide mb-1">
                  {label}
                </div>
                <div className={clsx("text-lg font-bold", color)}>{value}</div>
              </div>
            ))}
          </div>

          {/* Proportional bar */}
          {(() => {
            const total =
              tide.call_premium_total + tide.put_premium_total;
            const callPct =
              total > 0 ? (tide.call_premium_total / total) * 100 : 50;
            return (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-muted">
                  <span>Call {callPct.toFixed(0)}%</span>
                  <span>Put {(100 - callPct).toFixed(0)}%</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500/70 transition-all"
                    style={{ width: `${callPct}%` }}
                  />
                  <div className="flex-1 bg-red-500/70" />
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Flow Summary */}
      {!loading && (
        <div className="rounded-xl border border-glass-border bg-glass/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-glass-border bg-glass/60">
            <h2 className="text-base font-semibold text-foreground">期权资金流向排行</h2>
            <p className="text-[11px] text-muted">按净 Call 流向排序</p>
          </div>
          {flow.length === 0 && !error && (
            <div className="p-8 text-center text-muted-foreground text-sm">暂无数据</div>
          )}
          {flow.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  {[
                    ["股票", "text-left"],
                    ["Call 权利金", "text-right"],
                    ["Put 权利金", "text-right"],
                    ["净流向", "text-right"],
                    ["Call 量", "text-right"],
                    ["Put 量", "text-right"],
                  ].map(([label, align]) => (
                    <th
                      key={label}
                      className={clsx(
                        "px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide",
                        align,
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flow.map((item) => (
                  <tr
                    key={item.symbol}
                    className="border-b border-glass-border/50 hover:bg-glass/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-foreground font-mono">
                      {item.symbol}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400">
                      {fmt(item.call_premium)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400">
                      {fmt(item.put_premium)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={clsx(
                          "flex items-center justify-end gap-1 font-medium",
                          item.net_flow >= 0 ? "text-green-400" : "text-red-400",
                        )}
                      >
                        {item.net_flow >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {item.net_flow >= 0 ? "+" : ""}{fmt(item.net_flow)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {item.call_volume?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {item.put_volume?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
