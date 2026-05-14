"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import type {
  AnalystPriceTargetContract,
  SmartVsRetailContract,
  StockOverviewContract,
} from "@/lib/contracts";

export default function StockOverviewPage({ symbol }: { symbol: string }) {
  const [data, setData] = useState<StockOverviewContract | null>(null);
  const [range, setRange] = useState<"1M" | "3M" | "6M" | "1Y">("3M");
  const [pt, setPt] = useState<AnalystPriceTargetContract | null>(null);
  const [smartVsRetail, setSmartVsRetail] = useState<SmartVsRetailContract | null>(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const j = await api.stock.overview(symbol);
      if (!cancelled) setData(j);
    })().catch(() => {
      if (!cancelled) setData(null);
    });
    (async () => {
      const j = await api.analyst.priceTarget(symbol);
      if (!cancelled) setPt(j);
    })().catch(() => {
      if (!cancelled) setPt(null);
    });
    (async () => {
      setSmartLoading(true);
      setSmartError(null);
      const j = await api.social.smartVsRetail(symbol);
      if (!cancelled) setSmartVsRetail(j);
    })().catch(() => {
      if (!cancelled) {
        setSmartVsRetail(null);
        setSmartError("聪明钱 vs 散户钱数据加载失败");
      }
    }).finally(() => {
      if (!cancelled) setSmartLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const createResonanceAlert = async () => {
    setAlertMsg(null);
    const key =
      (typeof window !== "undefined" && window.localStorage.getItem("optionsaji_api_key")) || "";
    if (!key || key.trim().length < 8) {
      setAlertMsg("请先在设置页保存 API 密钥，再创建预警。");
      return;
    }
    try {
      await api.alerts.create({
        api_key: key.trim(),
        alert_type: "resonance",
        symbol,
        threshold: smartVsRetail?.confidence ?? 0.5,
      });
      setAlertMsg("共振预警创建成功。");
    } catch {
      setAlertMsg("预警创建失败，请稍后重试。");
    }
  };

  const series = (data?.priceSeries ?? []).map((p) => ({ d: p.date, c: p.close }));
  const sliced = (() => {
    if (range === "1M") return series.slice(-22);
    if (range === "3M") return series.slice(-66);
    if (range === "6M") return series.slice(-132);
    return series.slice(-252);
  })();

  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] text-muted uppercase tracking-widest">Overview</div>
          <h2 className="text-xl font-semibold text-text font-mono">{symbol}</h2>
          <div className="text-[13px] text-muted mt-1">
            价格{" "}
            <span className="text-text font-mono">
              {typeof data?.bar?.price === "number" ? data.bar.price.toFixed(2) : "—"}
            </span>
            <span className="mx-2">·</span>
            涨跌{" "}
            <span className="font-mono">
              {typeof data?.bar?.changePct === "number"
                ? `${data.bar.changePct >= 0 ? "+" : ""}${data.bar.changePct.toFixed(2)}%`
                : "—"}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {(["1M", "3M", "6M", "1Y"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`text-[11px] px-2 py-1 rounded-[6px] border ${
                range === r ? "border-gold text-gold" : "border-border2 text-muted"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-panel border border-border2 rounded-[10px] p-4 h-64">
        {sliced.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sliced}>
              <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#8B8D97" }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#8B8D97" }} width={48} />
              <Tooltip
                contentStyle={{ background: "#111D2E", border: "1px solid rgba(212,175,55,0.2)" }}
              />
              <Line type="monotone" dataKey="c" stroke="#D4AF37" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-muted text-[13px] h-full flex items-center justify-center">加载 K 线…</div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["ATM IV", data?.keyStats?.atmIv],
          ["IV Rank¹", data?.keyStats?.ivRank],
          ["IV %ile¹", data?.keyStats?.ivPercentile],
          ["HV20", data?.keyStats?.hv20],
          ["HV60", data?.keyStats?.hv60],
          ["IV/HV", data?.keyStats?.ivHvRatio],
          ["PCR (Vol)", data?.optionLiquidity?.pcrVolume],
          ["PCR (OI)", data?.optionLiquidity?.pcrOpenInterest],
        ].map(([k, v]) => (
          <div key={String(k)} className="bg-panel border border-border2 rounded-[8px] px-3 py-2">
            <div className="text-[10px] text-muted">{String(k)}</div>
            <div className="text-[15px] font-mono text-text">
              {typeof v === "number" ? (Math.abs(v) > 20 ? v.toFixed(1) : v.toFixed(2)) : "—"}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted">
        ¹ IV Rank / Percentile 基于 HV 波动代理，详见接口返回 methodology。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-panel border border-border2 rounded-[10px] p-4">
          <div className="text-[12px] font-semibold text-text mb-2">Expected Move（Straddle）</div>
          <div className="space-y-2">
            {(data?.expectedMoves ?? []).map((m) => (
              <div key={m.bucket} className="flex justify-between text-[12px] border-b border-border2 pb-2">
                <span className="text-muted">{m.bucket}</span>
                <span className="font-mono text-text">
                  ±{m.pct.toFixed(2)}% · ${m.straddleUsd.toFixed(2)}
                </span>
              </div>
            ))}
            {(data?.expectedMoves?.length ?? 0) === 0 && (
              <div className="text-muted text-[12px]">暂无法计算 Expected Move</div>
            )}
          </div>
        </div>
        <div className="bg-panel border border-border2 rounded-[10px] p-4">
          <div className="text-[12px] font-semibold text-text mb-2">财报</div>
          <div className="text-[13px] text-text">
            下次：{" "}
            <span className="font-mono text-gold">{data?.earnings?.nextDate ?? "—"}</span>
          </div>
          <div className="text-[12px] text-muted mt-2">
            距财报约 {data?.earnings?.daysTo ?? "—"} 天
          </div>
          <Link
            href={`/stock/${symbol}/earnings`}
            className="inline-block mt-3 text-[11px] text-blue hover:underline"
          >
            财报详情 →
          </Link>
        </div>
      </div>

      <div className="bg-panel border border-border2 rounded-[10px] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[12px] font-semibold text-text">聪明钱 vs 散户钱</h3>
          <button
            type="button"
            onClick={createResonanceAlert}
            className="text-[11px] px-2.5 py-1 rounded-[6px] border border-gold text-gold hover:bg-gold/10"
          >
            创建共振预警
          </button>
        </div>
        {smartLoading ? (
          <p className="text-[12px] text-muted">加载中...</p>
        ) : smartError ? (
          <p className="text-[12px] text-red">{smartError}</p>
        ) : smartVsRetail ? (
          <div className="space-y-2">
            <p className="text-[12px] text-muted">
              机构方向 <span className="font-mono text-text">{smartVsRetail.institutional_direction}</span>，
              强度 <span className="font-mono text-gold">{smartVsRetail.institutional_strength}/5</span>；
              散户方向 <span className="font-mono text-text">{smartVsRetail.retail_direction}</span>，
              情绪 <span className="font-mono text-gold">{smartVsRetail.retail_sentiment_score}/100</span>。
            </p>
            <p className="text-[12px] text-text/90">{smartVsRetail.ai_narrative_zh}</p>
            <div className="text-[11px] text-muted">
              共振类型 {smartVsRetail.consensus_type} · 置信度 {(smartVsRetail.confidence * 100).toFixed(1)}%
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-muted">暂无共振数据。</p>
        )}
        {alertMsg ? <p className="text-[11px] text-gold mt-2">{alertMsg}</p> : null}
      </div>

      {/* Analyst Price Targets */}
      {pt?.summary && pt.summary.lastMonthAvgPriceTarget && data?.bar?.price && (
        <div className="bg-panel border border-border2 rounded-[10px] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-semibold text-text">分析师价格目标</h3>
            {pt.summary.lastMonthCount != null && (
              <span className="text-[10px] text-muted">{pt.summary.lastMonthCount} 位分析师</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "当前价格", value: data.bar.price, pct: null, color: "text-text" },
              { label: "近月目标", value: pt.summary.lastMonthAvgPriceTarget, pct: ((pt.summary.lastMonthAvgPriceTarget! - data.bar.price) / data.bar.price) * 100, color: "text-green" },
              { label: "近季目标", value: pt.summary.lastQuarterAvgPriceTarget, pct: ((pt.summary.lastQuarterAvgPriceTarget ?? 0) - data.bar.price) / data.bar.price * 100, color: "text-green" },
              { label: "历史平均", value: pt.summary.allTimeAvgPriceTarget, pct: ((pt.summary.allTimeAvgPriceTarget! - data.bar.price) / data.bar.price) * 100, color: "text-gold" },
            ].filter((c): c is { label: string; value: number; pct: number | null; color: string } => c.value != null).map((c) => (
              <div key={c.label} className="bg-panel2 border border-border2 rounded-[8px] px-3 py-2.5">
                <div className="text-[10px] text-muted">{c.label}</div>
                <div className={`text-[15px] font-mono ${c.color} mt-0.5`}>
                  ${Number(c.value).toFixed(2)}
                </div>
                {c.pct != null && (
                  <div className={`text-[10px] font-mono mt-0.5 ${c.pct >= 0 ? "text-green" : "text-red"}`}>
                    {c.pct >= 0 ? "+" : ""}{c.pct.toFixed(1)}%
                  </div>
                )}
              </div>
            ))}
          </div>
          {pt?.consensus && (
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border2">
              {pt.consensus.high != null && (
                <div className="text-[11px]"><span className="text-muted">最高：</span><span className="font-mono text-text">${pt.consensus.high.toFixed(2)}</span></div>
              )}
              {pt.consensus.median != null && (
                <div className="text-[11px]"><span className="text-muted">中位数：</span><span className="font-mono text-gold">${pt.consensus.median.toFixed(2)}</span></div>
              )}
              {pt.consensus.low != null && (
                <div className="text-[11px]"><span className="text-muted">最低：</span><span className="font-mono text-text">${pt.consensus.low.toFixed(2)}</span></div>
              )}
              {pt.consensus.buyCount != null && (
                <div className="text-[11px]"><span className="text-green">买入 {pt.consensus.buyCount}</span></div>
              )}
              {pt.consensus.holdCount != null && (
                <div className="text-[11px]"><span className="text-gold">持有 {pt.consensus.holdCount}</span></div>
              )}
              {pt.consensus.sellCount != null && (
                <div className="text-[11px]"><span className="text-red">卖出 {pt.consensus.sellCount}</span></div>
              )}
            </div>
          )}
          <Link
            href={`/stock/${symbol}/analyst`}
            className="inline-block mt-3 text-[11px] text-blue hover:underline"
          >
            查看全部分析师评级 →
          </Link>
        </div>
      )}

      <p className="text-[10px] text-muted text-center pb-4">
        本平台仅提供数据分析与教育内容，不构成投资建议。
      </p>
    </div>
  );
}
