/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ListFilter } from "lucide-react";

type DayMap = Record<string, any[]>;

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const weekdayLabels = ["周一", "周二", "周三", "周四", "周五"];

export default function EarningsPage() {
  const [anchor, setAnchor] = useState(() => startOfWeekMonday(new Date()));
  const [days, setDays] = useState<DayMap>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    const mon = startOfWeekMonday(anchor);
    return [0, 1, 2, 3, 4].map((i) => addDays(mon, i));
  }, [anchor]);

  useEffect(() => {
    setErr(null);
    setLoading(true);
    const from = fmt(weekDays[0]!);
    const to = fmt(weekDays[4]!);
    fetch(`/api/earnings/calendar-view?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(async (r) => {
        const j = (await r.json()) as { days?: DayMap; total?: number; error?: { message?: string } };
        if (!r.ok) throw new Error(j?.error?.message ?? "请求失败");
        setDays(j.days ?? {});
        setTotal(j.total ?? 0);
      })
      .catch((e: unknown) => {
        setDays({});
        setTotal(0);
        setErr(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setLoading(false));
  }, [weekDays]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <ListFilter className="w-5 h-5 text-gold" />
        <h1 className="text-xl font-bold text-text">财报日历</h1>
        <div className="flex items-center gap-2 ml-auto text-[12px]">
          <button
            type="button"
            className="p-1.5 border border-border2 rounded-md"
            onClick={() => setAnchor((a) => addDays(a, -7))}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-muted font-mono min-w-[180px] text-center">
            {fmt(weekDays[0]!)} ~ {fmt(weekDays[4]!)}
          </span>
          <button
            type="button"
            className="p-1.5 border border-border2 rounded-md"
            onClick={() => setAnchor((a) => addDays(a, 7))}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-muted">
        周视图聚合 FastAPI `/api/earnings/calendar-view` — 后端需同步 FMP earnings 日历到 PostgreSQL。
        条目 {total}。
      </p>

      {loading ? (
        <div className="text-center text-muted py-16">加载中…</div>
      ) : err ? (
        <div className="bg-panel2 border border-red-400/30 rounded-xl p-6 text-sm text-muted space-y-2">
          <p className="text-red-400 font-medium">加载失败</p>
          <p className="font-mono text-[11px] break-all">{err}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {weekDays.map((d, idx) => {
            const key = fmt(d);
            const list = Array.isArray(days[key]) ? days[key] : [];
            return (
              <div
                key={key}
                className="bg-panel2 border border-border2 rounded-xl p-3 min-h-[160px] flex flex-col gap-2"
              >
                <div className="text-[11px] text-muted">{weekdayLabels[idx]}</div>
                <div className="text-sm font-mono text-gold">{key.slice(5)}</div>
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px] pr-1">
                  {list.length === 0 && <div className="text-[11px] text-muted">无财报</div>}
                  {list.map((ev: any, i: number) => (
                    <div key={`${ev.symbol}-${i}`} className="bg-panel rounded-lg px-2 py-1.5 border border-border2/60">
                      <div className="text-[13px] font-semibold text-text">{ev.symbol}</div>
                      <div className="text-[10px] text-muted">
                        {ev.time === "BMO" ? "盘前" : ev.time === "AMC" ? "盘后" : ev.time ?? "—"}
                      </div>
                      <div className="text-[10px] text-muted mt-0.5 space-x-2">
                        {ev.epsEstimate != null && <span>EPS估 {ev.epsEstimate}</span>}
                        {ev.epsActual != null && <span className="text-gold">实 {ev.epsActual}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
