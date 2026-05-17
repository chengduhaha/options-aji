"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { api } from "@/lib/api";
import type {
  FeedItemContract,
  KolProfileContract,
  SmartVsRetailContract,
  SocialRadarItemContract,
} from "@/lib/contracts";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

type FeedItem = {
  id: string;
  kind: FeedItemContract["kind"];
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
  const [radar, setRadar] = useState<SocialRadarItemContract[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [smartVsRetail, setSmartVsRetail] = useState<SmartVsRetailContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticker, setTicker] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | FeedItem["kind"]>("all");
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "bullish" | "bearish" | "neutral">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [kolOnly, setKolOnly] = useState(false);
  const [needle, setNeedle] = useState("");
  const [interpById, setInterpById] = useState<Record<string, string>>({});
  const [interpLoading, setInterpLoading] = useState(false);
  const [interpError, setInterpError] = useState<string | null>(null);
  const [kols, setKols] = useState<KolProfileContract[]>([]);

  useEffect(() => {
    let c = false;
    setLoading(true);
    (async () => {
      const j = await api.feed.unified(
        100,
        ticker.trim() ? ticker.trim().toUpperCase() : undefined,
        {
          kind: kindFilter === "all" ? undefined : kindFilter,
          sentiment: sentimentFilter === "all" ? undefined : sentimentFilter,
          priority: priorityFilter === "all" ? undefined : priorityFilter,
          kol_only: kolOnly,
        },
      );
      if (!c && j.items) setItems(j.items as FeedItem[]);
    })()
      .catch(() => {})
      .finally(() => {
        if (!c) setLoading(false);
      });
    return () => {
      c = true;
    };
  }, [ticker, kindFilter, sentimentFilter, priorityFilter, kolOnly]);

  useEffect(() => {
    let cancelled = false;
    api.social
      .kolDirectory()
      .then((payload) => {
        if (!cancelled && payload.items) setKols(payload.items);
      })
      .catch(() => {
        if (!cancelled) setKols([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRadarLoading(true);
    setRadarError(null);
    api.social
      .radar(6)
      .then((payload) => {
        if (!cancelled) setRadar(payload.items);
      })
      .catch(() => {
        if (!cancelled) {
          setRadar([]);
          setRadarError("社媒雷达加载失败");
        }
      })
      .finally(() => {
        if (!cancelled) setRadarLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ticker.trim()) {
      setSmartVsRetail(null);
      return;
    }
    let cancelled = false;
    api.social
      .smartVsRetail(ticker.trim().toUpperCase())
      .then((payload) => {
        if (!cancelled) setSmartVsRetail(payload);
      })
      .catch(() => {
        if (!cancelled) setSmartVsRetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  useEffect(() => {
    if (loading || items.length === 0) return;
    let cancelled = false;
    setInterpLoading(true);
    setInterpError(null);
    (async () => {
      const payloadItems = items.filter(
        (it) => it.body.trim().length > 0 && it.kind !== "resonance",
      );
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
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as "all" | FeedItem["kind"])}
          className="bg-panel border border-border2 text-[12px] px-2 py-1.5 rounded-[6px]"
        >
          <option value="all">全部类型</option>
          <option value="signal">信号</option>
          <option value="discord">Discord</option>
          <option value="macro">宏观</option>
          <option value="news">新闻</option>
          <option value="twitter">社媒</option>
          <option value="resonance">共振信号</option>
        </select>
        <select
          value={sentimentFilter}
          onChange={(e) =>
            setSentimentFilter(e.target.value as "all" | "bullish" | "bearish" | "neutral")
          }
          className="bg-panel border border-border2 text-[12px] px-2 py-1.5 rounded-[6px]"
        >
          <option value="all">全部情绪</option>
          <option value="bullish">Bullish</option>
          <option value="bearish">Bearish</option>
          <option value="neutral">Neutral</option>
        </select>
        <label className="flex items-center gap-1.5 text-[11px] text-muted cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={kolOnly}
            onChange={(e) => setKolOnly(e.target.checked)}
            className="rounded border-border2"
          />
          仅 KOL 社媒
        </label>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as "all" | "high" | "medium" | "low")}
          className="bg-panel border border-border2 text-[12px] px-2 py-1.5 rounded-[6px]"
        >
          <option value="all">全部优先级</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </header>
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {kols.length > 0 && (
          <section className="rounded-[10px] border border-border2 bg-panel2 p-3">
            <div className="text-[12px] font-semibold text-text mb-2">
              KOL 追踪（预设名单，服务端配置）
            </div>
            <div className="flex flex-wrap gap-2">
              {kols.map((k) => (
                <div
                  key={k.handle}
                  className="rounded-md border border-border2 bg-bg/60 px-2 py-1 text-[11px] text-muted"
                  title="近 24h 入库帖子数（依赖 xpoz 拉取）"
                >
                  <span className="text-gold font-mono">{k.label}</span>
                  <span className="ml-1.5 text-[10px]">{k.posts_24h} 帖</span>
                </div>
              ))}
            </div>
          </section>
        )}
        {radarLoading && (
          <div className="text-center text-muted text-[12px] py-2">社媒雷达加载中...</div>
        )}
        {radarError && <div className="text-center text-red text-[12px] py-2">{radarError}</div>}
        {radar.length > 0 && (
          <section className="rounded-[10px] border border-border2 bg-panel2 p-3">
            <div className="text-[12px] font-semibold text-text mb-2">社媒情绪雷达</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {radar.map((r) => (
                <Link
                  key={r.symbol}
                  href={`/stock/${r.symbol}`}
                  className="rounded-md border border-border2 bg-bg/60 p-2 hover:border-gold/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] text-gold flex items-center gap-1">
                      {r.symbol}
                      {r.resonance === "high" ? (
                        <span className="text-[9px] text-amber-200 font-sans" title="共振偏高">
                          ⚡
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[10px] text-muted">{r.mentions_24h}</span>
                  </div>
                  <p className="text-[11px] text-muted mt-1">
                    情绪 {r.sentiment_score} · {r.direction}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
        {smartVsRetail && (
          <section className="rounded-[10px] border border-border2 bg-panel2 p-3">
            <div className="text-[12px] font-semibold text-text mb-1">
              聪明钱 vs 散户钱 · {smartVsRetail.symbol}
            </div>
            <p className="text-[12px] text-muted">
              <span
                className={clsx(
                  "mr-2 text-[10px] px-1.5 py-px rounded border",
                  smartVsRetail.consensus_type === "resonance"
                    ? "border-amber-400/40 text-amber-100"
                    : smartVsRetail.consensus_type === "divergence"
                      ? "border-red-400/30 text-red-200/90"
                      : "border-border2 text-muted",
                )}
              >
                {smartVsRetail.consensus_type === "resonance"
                  ? "共振"
                  : smartVsRetail.consensus_type === "divergence"
                    ? "背离"
                    : "中性"}
              </span>
              机构方向 {smartVsRetail.institutional_direction}（强度 {smartVsRetail.institutional_strength}/5），
              散户情绪 {smartVsRetail.retail_direction}（{smartVsRetail.retail_sentiment_score}/100）。
            </p>
          </section>
        )}
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
    if (it.kind === "resonance") return "共振";
    if (it.kind === "twitter") return "社媒";
    return it.kind;
  };

  const pillTone = (): string => {
    if (it.kind === "news") return "bg-emerald-500/15 text-emerald-200";
    if (it.kind === "signal") return "bg-gold/15 text-gold";
    if (it.kind === "discord") return "bg-blue/10 text-blue";
    if (it.kind === "macro") return "bg-amber-400/15 text-amber-200";
    if (it.kind === "resonance") return "bg-amber-300/20 text-amber-100";
    if (it.kind === "twitter") return "bg-sky-500/10 text-sky-300";
    return "bg-sky-500/10 text-sky-300";
  };

  const aiBackdrop =
    it.kind !== "discord" && it.kind !== "resonance" ? " bg-text/[0.02]" : "";

  return (
    <article className={clsx("bg-panel border border-border2 rounded-[10px] p-4 space-y-2", aiBackdrop)}>
      <div className="flex flex-wrap gap-2 text-[11px] text-muted items-center">
        <span className={clsx("px-1.5 py-px rounded capitalize", pillTone())}>{pillText()}</span>
        <span>{new Date(it.created_at_utc).toLocaleString()}</span>
        {it.priority && <span>优先级 {it.priority}</span>}
        {it.sentiment && (it.kind === "signal" || it.kind === "resonance") && (
          <span>情绪 {it.sentiment}</span>
        )}
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
