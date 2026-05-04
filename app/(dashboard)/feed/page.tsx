"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

type FeedItem = {
  id: string;
  kind: "signal" | "discord";
  created_at_utc: string;
  title: string;
  body: string;
  tickers: string[];
  sentiment?: string | null;
  priority?: string | null;
};

export default function FeedPage() {
  const [kind, setKind] = useState<"all" | "signal" | "discord">("all");
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
          <article
            key={it.id}
            className="bg-panel border border-border2 rounded-[10px] p-4 space-y-2"
          >
            <div className="flex flex-wrap gap-2 text-[11px] text-muted">
              <span
                className={clsx(
                  "px-1.5 py-px rounded",
                  it.kind === "signal" ? "bg-gold/15 text-gold" : "bg-blue/10 text-blue",
                )}
              >
                {it.kind}
              </span>
              <span>{new Date(it.created_at_utc).toLocaleString()}</span>
              {it.priority && <span>优先级 {it.priority}</span>}
            </div>
            <h2 className="text-[14px] font-semibold text-text">{it.title}</h2>
            <p className="text-[13px] text-muted whitespace-pre-wrap leading-relaxed">{it.body}</p>
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
        ))}
        {items.length === 0 && (
          <div className="text-center text-muted text-[13px] py-16">暂无内容，请检查后端与数据源。</div>
        )}
      </div>
    </div>
  );
}
