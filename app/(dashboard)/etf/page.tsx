"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Wallet } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#d4af37", "#60a5fa", "#34d399", "#f87171", "#a78bfa", "#fb923c", "#38bdf8", "#4ade80", "#e879f9", "#facc15"];

export default function EtfPage() {
  const [symbol, setSymbol] = useState("SPY");
  const [input, setInput] = useState("SPY");
  const [holdings, setHoldings] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = (sym: string) => {
    setLoading(true);
    Promise.all([api.etf.holdings(sym), api.etf.sectors(sym), api.etf.info(sym)])
      .then(([h, s, i]) => {
        setHoldings((h as any).holdings || []);
        setSectors((s as any).sectors || []);
        setInfo((i as any).info);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(symbol); }, [symbol]);

  const sectorPie = sectors.map((s: any) => ({
    name: s.sector || s.sectorName,
    value: parseFloat(s.weightPercentage || s.weight || 0),
  })).filter(s => s.value > 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Wallet className="w-5 h-5 text-gold" />
        <h1 className="text-xl font-bold text-text">ETF 分析</h1>
        <div className="flex gap-2 ml-4">
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && setSymbol(input)}
            className="px-3 py-1.5 bg-panel2 border border-border2 rounded-lg text-[13px] text-text w-24 focus:outline-none focus:border-gold/50"
            placeholder="SPY"
          />
          <button
            onClick={() => setSymbol(input)}
            className="px-4 py-1.5 bg-gold-dim border border-border text-gold text-[12px] font-semibold rounded-lg hover:opacity-90"
          >
            查询
          </button>
        </div>
        {info && (
          <span className="text-[12px] text-muted">
            {info.fundName || info.name} · AUM {info.aum ? `$${(info.aum / 1e9).toFixed(1)}B` : ""} · 费率 {info.expenseRatio ? `${(info.expenseRatio * 100).toFixed(2)}%` : ""}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Sector Pie */}
        {sectorPie.length > 0 && (
          <div className="bg-panel2 border border-border2 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text mb-3">板块权重</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={sectorPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {sectorPie.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${Number(v).toFixed(2)}%`, "权重"]} contentStyle={{ background: "#1a1a2e", border: "1px solid #333", fontSize: 11 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Holdings */}
        <div className="bg-panel2 border border-border2 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text mb-3">Top 20 持仓</h2>
          {loading ? (
            <div className="text-center text-muted text-sm py-8">加载中...</div>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {holdings.slice(0, 20).map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 text-[10px] text-muted text-right">{i + 1}</div>
                  <div className="text-[12px] font-semibold text-gold w-14">{h.asset || h.symbol || h.holding}</div>
                  <div className="flex-1 text-[11px] text-muted truncate">{h.name || h.companyName}</div>
                  <div className="text-[12px] font-medium text-text">
                    {h.weightPercentage != null ? `${Number(h.weightPercentage).toFixed(2)}%` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
