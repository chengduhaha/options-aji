"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import GexChart from "@/components/gex/GexChart";
import GexTrendChart, { type HistRow } from "@/components/gex/GexTrendChart";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

type StrikeData = {
  strike: number;
  callGex: number;
  putGex: number;
  net: number;
  gamma: number;
  oi: number;
  iv: number;
};

type GexProfile = {
  symbol: string;
  expiration: string;
  netGex: number;
  callWall: number;
  putWall: number;
  gammaFlip: number;
  maxPain: number;
  regime: string;
  strikes: StrikeData[];
  timestamp: string;
  underlyingPrice?: number;
};

type GexHistApi = {
  gexSeries: Array<{ date?: string; netGex?: number; gammaFlip?: number | null }>;
  priceCloses: Array<{ date: string; close: number }>;
};

export default function StockGexPage({ symbol }: { symbol: string }) {
  const [profile, setProfile] = useState<GexProfile | null>(null);
  const [hist, setHist] = useState<GexHistApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mergeRows = useMemo((): HistRow[] => {
    if (!hist) return [];
    const byDay: Record<string, HistRow> = {};
    for (const g of hist.gexSeries ?? []) {
      const d = (g.date ?? "").slice(0, 10);
      if (!d) continue;
      byDay[d] = {
        date: d,
        net: typeof g.netGex === "number" ? g.netGex : undefined,
        flip: typeof g.gammaFlip === "number" ? g.gammaFlip : undefined,
        close: byDay[d]?.close,
      };
    }
    for (const c of hist.priceCloses ?? []) {
      const d = c.date.slice(0, 10);
      const prev = byDay[d];
      byDay[d] = {
        date: d,
        net: prev?.net,
        flip: prev?.flip,
        close: c.close,
      };
    }
    return Object.keys(byDay)
      .sort()
      .map((k) => byDay[k]!);
  }, [hist]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/gex`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("gex");
      setProfile((await res.json()) as GexProfile);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const fetchHist = useCallback(async () => {
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/gex/history`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok) return;
      setHist((await res.json()) as GexHistApi);
    } catch {
      setHist(null);
    }
  }, [symbol]);

  useEffect(() => {
    void fetchProfile();
    void fetchHist();
  }, [fetchProfile, fetchHist]);

  const d = profile;
  const spot =
    d?.underlyingPrice && d.underlyingPrice > 0
      ? d.underlyingPrice
      : d?.strikes?.length
        ? d.strikes[Math.floor(d.strikes.length / 2)]!.strike
        : 0;

  const flipPct =
    typeof d?.gammaFlip === "number" && spot > 0
      ? Math.abs(((spot - d.gammaFlip) / spot) * 100)
      : null;

  return (
    <div className="flex flex-col p-5 space-y-4 overflow-y-auto">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <span>{d ? `刷新于 ${new Date(d.timestamp).toLocaleTimeString()}` : loading ? "加载…" : "—"}</span>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            Promise.all([fetchProfile(), fetchHist()]).finally(() =>
              setTimeout(() => setRefreshing(false), 400),
            );
          }}
          className="p-1.5 rounded-[6px] border border-border2"
        >
          <RefreshCw className={clsx("w-3.5 h-3.5", refreshing && "animate-spin")} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Net GEX", d ? `${d.netGex >= 0 ? "+" : ""}${d.netGex.toFixed(1)}B` : "—"],
          ["Gamma Flip", d ? d.gammaFlip.toFixed(2) : "—"],
          ["Regime", d ? d.regime : "—"],
          ["Max Pain", d ? d.maxPain.toFixed(2) : "—"],
        ].map(([k, v]) => (
          <div key={String(k)} className="bg-panel border border-border2 rounded-[8px] px-3 py-2">
            <div className="text-[10px] text-muted">{k}</div>
            <div className="text-lg font-mono text-text">{v}</div>
          </div>
        ))}
      </div>

      <div className="bg-panel border border-border2 rounded-[10px] p-4">
        <div className="text-[13px] font-semibold mb-3 text-gold">GEX 解读</div>
        <ul className="text-[13px] text-muted space-y-1.5 list-disc pl-5">
          <li>
            当前 {symbol}：
            <span className={clsx(d && d.netGex >= 0 ? "text-green" : "text-red")}> {d?.regime ?? "—"} </span>
            — Net GEX {d ? `${d.netGex >= 0 ? "+" : ""}${d.netGex.toFixed(2)}Bn` : "—"}。
          </li>
          <li>
            Gamma Flip 位于 {d ? `$${d.gammaFlip.toFixed(2)}` : "—"}；跌破后波动往往放大（经验归纳，不构成建议）。
          </li>
          <li>Max Pain ${d?.maxPain.toFixed(2) ?? "—"} — 期权到期价格的常见“磁吸”参考。</li>
          {flipPct !== null ? (
            <li className="text-amber-200/90">
              Spot 距 Gamma Flip 约 {flipPct.toFixed(1)}%，留意突破情境。
            </li>
          ) : null}
          <li>策略语境：卖方价差 / Iron Condor 往往出现在正 Gamma “抑制波动”段落；请务必自行风险控制。</li>
        </ul>
      </div>

      <div className="bg-panel border border-border2 rounded-[10px] p-4 space-y-2">
        <div className="text-[12px] font-semibold">GEX 分布</div>
        {d?.strikes?.length ? (
          <GexChart
            ticker={symbol}
            strikes={d.strikes}
            price={spot}
            gammaFlip={d.gammaFlip}
          />
        ) : (
          <div className="text-muted text-[13px] py-10 text-center">暂无 GEX 数据</div>
        )}
      </div>

      <div className="bg-panel border border-border2 rounded-[10px] p-4 space-y-2">
        <div className="text-[12px] font-semibold">GEX 趋势</div>
        <GexTrendChart merged={mergeRows} symbol={symbol} />
      </div>
    </div>
  );
}
