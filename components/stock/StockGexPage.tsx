"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import GexChart from "@/components/gex/GexChart";
import GexTrendChart from "@/components/gex/GexTrendChart";

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

export default function StockGexPage({ symbol }: { symbol: string }) {
  const [profile, setProfile] = useState<GexProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const d = profile;
  const isPositive = d ? d.netGex >= 0 : true;
  const spot =
    d?.underlyingPrice && d.underlyingPrice > 0
      ? d.underlyingPrice
      : d?.strikes?.length
        ? d.strikes[Math.floor(d.strikes.length / 2)]!.strike
        : 0;

  return (
    <div className="flex flex-col p-5 space-y-4 overflow-y-auto">
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <span>{d ? `Updated ${new Date(d.timestamp).toLocaleTimeString()}` : loading ? "加载…" : "—"}</span>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            fetchProfile().finally(() => setTimeout(() => setRefreshing(false), 400));
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
          <div key={k} className="bg-panel border border-border2 rounded-[8px] px-3 py-2">
            <div className="text-[10px] text-muted">{k}</div>
            <div className="text-lg font-mono text-text">{v}</div>
          </div>
        ))}
      </div>

      <div className="bg-panel border border-border2 rounded-[10px] p-4">
        <div className="text-[12px] font-semibold mb-2">GEX Profile</div>
        {d?.strikes?.length ? (
          <GexChart ticker={symbol} strikes={d.strikes} price={spot} />
        ) : (
          <div className="text-muted text-[13px] py-10 text-center">暂无 GEX 数据</div>
        )}
      </div>

      <div className="bg-panel border border-border2 rounded-[10px] p-4">
        <GexTrendChart ticker={symbol} isPositive={isPositive} />
      </div>
    </div>
  );
}
