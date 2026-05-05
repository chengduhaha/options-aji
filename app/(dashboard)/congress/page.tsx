/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Landmark } from "lucide-react";

const TYPE_COLOR: Record<string, string> = {
  Purchase: "text-green-400",
  Sale: "text-red-400",
  sale: "text-red-400",
  purchase: "text-green-400",
};

export default function CongressPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [chamber, setChamber] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.congress.latest(chamber || undefined)
      .then((d: any) => setTrades(d.trades || []))
      .finally(() => setLoading(false));
  }, [chamber]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Landmark className="w-5 h-5 text-gold" />
        <h1 className="text-xl font-bold text-text">国会议员交易</h1>
        <div className="flex gap-1.5 ml-4">
          {["", "senate", "house"].map(c => (
            <button
              key={c}
              onClick={() => setChamber(c)}
              className={`px-3 py-1 rounded-md text-[12px] font-medium border transition-all ${
                chamber === c
                  ? "bg-gold-dim border-border text-gold"
                  : "border-border2 text-muted hover:text-text"
              }`}
            >
              {c === "" ? "全部" : c === "senate" ? "参议院" : "众议院"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-panel2 border border-border2 rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border2 text-muted">
              <th className="text-left px-4 py-2.5">议员</th>
              <th className="text-left px-4 py-2.5">院</th>
              <th className="text-left px-4 py-2.5">股票</th>
              <th className="text-left px-4 py-2.5">类型</th>
              <th className="text-left px-4 py-2.5">金额区间</th>
              <th className="text-left px-4 py-2.5">交易日期</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border2">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-muted">加载中...</td></tr>
            ) : trades.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-muted">暂无数据</td></tr>
            ) : (
              trades.slice(0, 100).map((t: any, i: number) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 text-text font-medium">{t.member_name || t.representative || t.senator}</td>
                  <td className="px-4 py-2.5 text-muted">{t.chamber === "senate" ? "参" : "众"}</td>
                  <td className="px-4 py-2.5 text-gold font-semibold">{t.symbol || "—"}</td>
                  <td className={`px-4 py-2.5 font-medium ${TYPE_COLOR[t.transaction_type] || TYPE_COLOR[t.type] || "text-muted"}`}>
                    {t.transaction_type || t.type}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{t.amount_range || t.amount || "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{t.transaction_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
