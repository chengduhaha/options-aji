"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

type FeedItem = {
  id: string;
  kind: "signal" | "discord" | "macro" | "twitter";
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

export default function FeedPage() {
  const [kind, setKind] = useState<"all" | "signal" | "discord" | "macro" | "twitter">("all");
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    let c = false;
    (async () => {
      const qs = kind === "all" ? "" : `?kind=${kind}`;
      const res = await fetch(`/api/feed${qs}`, {
        headers: { "X-API-Key": API_KEY },
        cache: "no-store",
      });
      if (!res.ok || c) return;
      const j = (await res.json()) as { items?: FeedItem[] };
      if (j.items) setItems(j.items);
    })();
    return () => {
      c = true;
    };
  }, [kind]);

  const filters = useMemo(
    () =>
      [
        { id: "all" as const, label: "全部" },
        { id: "signal" as const, label: "AI 信号" },
        { id: "discord" as const, label: "Discord" },
        { id: "macro" as const, label: "宏观" },
        { id: "twitter" as const, label: "X / 推特" },
      ],
    [],
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-5 py-3 border-b border-border2 bg-panel2 flex-shrink-0 flex flex-wrap gap-2 items-center">
        <h1 className="text-lg font-semibold text-text mr-4">信息流</h1>
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setKind(f.id)}
            className={clsx(
              "text-[12px] px-2.5 py-1 rounded-[6px] border",
              kind === f.id ? "border-gold text-gold" : "border-border2 text-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </header>
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {items.map((it) => (
          <FeedCard key={it.id} item={it} />
        ))}
        {items.length === 0 && (
          <div className="text-center text-muted text-[13px] py-16">暂无内容，请检查后端与数据源。</div>
        )}
      </div>
    </div>
  );
}

function FeedCard({ item: it }: { item: FeedItem }) {
  const [showRaw, setShowRaw] = useState(false);
  const hasRaw =
    typeof it.raw_body === "string" &&
    it.raw_body.trim().length > 0 &&
    it.raw_body.trim() !== it.body.trim();

  return (
    <article className="bg-panel border border-border2 rounded-[10px] p-4 space-y-2">
      <div className="flex flex-wrap gap-2 text-[11px] text-muted">
        <span
          className={clsx(
            "px-1.5 py-px rounded",
            it.kind === "signal"
              ? "bg-gold/15 text-gold"
              : it.kind === "discord"
                ? "bg-blue/10 text-blue"
                : it.kind === "macro"
                  ? "bg-amber-400/15 text-amber-200"
                  : "bg-sky-500/10 text-sky-300",
          )}
        >
          {it.kind}
        </span>
        <span>{new Date(it.created_at_utc).toLocaleString()}</span>
        {it.priority && <span>优先级 {it.priority}</span>}
        {it.original_lang && it.kind === "discord" && (
          <span>原文语言 {it.original_lang}</span>
        )}
      </div>
      <h2 className="text-[14px] font-semibold text-text">{it.title}</h2>
      {it.bullets_zh && it.bullets_zh.length > 0 && it.kind === "discord" && (
        <ul className="text-[13px] text-text/90 list-disc pl-4 space-y-1">
          {it.bullets_zh.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      <p className="text-[13px] text-muted whitespace-pre-wrap leading-relaxed">{it.body}</p>
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
