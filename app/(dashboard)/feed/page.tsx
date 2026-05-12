"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

type FeedItem = {
  id: string;
  kind: "signal" | "discord" | "macro" | "twitter" | "news";
  created_at_utc: string;
  title: string;
  body: string;
  tickers: string[];
  sentiment?: string | null;
  priority?: string | null;
  raw_body?: string | null;
  original_lang?: string | null;
  bullets_zh?: string[] | null;
  risk_note_zh?: string | null;
};

const INTERP_CHUNK = 10;

function chunkFeedItems<T>(arr: readonly T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticker, setTicker] = useState("");
  const [needle, setNeedle] = useState("");
  const [interpById, setInterpById] = useState<Record<string, string>>({});
  const [interpLoading, setInterpLoading] = useState(false);
  const [interpError, setInterpError] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    setLoading(true);
    (async () => {
      const qs = new URLSearchParams();
      qs.set("limit", "100");
      if (ticker.trim()) qs.set("ticker", ticker.trim().toUpperCase());
      const res = await fetch(`/api/feed/unified?${qs.toString()}`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok || c) return;
      const j = (await res.json()) as { items?: FeedItem[] };
      if (!c && j.items) setItems(j.items);
    })()
      .catch(() => {})
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, [ticker]);

  useEffect(() => {
    if (loading || items.length === 0) return;
    let cancelled = false;
    setInterpLoading(true);
    setInterpError(null);
    (async () => {
      const payloadItems = items.filter((it) => it.body.trim().length > 0);
      const batches = chunkFeedItems(payloadItems, INTERP_CHUNK);
      const merged: Record<string, string> = {};
      try {
        for (const batch of batches) {
          const res = await fetch("/api/feed/interpret-batch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": API_KEY,
            },
            body: JSON.stringify({
              items: batch.map((it) => ({
                id: it.id,
                kind: it.kind,
                title: it.title,
                body: it.body,
                tickers: it.tickers,
              })),
            }),
          });
          if (!res.ok) {
            const t = await res.text();
            throw new Error(t.slice(0, 200) || `HTTP ${res.status}`);
          }
          const j = (await res.json()) as {
            interpretations?: Record<string, string>;
          };
          const map = j.interpretations;
          if (map && typeof map === "object") {
            for (const [k, v] of Object.entries(map)) {
              if (typeof v === "string" && v.trim()) merged[k] = v.trim();
            }
          }
        }
        if (!cancelled) setInterpById(merged);
      } catch (e) {
        if (!cancelled) {
          setInterpError(e instanceof Error ? e.message : "interpret_failed");
          setInterpById({});
        }
      } finally {
        if (!cancelled) setInterpLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, items]);

  const filtered = useMemo(() => {
    const q = needle.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.body.toLowerCase().includes(q),
    );
  }, [items, needle]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-5 py-3 border-b border-border2 bg-panel2 flex-shrink-0 flex flex-wrap gap-2 items-center">
        <h1 className="text-lg font-semibold text-text mr-4">信息流</h1>
        <input
          placeholder="只看标的 SPY..."
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          className="bg-panel border border-border2 text-[12px] px-2 py-1.5 rounded-[6px] w-36 font-mono"
        />
        <input
          placeholder="搜索正文…"
          value={needle}
          onChange={(e) => setNeedle(e.target.value)}
          className="bg-panel border border-border2 text-[12px] px-2 py-1.5 rounded-[6px] flex-1 min-w-[160px]"
        />
      </header>
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {loading && (
          <div className="text-center text-muted py-16 text-[13px]">载入统一时间轴…</div>
        )}
        {!loading && interpLoading && (
          <div className="text-center text-gold text-[12px] py-3 border border-gold/20 rounded-lg bg-gold/[0.04]">
            AI 批量解读进行中…（每批最多 {INTERP_CHUNK} 条，含缓存）
          </div>
        )}
        {!loading && interpError && (
          <div className="text-center text-red text-[12px] py-2">
            AI 解读未生效：{interpError}
          </div>
        )}
        {!loading && filtered.map((it) => (
          <FeedCard
            key={`${it.id}-${it.created_at_utc}`}
            item={it}
            interpretationZh={interpById[it.id]}
          />
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center text-muted text-[13px] py-16">暂无条目</div>
        )}
      </div>
    </div>
  );
}

function FeedCard({
  item: it,
  interpretationZh,
}: {
  item: FeedItem;
  interpretationZh?: string;
}) {
  const [showRaw, setShowRaw] = useState(false);
  const hasRaw =
    typeof it.raw_body === "string" &&
    it.raw_body.trim().length > 0 &&
    it.raw_body.trim() !== it.body.trim();

  const pillText = (): string => {
    if (it.kind === "news") return "news";
    if (it.kind === "signal") return "signal";
    if (it.kind === "discord") return "Discord";
    if (it.kind === "macro") return "macro";
    return it.kind;
  };

  const pillTone = (): string => {
    if (it.kind === "news") return "bg-emerald-500/15 text-emerald-200";
    if (it.kind === "signal") return "bg-gold/15 text-gold";
    if (it.kind === "discord") return "bg-blue/10 text-blue";
    if (it.kind === "macro") return "bg-amber-400/15 text-amber-200";
    return "bg-sky-500/10 text-sky-300";
  };

  const aiBackdrop = it.kind !== "discord" ? " bg-text/[0.02]" : "";

  return (
    <article className={clsx("bg-panel border border-border2 rounded-[10px] p-4 space-y-2", aiBackdrop)}>
      <div className="flex flex-wrap gap-2 text-[11px] text-muted items-center">
        <span className={clsx("px-1.5 py-px rounded capitalize", pillTone())}>{pillText()}</span>
        <span>{new Date(it.created_at_utc).toLocaleString()}</span>
        {it.priority && <span>优先级 {it.priority}</span>}
        {it.original_lang && it.kind === "discord" && (
          <span>原文语言 {it.original_lang}</span>
        )}
      </div>
      <h2 className="text-[14px] font-semibold text-text">{it.title}</h2>
      {interpretationZh && interpretationZh.trim() && (
        <div className="rounded-md border border-gold/25 bg-gold/[0.06] px-3 py-2 space-y-1">
          <p className="text-[11px] text-gold font-medium">AI 解读</p>
          <p className="text-[12px] text-text/90 whitespace-pre-wrap leading-relaxed">{interpretationZh}</p>
        </div>
      )}
      {it.bullets_zh && it.bullets_zh.length > 0 && it.kind === "discord" && (
        <ul className="text-[13px] text-text/90 list-disc pl-4 space-y-1">
          {it.bullets_zh.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      <div className="rounded-md border border-border2/50 bg-panel2/40 px-3 py-2">
        <p className="text-[12px] text-muted mb-0.5">摘要 / 原文</p>
        <p className="text-[13px] text-text/90 whitespace-pre-wrap leading-relaxed">{it.body}</p>
      </div>
      {it.risk_note_zh && it.kind === "discord" && (
        <p className="text-[12px] text-amber-200/90 border border-amber-400/20 rounded-md px-2 py-1.5 bg-amber-400/5">
          {it.risk_note_zh}
        </p>
      )}
      {hasRaw && (
        <div>
          <button
            type="button"
            onClick={() => setShowRaw((s) => !s)}
            className="text-[11px] text-blue hover:underline"
          >
            {showRaw ? "收起原文" : "展开原文"}
          </button>
          {showRaw && (
            <pre className="mt-2 text-[12px] text-muted whitespace-pre-wrap border border-border2 rounded-md p-2 max-h-64 overflow-y-auto">
              {it.raw_body}
            </pre>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {it.tickers.map((t) => (
          <Link
            key={t}
            href={`/stock/${t}`}
            className="text-[11px] font-mono px-1.5 py-px rounded border border-border2 text-gold hover:border-border"
          >
            {t}
          </Link>
        ))}
      </div>
    </article>
  );
}
