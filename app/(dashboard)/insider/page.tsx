"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Building2 } from "lucide-react";

const TYPE_COLOR: Record<string, string> = {
  "P-Purchase": "text-green-400",
  "S-Sale": "text-red-400",
  "A-Award": "text-blue-400",
  "M-Exempt": "text-yellow-400",
};

export default function InsiderPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.insider.latest(100)
      .then((d: any) => setTrades(d.trades || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-gold" />
        <h1 className="text-xl font-bold text-text">内部人交易</h1>
      </div>

      <div className="bg-panel2 border border-border2 rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border2 text-muted">
              <th className="text-left px-4 py-2.5">股票</th>
              <th className="text-left px-4 py-2.5">内部人</th>
              <th className="text-left px-4 py-2.5">职位</th>
              <th className="text-left px-4 py-2.5">类型</th>
              <th className="text-right px-4 py-2.5">股数</th>
              <th className="text-right px-4 py-2.5">价格</th>
              <th className="text-right px-4 py-2.5">金额</th>
              <th className="text-left px-4 py-2.5">日期</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border2">
            {loading ? (
              <tr><td colSpan={8} className="py-8 text-center text-muted">加载中...</td></tr>
            ) : trades.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-muted">暂无数据</td></tr>
            ) : (
              trades.map((t: any, i: number) => {
                const colorClass = Object.entries(TYPE_COLOR).find(([k]) =>
                  t.transaction_type?.includes(k.split("-")[0])
                )?.[1] || "text-muted";
                const amount = t.total_value
                  ? `$${(t.total_value / 1000).toFixed(0)}K`
                  : t.shares && t.price_per_share
                  ? `$${((t.shares * t.price_per_share) / 1000).toFixed(0)}K`
                  : "—";
                return (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 text-gold font-bold">{t.symbol}</td>
                    <td className="px-4 py-2.5 text-text">{t.filer_name}</td>
                    <td className="px-4 py-2.5 text-muted">{t.filer_relation}</td>
                    <td className={`px-4 py-2.5 font-medium ${colorClass}`}>{t.transaction_type}</td>
                    <td className="px-4 py-2.5 text-right text-text">
                      {t.shares ? Number(t.shares).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted">
                      {t.price_per_share ? `$${Number(t.price_per_share).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-text">{amount}</td>
                    <td className="px-4 py-2.5 text-muted">{t.transaction_date}</td>
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
