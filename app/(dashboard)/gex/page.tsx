"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import GexChart from "@/components/gex/GexChart";
import GexTrendChart from "@/components/gex/GexTrendChart";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-key-change-me";

const TICKERS = ["SPY", "QQQ", "AAPL", "TSLA", "NVDA"];
const EXPIRATIONS = ["All Expirations", "This Week", "Next Week", "Monthly"];

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
};

export default function GexPage() {
  const [ticker, setTicker] = useState("SPY");
  const [expiry, setExpiry] = useState("All Expirations");
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<GexProfile | null>(null);

  const fetchProfile = async (sym: string) => {
    try {
      const res = await fetch(`/api/gex/${encodeURIComponent(sym)}`, {
        headers: { "X-API-Key": API_KEY },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setProfile(data);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    fetchProfile(ticker);
  }, [ticker]);

  const refresh = () => {
    setRefreshing(true);
    fetchProfile(ticker).finally(() => setTimeout(() => setRefreshing(false), 600));
  };

  const d = profile;
  const isPositive = d ? d.netGex >= 0 : true;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bg">
      {/* Control bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border2 bg-panel2 flex-shrink-0 flex-wrap">
        {/* Ticker tabs */}
        <div className="flex gap-1">
          {TICKERS.map((t) => (
            <button
              key={t}
              onClick={() => setTicker(t)}
              className={clsx(
                "px-3 py-1.5 text-[12.5px] font-mono font-semibold rounded-[5px] border-b-2 transition-all",
                ticker === t
                  ? "text-gold border-gold"
                  : "text-muted border-transparent hover:text-text"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border2" />

        {/* Expiry */}
        <select
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="bg-panel border border-border2 text-text text-[12px] px-2.5 py-1.5 rounded-[6px] focus:outline-none focus:border-border"
        >
          {EXPIRATIONS.map((e) => <option key={e}>{e}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2 text-[11px] text-muted">
          <span>{d ? `Updated ${new Date(d.timestamp).toLocaleTimeString()}` : "Loading..."}</span>
          <button
            onClick={refresh}
            className="p-1.5 rounded-[6px] border border-border2 hover:border-border hover:text-text transition-all"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", refreshing && "animate-spin-slow")} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">
        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: "Net GEX",
              value: d ? `${d.netGex >= 0 ? "+" : ""}${d.netGex.toFixed(1)}B` : "—",
              color: isPositive ? "text-green" : "text-red",
              arrow: isPositive ? "↑" : "↓",
              sub: isPositive ? "做市商均值回归" : "顺势对冲加速",
            },
            {
              label: "Gamma Flip",
              value: d ? d.gammaFlip.toFixed(2) : "—",
              color: "text-gold",
              arrow: "",
              sub: "多空分界线",
            },
            {
              label: "GEX Regime",
              value: d ? (d.regime === "Positive Gamma" ? "Positive γ" : "Negative γ") : "—",
              color: isPositive ? "text-green" : "text-red",
              arrow: "",
              sub: d ? (isPositive ? "低波动环境" : "高波动环境") : "",
            },
            {
              label: "Max Pain",
              value: d ? d.maxPain.toFixed(2) : "—",
              color: "text-text",
              arrow: "",
              sub: "期权到期磁力位",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-panel border border-border2 rounded-[10px] px-4 py-3"
            >
              <div className="text-[10px] text-muted uppercase tracking-widest mb-2">
                {card.label}
              </div>
              <div className={`text-[22px] font-mono font-bold ${card.color} leading-none mb-1`}>
                {card.arrow && <span className="mr-0.5">{card.arrow}</span>}
                {card.value}
              </div>
              <div className="text-[10.5px] text-muted">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Main GEX Chart */}
        <div className="bg-panel border border-border2 rounded-[10px] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12px] font-semibold text-text">
              GEX Profile — {ticker}
            </div>
            <div className="flex items-center gap-3 text-[10.5px] text-muted">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green inline-block" /> Call GEX</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red inline-block" /> Put GEX</span>
            </div>
          </div>
          {d && d.strikes ? (
            <GexChart ticker={ticker} strikes={d.strikes} price={d.strikes.length > 0 ? d.strikes[Math.floor(d.strikes.length/2)].strike : 0} />
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted text-[13px]">加载中...</div>
          )}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-panel border border-border2 rounded-[10px] p-4">
            <div className="text-[12px] font-semibold text-text mb-3">Net GEX 5日趋势</div>
            <GexTrendChart ticker={ticker} isPositive={isPositive} />
          </div>

          <div className="bg-panel border border-border2 rounded-[10px] p-4">
            <div className="text-[12px] font-semibold text-text mb-3">Top Strikes by GEX</div>
            {d && d.strikes ? (
              <StrikesTable ticker={ticker} strikes={d.strikes} data={{
                callWall: d.callWall,
                putWall: d.putWall,
                gammaFlip: d.gammaFlip,
                price: d.strikes.length > 0 ? d.strikes[Math.floor(d.strikes.length/2)].strike : 0,
              }} />
            ) : (
              <div className="text-muted text-[13px]">加载中...</div>
            )}
          </div>
        </div>

        {/* AI interpretation */}
        <div className="bg-panel border border-border rounded-[10px] p-4">
          <div className="text-[11px] text-gold font-semibold mb-1.5">📊 GEX AI 解读</div>
          <p className="text-[13px] text-muted leading-relaxed">
            {d
              ? `${d.symbol} 当前处于${isPositive ? "正" : "负"} Gamma 环境（Net GEX ${d.netGex >= 0 ? "+" : ""}${d.netGex.toFixed(1)}B），
                ${isPositive
                  ? `做市商将在 ${d.putWall}–${d.callWall} 区间内进行均值回归对冲，压制波动率。关注 ${d.gammaFlip} 的 Gamma Flip 位，若跌破将进入负 Gamma 加速区。`
                  : `做市商将顺势对冲（price↓ → sell delta），波动率扩张风险上升。关键支撑 ${d.putWall}（Put Wall），阻力 ${d.callWall}（Call Wall）。`
                }`
              : "加载中..."
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function StrikesTable({ strikes, data }: { ticker: string; strikes: StrikeData[]; data: { callWall: number; putWall: number; gammaFlip: number; price: number } }) {
  const topStrikes = strikes.slice(0, 10);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11.5px]">
        <thead>
          <tr className="text-muted text-[10px] uppercase tracking-wider border-b border-border2">
            <th className="text-left pb-2 font-medium">Strike</th>
            <th className="text-right pb-2 font-medium">Call GEX</th>
            <th className="text-right pb-2 font-medium">Put GEX</th>
            <th className="text-right pb-2 font-medium">Net</th>
            <th className="text-right pb-2 font-medium">OI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border2">
          {topStrikes.map((r) => {
            const label =
              Math.abs(r.strike - data.callWall) < 0.1 ? "Call Wall" :
              Math.abs(r.strike - data.putWall) < 0.1 ? "Put Wall" :
              Math.abs(r.strike - data.gammaFlip) < 0.1 ? "γ Flip" :
              undefined;
            return (
              <tr
                key={r.strike}
                className={clsx(
                  "font-mono",
                  label === "Call Wall" && "bg-green/5",
                  label === "Put Wall" && "bg-red/5",
                  label === "γ Flip" && "bg-gold/5"
                )}
              >
                <td className="py-1.5 text-text font-semibold">
                  {r.strike.toFixed(0)}
                  {label && (
                    <span className={clsx(
                      "ml-1.5 text-[9px] px-1 rounded",
                      label === "Call Wall" && "text-green bg-green/10",
                      label === "Put Wall" && "text-red bg-red/10",
                      label === "γ Flip" && "text-gold bg-gold/10"
                    )}>
                      {label}
                    </span>
                  )}
                </td>
                <td className="py-1.5 text-right text-green">+{r.callGex.toFixed(1)}B</td>
                <td className="py-1.5 text-right text-red">{r.putGex.toFixed(1)}B</td>
                <td className={clsx("py-1.5 text-right", r.net >= 0 ? "text-green" : "text-red")}>
                  {r.net >= 0 ? "+" : ""}{r.net.toFixed(1)}B
                </td>
                <td className="py-1.5 text-right text-muted">{(r.oi / 1000).toFixed(0)}K</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
