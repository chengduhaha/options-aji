"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";

type DiscordRow = {
  id: string;
  channel_id: string;
  author: string | null;
  content: string | null;
  timestamp: string;
  tickers: string[];
};

type Envelope = { messages?: DiscordRow[] };

const HOURS_OPTS = [
  { key: "24", value: 24 },
  { key: "72", value: 72 },
  { key: "168", value: 168 },
];

export default function NewsPage() {
  const [hours, setHours] = useState(72);
  const [filterTicker, setFilterTicker] = useState("");
  const [payload, setPayload] = useState<Envelope | null>(null);
  const [fault, setFault] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tickerQuery = filterTicker.trim().toUpperCase() || undefined;

  const queryLabel = useMemo(() => `${hours}h${tickerQuery ? ` · ${tickerQuery}` : ""}`, [
    hours,
    tickerQuery,
  ]);

  const ingest = useCallback(async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams({
        hours: String(hours),
        limit: "160",
      });
      if (tickerQuery) params.set("ticker", tickerQuery);

      const res = await fetch(`/api/messages?${params.toString()}`, { cache: "no-store" });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `HTTP ${res.status}`);
      }
      const decoded = JSON.parse(text) as Envelope;
      setPayload(decoded);
      setFault(null);
    } catch (err: unknown) {
      setFault(err instanceof Error ? err.message : "加载失败");
      setPayload(null);
    } finally {
      setBusy(false);
    }
  }, [hours, tickerQuery]);

  useEffect(() => {
    ingest();
    const cadence = window.setInterval(ingest, 60_000);
    return () => window.clearInterval(cadence);
  }, [ingest]);

  const rows = payload?.messages ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg">
      <div className="px-5 py-3 border-b border-border2 bg-panel2 flex flex-wrap items-center gap-3 flex-shrink-0">
        <h1 className="text-[14px] font-semibold tracking-tight mr-4">Discord 存档</h1>

        <div className="flex items-center gap-2 text-[12px] text-muted">
          <label htmlFor="news-hours" className="text-[11px] uppercase tracking-wide">
            回望
          </label>
          <select
            id="news-hours"
            value={String(hours)}
            onChange={(e) => setHours(Number.parseInt(e.target.value, 10))}
            className="bg-panel border border-border2 text-text text-[11.5px] px-2 py-1 rounded-[6px] focus:outline-none focus:border-border"
          >
            {HOURS_OPTS.map((candidate) => (
              <option key={candidate.key} value={String(candidate.value)}>
                {candidate.key}h
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-[360px]">
          <label htmlFor="news-ticker" className="text-[11px] text-muted whitespace-nowrap">
            标的筛选
          </label>
          <input
            id="news-ticker"
            placeholder="可选，如 NVDA"
            value={filterTicker}
            onChange={(e) => setFilterTicker(e.target.value.toUpperCase())}
            className="flex-1 bg-panel border border-border2 text-[12px] font-mono px-2.5 py-1 rounded-[6px] focus:outline-none focus:border-border"
          />
          <button
            type="button"
            disabled={busy}
            onClick={ingest}
            className={clsx(
              "px-3 py-1 rounded-[6px] border text-[11.5px] transition-all",
              busy
                ? "border-border2 text-muted cursor-wait"
                : "border-border2 text-muted hover:border-border hover:text-text",
            )}
          >
            刷新
          </button>
        </div>

        <span className="text-[10px] text-muted font-mono">同步周期 60s · {queryLabel}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {fault ? (
          <div className="rounded-[10px] border border-red/40 bg-red/10 px-4 py-3 text-[12px] text-red whitespace-pre-wrap">
            {fault}
          </div>
        ) : null}

        {!fault && rows.length === 0 && !busy ? (
          <p className="text-[13px] text-muted text-center mt-24">
            暂无存档。请先确认后端 Discord Bot 入账，或稍后点击「刷新」。
          </p>
        ) : null}

        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-[10px] border border-border2 bg-panel2 px-4 py-3 hover:border-border transition-colors"
          >
            <div className="flex flex-wrap gap-2 justify-between items-baseline mb-1.5">
              <span className="text-[13px] font-semibold">{row.author ?? "未知作者"}</span>
              <div className="flex flex-wrap gap-2 items-center font-mono text-[10px] text-muted">
                <span>{row.timestamp}</span>
                <span>#ch {row.channel_id.slice(-8)}</span>
                <span>{row.tickers.length ? row.tickers.join(", ") : "∅ ticker"}</span>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-text">
              {row.content ?? "(无正文)"}
            </p>
          </article>
        ))}

        {busy ? (
          <p className="text-[11px] text-muted text-center py-8">载入中 …</p>
        ) : null}
      </div>
    </div>
  );
}
