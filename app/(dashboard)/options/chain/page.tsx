"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Layers, ArrowUp, ArrowDown } from "lucide-react";
import { clsx } from "clsx";

type Contract = {
  ticker: string;
  contract_type: string;
  expiration_date: string;
  strike_price: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  implied_volatility?: number;
  open_interest?: number;
  bid?: number;
  ask?: number;
  day_volume?: number;
  day_change_pct?: number;
  underlying_price?: number;
};

export default function OptionsChainPage() {
  const [symbol, setSymbol] = useState("SPY");
  const [input, setInput] = useState("SPY");
  const [expirations, setExpirations] = useState<string[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.options.expirations(symbol).then((d: any) => {
      const exps: string[] = d.expirations || [];
      setExpirations(exps);
      if (exps.length > 0) setSelectedExpiry(exps[0]);
    });
  }, [symbol]);

  useEffect(() => {
    if (!selectedExpiry) return;
    setLoading(true);
    api.options.chain(symbol, selectedExpiry)
      .then((d: any) => setContracts(d.contracts || []))
      .finally(() => setLoading(false));
  }, [symbol, selectedExpiry]);

  const calls = useMemo(() => contracts.filter(c => c.contract_type === "call"), [contracts]);
  const puts = useMemo(() => contracts.filter(c => c.contract_type === "put"), [contracts]);
  const strikes = useMemo(() => {
    const set = new Set([...calls.map(c => c.strike_price), ...puts.map(c => c.strike_price)]);
    return Array.from(set).sort((a, b) => a - b);
  }, [calls, puts]);

  const spotPrice = contracts[0]?.underlying_price;
  const callMap = useMemo(() => Object.fromEntries(calls.map(c => [c.strike_price, c])), [calls]);
  const putMap = useMemo(() => Object.fromEntries(puts.map(c => [c.strike_price, c])), [puts]);

  const fmt = (v?: number | null, dec = 2) =>
    v != null ? v.toFixed(dec) : "—";

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Layers className="w-5 h-5 text-gold" />
        <h1 className="text-xl font-bold text-text">期权链</h1>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && setSymbol(input)}
            className="px-3 py-1.5 bg-panel2 border border-border2 rounded-lg text-[13px] text-text w-20 focus:outline-none focus:border-gold/50"
            placeholder="SPY"
          />
          <button onClick={() => setSymbol(input)} className="px-4 py-1.5 bg-gold-dim border border-border text-gold text-[12px] font-semibold rounded-lg">
            查询
          </button>
        </div>
        {expirations.length > 0 && (
          <select
            value={selectedExpiry}
            onChange={e => setSelectedExpiry(e.target.value)}
            className="px-3 py-1.5 bg-panel2 border border-border2 rounded-lg text-[12px] text-text focus:outline-none"
          >
            {expirations.map(exp => (
              <option key={exp} value={exp}>{exp}</option>
            ))}
          </select>
        )}
        {spotPrice != null && (
          <span className="text-[13px] text-gold font-semibold">现价 ${spotPrice.toFixed(2)}</span>
        )}
      </div>

      {/* Chain Table */}
      <div className="bg-panel2 border border-border2 rounded-xl overflow-x-auto">
        <table className="w-full text-[11px] min-w-[800px]">
          <thead>
            <tr className="border-b border-border2 text-muted">
              {/* Call side */}
              <th className="text-right px-3 py-2">IV</th>
              <th className="text-right px-3 py-2">Delta</th>
              <th className="text-right px-3 py-2">OI</th>
              <th className="text-right px-3 py-2">量</th>
              <th className="text-right px-3 py-2">买</th>
              <th className="text-right px-3 py-2">卖</th>
              {/* Strike */}
              <th className="text-center px-4 py-2 bg-white/[0.03] font-bold text-text">行权价</th>
              {/* Put side */}
              <th className="text-left px-3 py-2">买</th>
              <th className="text-left px-3 py-2">卖</th>
              <th className="text-left px-3 py-2">量</th>
              <th className="text-left px-3 py-2">OI</th>
              <th className="text-left px-3 py-2">Delta</th>
              <th className="text-left px-3 py-2">IV</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border2">
            {loading ? (
              <tr><td colSpan={13} className="py-8 text-center text-muted">加载中...</td></tr>
            ) : strikes.length === 0 ? (
              <tr><td colSpan={13} className="py-8 text-center text-muted">暂无数据 — 请等待数据同步或检查 API Key 配置</td></tr>
            ) : (
              strikes.map(strike => {
                const call = callMap[strike];
                const put = putMap[strike];
                const isATM = spotPrice != null && Math.abs(strike - spotPrice) / spotPrice < 0.005;
                return (
                  <tr
                    key={strike}
                    className={clsx(
                      "hover:bg-white/[0.02] transition-colors",
                      isATM && "bg-gold/[0.06] border-gold/20"
                    )}
                  >
                    {/* Call */}
                    <td className="text-right px-3 py-1.5 text-muted">{call ? `${(call.implied_volatility! * 100).toFixed(1)}%` : "—"}</td>
                    <td className="text-right px-3 py-1.5 text-blue-400">{call ? fmt(call.delta, 3) : "—"}</td>
                    <td className="text-right px-3 py-1.5 text-muted">{call?.open_interest?.toLocaleString() ?? "—"}</td>
                    <td className="text-right px-3 py-1.5 text-muted">{call?.day_volume?.toLocaleString() ?? "—"}</td>
                    <td className="text-right px-3 py-1.5 text-green-400">{call ? fmt(call.bid) : "—"}</td>
                    <td className="text-right px-3 py-1.5 text-red-400">{call ? fmt(call.ask) : "—"}</td>
                    {/* Strike */}
                    <td className={clsx("text-center px-4 py-1.5 font-bold bg-white/[0.03]", isATM ? "text-gold" : "text-text")}>
                      {strike}
                    </td>
                    {/* Put */}
                    <td className="text-left px-3 py-1.5 text-green-400">{put ? fmt(put.bid) : "—"}</td>
                    <td className="text-left px-3 py-1.5 text-red-400">{put ? fmt(put.ask) : "—"}</td>
                    <td className="text-left px-3 py-1.5 text-muted">{put?.day_volume?.toLocaleString() ?? "—"}</td>
                    <td className="text-left px-3 py-1.5 text-muted">{put?.open_interest?.toLocaleString() ?? "—"}</td>
                    <td className="text-left px-3 py-1.5 text-blue-400">{put ? fmt(put.delta, 3) : "—"}</td>
                    <td className="text-left px-3 py-1.5 text-muted">{put ? `${(put.implied_volatility! * 100).toFixed(1)}%` : "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
