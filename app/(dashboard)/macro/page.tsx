"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Globe, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const IMPACT_COLOR: Record<string, string> = {
  High: "text-red-400",
  Medium: "text-yellow-400",
  Low: "text-green-400",
};

const IMPACT_DOT: Record<string, string> = {
  High: "bg-red-400",
  Medium: "bg-yellow-400",
  Low: "bg-green-400",
};

export default function MacroPage() {
  const [calendar, setCalendar] = useState<any[]>([]);
  const [treasury, setTreasury] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.macro.calendar(), api.macro.treasury(30)])
      .then(([cal, treas]) => {
        setCalendar((cal as any).events || []);
        setTreasury((treas as any).rates || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const latestRate = treasury[0];
  const yieldCurve = latestRate
    ? [
        { term: "1M", rate: latestRate["1M"] },
        { term: "3M", rate: latestRate["3M"] },
        { term: "6M", rate: latestRate["6M"] },
        { term: "1Y", rate: latestRate["1Y"] },
        { term: "2Y", rate: latestRate["2Y"] },
        { term: "5Y", rate: latestRate["5Y"] },
        { term: "10Y", rate: latestRate["10Y"] },
        { term: "30Y", rate: latestRate["30Y"] },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-gold" />
        <h1 className="text-xl font-bold text-text">宏观经济</h1>
      </div>

      {/* Yield Curve */}
      {yieldCurve.length > 0 && (
        <div className="bg-panel2 border border-border2 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text mb-1">美国国债收益率曲线</h2>
          <div className="flex gap-4 mb-3 flex-wrap">
            {yieldCurve.map(p => (
              <div key={p.term} className="text-center">
                <div className="text-[10px] text-muted">{p.term}</div>
                <div className="text-[13px] font-bold text-gold">
                  {p.rate != null ? `${Number(p.rate).toFixed(2)}%` : "—"}
                </div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={yieldCurve}>
              <CartesianGrid stroke="#333" strokeDasharray="3 3" />
              <XAxis dataKey="term" tick={{ fontSize: 10, fill: "#888" }} />
              <YAxis tick={{ fontSize: 10, fill: "#888" }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #333", fontSize: 12 }}
                formatter={(v: any) => [`${Number(v).toFixed(3)}%`, "收益率"]}
              />
              <Line type="monotone" dataKey="rate" stroke="#d4af37" dot={{ r: 3 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Economic Calendar */}
      <div className="bg-panel2 border border-border2 rounded-xl">
        <div className="px-5 py-3 border-b border-border2">
          <h2 className="text-sm font-semibold text-text">经济日历</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted text-sm">加载中...</div>
        ) : calendar.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">暂无数据</div>
        ) : (
          <div className="divide-y divide-border2">
            {calendar.slice(0, 50).map((ev: any, i: number) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${IMPACT_DOT[ev.impact] || "bg-gray-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-text truncate">{ev.event}</span>
                    <span className={`text-[10px] font-semibold ${IMPACT_COLOR[ev.impact] || "text-muted"}`}>
                      {ev.impact}
                    </span>
                    <span className="text-[10px] text-muted">{ev.country}</span>
                  </div>
                  <div className="flex gap-4 mt-0.5 text-[11px] text-muted">
                    <span>{new Date(ev.date).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    {ev.estimate != null && <span>预期: {ev.estimate}</span>}
                    {ev.previous != null && <span>前值: {ev.previous}</span>}
                    {ev.actual != null && (
                      <span className="text-gold font-semibold">实际: {ev.actual}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
