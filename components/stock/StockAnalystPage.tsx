"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

interface Rating {
  analyst_company?: string;
  action?: string;
  from?: string;
  to?: string;
  price_target?: number | null;
  date?: string | null;
}

interface AnalystPayload {
  symbol: string;
  ratings: Rating[];
  price_target_summary?: {
    lastMonthAvgPriceTarget?: number;
    lastQuarterAvgPriceTarget?: number;
    lastYearAvgPriceTarget?: number;
    allTimeAvgPriceTarget?: number;
    lastMonthCount?: number;
    allTimeCount?: number;
  } | null;
  price_target_consensus?: {
    priceTarget?: number;
    high?: number;
    low?: number;
    median?: number;
    buyCount?: number;
    holdCount?: number;
    sellCount?: number;
  } | null;
}

const ACTION_COLOR: Record<string, string> = {
  upgrade: "text-green",
  downgrade: "text-red",
  maintain: "text-gold",
  reit: "text-blue",
  init: "text-purple",
};

export default function StockAnalystPage({ symbol }: { symbol: string }) {
  const [data, setData] = useState<AnalystPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/analyst/${encodeURIComponent(symbol)}`, {
          headers: { "X-API-Key": API_KEY },
          cache: "no-store",
        });
        if (!res.ok || c) return;
        const j = (await res.json()) as AnalystPayload;
        if (!c) setData(j);
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => { c = true; };
  }, [symbol]);

  const summary = data?.price_target_summary;
  const consensus = data?.price_target_consensus;

  return (
    <div className="p-5 space-y-5">
      <div className="space-y-1">
        <div className="text-[11px] text-muted uppercase tracking-widest">Analyst Ratings</div>
        <h2 className="text-xl font-semibold text-text">{symbol} 分析师评级</h2>
      </div>

      {loading ? (
        <div className="text-center text-muted text-[13px] py-16">加载分析师数据…</div>
      ) : !data ? (
        <div className="bg-panel border border-border2 rounded-[10px] p-6 text-center text-muted text-[13px]">
          暂无分析师数据
        </div>
      ) : (
        <>
          {/* Price Target Summary */}
          {summary && (
            <div className="bg-panel border border-border2 rounded-[10px] p-4">
              <h3 className="text-[13px] font-semibold text-text mb-3">价格目标汇总</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "近月均值", value: summary.lastMonthAvgPriceTarget, sub: `${summary.lastMonthCount ?? 0} 位分析师` },
                  { label: "近季均值", value: summary.lastQuarterAvgPriceTarget, sub: "近 3 月" },
                  { label: "近年均值", value: summary.lastYearAvgPriceTarget, sub: "近 1 年" },
                  { label: "历史均值", value: summary.allTimeAvgPriceTarget, sub: `共 ${summary.allTimeCount ?? 0} 次` },
                ].filter(c => c.value != null).map(c => (
                  <div key={c.label} className="bg-panel2 border border-border2 rounded-[8px] px-3 py-2.5">
                    <div className="text-[10px] text-muted">{c.label}</div>
                    <div className="text-[16px] font-mono text-gold mt-0.5">${Number(c.value).toFixed(2)}</div>
                    <div className="text-[9px] text-muted mt-0.5">{c.sub}</div>
                  </div>
                ))}
              </div>
              {consensus && (
                <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border2">
                  {consensus.high != null && (
                    <div className="text-[12px]"><span className="text-muted">最高目标：</span><span className="font-mono text-text">${consensus.high.toFixed(2)}</span></div>
                  )}
                  {consensus.median != null && (
                    <div className="text-[12px]"><span className="text-muted">中位数：</span><span className="font-mono text-gold">${consensus.median.toFixed(2)}</span></div>
                  )}
                  {consensus.low != null && (
                    <div className="text-[12px]"><span className="text-muted">最低目标：</span><span className="font-mono text-text">${consensus.low.toFixed(2)}</span></div>
                  )}
                  <div className="flex gap-2 ml-auto">
                    {consensus.buyCount != null && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-green/20 text-green font-medium">{consensus.buyCount} 买入</span>
                    )}
                    {consensus.holdCount != null && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-gold-dim text-gold font-medium">{consensus.holdCount} 持有</span>
                    )}
                    {consensus.sellCount != null && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-red/20 text-red font-medium">{consensus.sellCount} 卖出</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ratings Table */}
          <div className="bg-panel border border-border2 rounded-[10px] overflow-hidden">
            <div className="px-4 py-3 border-b border-border2">
              <h3 className="text-[13px] font-semibold text-text">历史评级记录</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border2 text-muted">
                    <th className="text-left px-4 py-2.5">日期</th>
                    <th className="text-left px-4 py-2.5">机构</th>
                    <th className="text-left px-4 py-2.5">操作</th>
                    <th className="text-left px-4 py-2.5">从</th>
                    <th className="text-left px-4 py-2.5">到</th>
                    <th className="text-right px-4 py-2.5">目标价</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border2">
                  {(data.ratings ?? []).length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-muted">暂无评级记录</td></tr>
                  ) : (
                    (data.ratings ?? []).slice(0, 100).map((r, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-2 text-muted">{r.date?.slice(0, 10) ?? "—"}</td>
                        <td className="px-4 py-2 text-text font-medium">{r.analyst_company ?? "—"}</td>
                        <td className={clsx("px-4 py-2 font-medium", ACTION_COLOR[(r.action ?? "").toLowerCase()] || "text-muted")}>
                          {r.action ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-muted">{r.from ?? "—"}</td>
                        <td className="px-4 py-2 text-text">{r.to ?? "—"}</td>
                        <td className="px-4 py-2 text-right font-mono text-gold">
                          {r.price_target ? `$${r.price_target.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="text-[10px] text-muted text-center pb-4">
        数据来源：Financial Modeling Prep。分析师评级仅供参考，不构成投资建议。
      </p>
    </div>
  );
}