/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Globe } from "lucide-react";
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

/** FMP `/treasury-rates` uses month1/year10; DB-backed API uses 1M/10Y. */
function treasuryRowToCurve(row: Record<string, unknown>): { term: string; rate: number | null }[] {
  const pick = (...keys: string[]): number | null => {
    for (const k of keys) {
      const v = row[k];
      if (v != null && v !== "") {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
    }
    return null;
  };
  return [
    { term: "1M", rate: pick("1M", "month1") },
    { term: "3M", rate: pick("3M", "month3") },
    { term: "6M", rate: pick("6M", "month6") },
    { term: "1Y", rate: pick("1Y", "year1") },
    { term: "2Y", rate: pick("2Y", "year2") },
    { term: "5Y", rate: pick("5Y", "year5") },
    { term: "10Y", rate: pick("10Y", "year10") },
    { term: "30Y", rate: pick("30Y", "year30") },
  ];
}

const PROXY_HINT =
  "无法连接后端 API：若在 Vercel 部署，请设置 OPTIONS_AJI_BACKEND_URL 为公网可达的 FastAPI（不可填 localhost）。数据源需在后端配置 FMP_API_KEY。";

export default function MacroPage() {
  const [calendar, setCalendar] = useState<any[]>([]);
  const [treasury, setTreasury] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    setLoading(true);
    Promise.allSettled([api.macro.calendar(), api.macro.treasury(30)])
      .then(([calRes, treasRes]) => {
        const errs: string[] = [];
        if (calRes.status === "fulfilled") {
          setCalendar(((calRes.value as any).events || []) as any[]);
        } else {
          setCalendar([]);
          const r = calRes.reason;
          errs.push(`经济日历：${r instanceof Error ? r.message : String(r)}`);
        }
        if (treasRes.status === "fulfilled") {
          setTreasury(((treasRes.value as any).rates || []) as any[]);
        } else {
          setTreasury([]);
          const r = treasRes.reason;
          errs.push(`国债收益率：${r instanceof Error ? r.message : String(r)}`);
        }
        setLoadError(errs.length ? errs.join(" ") : null);
      })
      .finally(() => setLoading(false));
  }, []);

  const latestRate = treasury[0] as Record<string, unknown> | undefined;
  const yieldCurve = latestRate ? treasuryRowToCurve(latestRate) : [];
  const hasTreasuryPoints = yieldCurve.some(p => p.rate != null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-gold" />
        <h1 className="text-xl font-bold text-text">宏观经济</h1>
      </div>

      {loadError && (
        <div className="bg-panel2 border border-red-400/30 rounded-xl p-5 text-sm text-muted space-y-2">
          <p className="text-red-400 font-medium">部分数据加载失败</p>
          <p className="font-mono text-[11px] break-all">{loadError}</p>
          <p className="text-[12px]">{PROXY_HINT}</p>
        </div>
      )}

      {hasTreasuryPoints ? (
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
            <LineChart data={yieldCurve.filter((p): p is { term: string; rate: number } => p.rate != null)}>
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
      ) : (
        !loading && (
          <div className="bg-panel2 border border-border2 rounded-xl p-5 text-muted text-sm">
            <h2 className="text-sm font-semibold text-text mb-2">美国国债收益率曲线</h2>
            <p>
              暂无可用收益率点位：请在后端配置 <span className="font-mono text-gold">FMP_API_KEY</span>
              ，并运行 treasury 同步任务，或确认接口返回的 treasury 字段有效。
            </p>
          </div>
        )
      )}

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
