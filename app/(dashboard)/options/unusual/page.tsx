"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrendingUp } from "lucide-react";

export default function UnusualOptionsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [volOiMin, setVolOiMin] = useState(3);
  const [volumeMin, setVolumeMin] = useState(200);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.options.unusual(volOiMin, volumeMin)
      .then((d: any) => setContracts(d.contracts || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <TrendingUp className="w-5 h-5 text-gold" />
        <h1 className="text-xl font-bold text-text">异常期权活动</h1>
        <div className="flex gap-3 ml-4 items-center">
          <label className="text-[12px] text-muted">
            Vol/OI 最小:
            <input
              type="number" value={volOiMin} onChange={e => setVolOiMin(Number(e.target.value))}
              className="ml-1.5 w-14 px-2 py-1 bg-panel2 border border-border2 rounded text-text text-[12px] focus:outline-none"
            />
          </label>
          <label className="text-[12px] text-muted">
            最小量:
            <input
              type="number" value={volumeMin} onChange={e => setVolumeMin(Number(e.target.value))}
              className="ml-1.5 w-20 px-2 py-1 bg-panel2 border border-border2 rounded text-text text-[12px] focus:outline-none"
            />
          </label>
          <button onClick={load} className="px-4 py-1.5 bg-gold-dim border border-border text-gold text-[12px] font-semibold rounded-lg">
            刷新
          </button>
        </div>
      </div>

      <div className="bg-panel2 border border-border2 rounded-xl overflow-x-auto">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="border-b border-border2 text-muted">
              <th className="text-left px-4 py-2.5">合约</th>
              <th className="text-left px-4 py-2.5">类型</th>
              <th className="text-right px-4 py-2.5">行权价</th>
              <th className="text-left px-4 py-2.5">到期日</th>
              <th className="text-right px-4 py-2.5">成交量</th>
              <th className="text-right px-4 py-2.5">OI</th>
              <th className="text-right px-4 py-2.5">Vol/OI</th>
              <th className="text-right px-4 py-2.5">IV</th>
              <th className="text-right px-4 py-2.5">Delta</th>
              <th className="text-right px-4 py-2.5">现价</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border2">
            {loading ? (
              <tr><td colSpan={10} className="py-8 text-center text-muted">加载中...</td></tr>
            ) : contracts.length === 0 ? (
              <tr><td colSpan={10} className="py-8 text-center text-muted">暂无异常活动数据 — 请等待数据同步</td></tr>
            ) : (
              contracts.map((c: any, i: number) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2 text-gold font-semibold">{c.underlying}</td>
                  <td className={`px-4 py-2 font-medium ${c.contract_type === "call" ? "text-green-400" : "text-red-400"}`}>
                    {c.contract_type === "call" ? "CALL" : "PUT"}
                  </td>
                  <td className="px-4 py-2 text-right text-text">${c.strike_price}</td>
                  <td className="px-4 py-2 text-muted">{c.expiration_date}</td>
                  <td className="px-4 py-2 text-right text-text">{c.volume?.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-muted">{c.open_interest?.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-bold text-yellow-400">{c.vol_oi_ratio}x</td>
                  <td className="px-4 py-2 text-right text-muted">
                    {c.implied_volatility != null ? `${(c.implied_volatility * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-blue-400">
                    {c.delta != null ? c.delta.toFixed(3) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-muted">
                    {c.underlying_price != null ? `$${c.underlying_price.toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
