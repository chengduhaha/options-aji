"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Star, Send, Bookmark } from "lucide-react";

type Signal = {
  id: string;
  type: "gex" | "flow" | "news" | "macro" | "strategy";
  priority: "urgent" | "high" | "medium" | "low";
  tag: string;
  time: string;
  title: string;
  ticker: string;
  direction: "bull" | "bear" | "neut";
  strength: number;
  summary: string;
  isTrump?: boolean;
  tweetText?: string;
  flowBars?: number[];
};

type NewsItem = {
  id: string;
  src: string;
  srcColor: string;
  time: string;
  headline: string;
  sentiment: "bull" | "bear" | "neut";
  tags: string[];
  isTrump?: boolean;
  ai?: string;
};

type ApiSignalsEnvelope =
  | {
      signals?: {
        id: string;
        type: Signal["type"];
        priority: Signal["priority"];
        tag: string;
        time_cn: string;
        title: string;
        ticker: string;
        direction: Signal["direction"];
        strength: number;
        summary: string;
      }[];
    }
  | { success?: false; error?: { message?: string } };

type DiscordRow = {
  id: string;
  channel_id: string;
  author: string | null;
  content: string | null;
  timestamp: string;
  tickers: string[];
};

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  gex: { bg: "bg-gold/10", text: "text-gold", border: "border-gold/25" },
  flow: { bg: "bg-blue/10", text: "text-blue", border: "border-blue/25" },
  news: { bg: "bg-red/10", text: "text-red", border: "border-red/25" },
  macro: { bg: "bg-purple/10", text: "text-purple", border: "border-purple/25" },
  strategy: { bg: "bg-green/10", text: "text-green", border: "border-green/25" },
};

function formatRelativeCn(iso: string): string {
  const anchor = Date.parse(iso);
  if (Number.isNaN(anchor)) return iso;
  const sec = Math.max(0, Math.floor((Date.now() - anchor) / 1000));
  if (sec < 45) return "刚刚";
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟前`;
  if (sec < 86_400) return `${Math.floor(sec / 3600)} 小时前`;
  return `${Math.floor(sec / 86_400)} 天前`;
}

function hashColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 55% 55%)`;
}

function mapSignalsPayload(raw: ApiSignalsEnvelope): Signal[] {
  if (!raw || typeof raw !== "object" || !("signals" in raw)) {
    return [];
  }
  const pack = raw.signals;
  if (!Array.isArray(pack)) {
    return [];
  }
  return pack.map((row) => ({
    id: row.id,
    type: row.type,
    priority: row.priority,
    tag: row.tag,
    time: row.time_cn,
    title: row.title,
    ticker: row.ticker,
    direction: row.direction,
    strength: row.strength,
    summary: row.summary,
  }));
}

function mapDiscordNews(rows: DiscordRow[]): NewsItem[] {
  return rows.map((row) => {
    const body = row.content?.trim() || "(空消息)";
    return {
      id: row.id,
      src: row.author?.trim() || "Discord",
      srcColor: hashColor(`${row.author ?? ""}|${row.channel_id}`),
      time: formatRelativeCn(row.timestamp),
      headline: body.length > 420 ? `${body.slice(0, 420)}…` : body,
      sentiment: "neut",
      tags: row.tickers ?? [],
    };
  });
}

function SignalCard({ sig }: { sig: Signal }) {
  const [expanded, setExpanded] = useState(true);
  const styles = TYPE_STYLES[sig.type] ?? TYPE_STYLES.news;
  const isUrgent = sig.priority === "urgent";
  const isHigh = sig.priority === "high";

  return (
    <div
      onClick={() => setExpanded((e) => !e)}
      className={clsx(
        "bg-panel border rounded-[10px] p-3.5 cursor-pointer transition-all relative overflow-hidden",
        isUrgent ? "border-red/50" : isHigh ? "border-gold/40" : "border-border2",
        "hover:border-border hover:-translate-y-px animate-slide-down",
      )}
    >
      <div
        className={clsx(
          "absolute top-0 left-0 right-0 h-0.5 rounded-t-[10px]",
          sig.type === "gex" && "bg-gradient-to-r from-gold to-transparent",
          sig.type === "flow" && "bg-gradient-to-r from-blue to-transparent",
          sig.type === "news" && "bg-gradient-to-r from-red to-transparent",
          sig.type === "macro" && "bg-gradient-to-r from-purple to-transparent",
          sig.type === "strategy" && "bg-gradient-to-r from-green to-transparent",
        )}
      />

      <div className="flex items-center gap-2 mb-2 mt-0.5">
        <span
          className={clsx(
            "text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wide",
            styles.bg,
            styles.text,
            styles.border,
          )}
        >
          {sig.tag}
        </span>
        {sig.isTrump && (
          <span className="text-[9.5px] font-bold text-red bg-red/10 border border-red/30 px-1.5 py-px rounded-full animate-blink">
            ⚡ TRUMP
          </span>
        )}
        {isUrgent && (
          <span className="text-[9px] font-bold text-red bg-red/10 border border-red/30 px-1.5 py-px rounded-full">
            URGENT
          </span>
        )}
        {isHigh && (
          <span className="text-[9px] text-gold bg-gold/10 border border-gold/20 px-1.5 py-px rounded-full">
            HIGH
          </span>
        )}
        <span className="ml-auto text-[10px] text-muted font-mono">{sig.time}</span>
      </div>

      <div className={clsx("text-[13.5px] font-semibold leading-snug mb-2", isUrgent && "text-red/90")}>
        {sig.title}
      </div>

      <div className="flex items-center gap-3 mb-2 flex-wrap text-[11px] text-muted">
        <span>
          标的 <strong className="text-text font-mono">{sig.ticker}</strong>
        </span>
        <span>
          方向{" "}
          <strong
            className={
              sig.direction === "bull"
                ? "text-green"
                : sig.direction === "bear"
                  ? "text-red"
                  : "text-muted"
            }
          >
            {sig.direction === "bull" ? "▲ Bullish" : sig.direction === "bear" ? "▼ Bearish" : "— Neutral"}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          强度{" "}
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={clsx(
                "inline-block w-1.5 h-2.5 rounded-sm",
                i <= sig.strength ? (isUrgent ? "bg-red" : "bg-gold") : "bg-white/10",
              )}
            />
          ))}
          <span className="font-mono text-[10px]">{sig.strength}/5</span>
        </span>
      </div>

      {expanded && (
        <>
          {sig.flowBars && (
            <div className="flex gap-0.5 items-end h-7 mb-2">
              {sig.flowBars.map((h, i) => (
                <div
                  key={`${sig.id}-${i}`}
                  className="flex-1 rounded-t-sm"
                  style={{ height: `${h}%`, background: `rgba(74,158,255,${0.3 + h / 200})` }}
                />
              ))}
            </div>
          )}

          {sig.isTrump && sig.tweetText && (
            <div className="bg-[#1d9bf0]/[0.06] border border-[#1d9bf0]/20 rounded-[7px] p-2.5 mb-2">
              <div className="flex gap-2 items-start">
                <div className="w-5 h-5 rounded-full bg-[#1d9bf0] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                  T
                </div>
                <div>
                  <div className="text-[11px] font-bold text-text">
                    Donald J. Trump <span className="text-muted font-normal">@realDonaldTrump</span>
                  </div>
                  <div className="text-[11.5px] text-text mt-1 leading-snug">{sig.tweetText}</div>
                </div>
              </div>
            </div>
          )}

          <div
            className={clsx(
              "text-[12px] text-muted leading-relaxed p-2 bg-black/20 rounded-[6px] border-l-2 mb-2.5 whitespace-pre-wrap",
              sig.type === "gex" && "border-gold",
              sig.type === "flow" && "border-blue",
              sig.type === "news" && "border-red",
              sig.type === "macro" && "border-purple",
              sig.type === "strategy" && "border-green",
            )}
          >
            {sig.summary}
          </div>
        </>
      )}

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] border border-gold/30 bg-gold/10 text-gold text-[11px] hover:bg-gold/20 transition-all">
          详细分析 →
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] border border-border2 text-blue text-[11px] hover:border-border transition-all">
          <Send className="w-3 h-3" /> Discord
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] border border-border2 text-muted text-[11px] hover:border-border transition-all">
          <Bookmark className="w-3 h-3" /> 收藏
        </button>
      </div>
    </div>
  );
}

function NewsRow({ item, isNew }: { item: NewsItem; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={clsx(
        "py-2.5 border-b border-border2 cursor-pointer hover:bg-white/[0.02] transition-all",
        isNew && "animate-slide-down",
      )}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[11px] font-semibold" style={{ color: item.srcColor }}>
          {item.src}
        </span>
        {item.isTrump && (
          <span className="text-[9px] font-bold text-red bg-red/10 border border-red/30 px-1 rounded">TRUMP</span>
        )}
        <span
          className={clsx(
            "ml-auto text-[10px] font-semibold",
            item.sentiment === "bull" ? "text-green" : item.sentiment === "bear" ? "text-red" : "text-muted",
          )}
        >
          ●{" "}
          {item.sentiment === "bull" ? "看涨" : item.sentiment === "bear" ? "看跌" : "中性"}
        </span>
        <span className="text-[10px] text-muted font-mono">{item.time}</span>
      </div>
      <p className="text-[12.5px] text-text leading-snug mb-1.5">{item.headline}</p>
      <div className="flex gap-1.5 flex-wrap">
        {item.tags.map((t) => (
          <span key={t} className="text-[9.5px] font-mono bg-white/[0.06] text-muted px-1.5 py-px rounded">
            {t}
          </span>
        ))}
      </div>
      {expanded && item.ai && (
        <div className="mt-2 p-2 bg-black/20 rounded-[5px] border-l-2 border-border">
          <span className="text-[10px] text-gold font-semibold block mb-0.5">AI 解读</span>
          <span className="text-[11.5px] text-muted">{item.ai}</span>
        </div>
      )}
    </div>
  );
}

export default function SignalsPage() {
  const [tickerFilter, setTickerFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [newsTab, setNewsTab] = useState("all");

  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalsFault, setSignalsFault] = useState<string | null>(null);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsFault, setNewsFault] = useState<string | null>(null);

  const [newIds, setNewIds] = useState(() => new Set<string>());
  const prevNewsIdsRef = useRef(new Set<string>());

  const [lastSynced, setLastSynced] = useState<string>("—");

  const refreshAll = useCallback(async () => {
    const syncedLabel = new Date().toISOString();

    try {
      const sr = await fetch("/api/signals/feed", { cache: "no-store" });
      const stxt = await sr.text();
      if (!sr.ok) {
        throw new Error(stxt || `signals HTTP ${sr.status}`);
      }
      const sj = JSON.parse(stxt) as ApiSignalsEnvelope;
      if ("success" in sj && sj.success === false) {
        const msg = sj.error?.message ?? "signals fetch failed";
        throw new Error(msg);
      }
      setSignals(mapSignalsPayload(sj));
      setSignalsFault(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSignalsFault(msg);
      setSignals([]);
    }

    try {
      const params = new URLSearchParams({
        hours: "72",
        limit: "60",
      });
      const nr = await fetch(`/api/messages?${params.toString()}`, { cache: "no-store" });
      const ntxt = await nr.text();
      if (!nr.ok) throw new Error(ntxt || `messages HTTP ${nr.status}`);
      const nj = JSON.parse(ntxt) as { messages?: DiscordRow[] };
      const rows = Array.isArray(nj.messages) ? nj.messages : [];
      const mapped = mapDiscordNews(rows);

      const nextIds = new Set(mapped.map((m) => m.id));
      const fresh = mapped.filter((m) => !prevNewsIdsRef.current.has(m.id) && prevNewsIdsRef.current.size > 0);
      prevNewsIdsRef.current = nextIds;
      setNews(mapped);

      if (fresh.length > 0) {
        const idSet = new Set(fresh.map((f) => f.id));
        setNewIds(idSet);
        window.setTimeout(() => setNewIds(new Set()), 1800);
      }

      setNewsFault(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setNewsFault(msg);
      setNews([]);
    }

    setLastSynced(syncedLabel.slice(11, 19));
  }, []);

  useEffect(() => {
    void refreshAll();
    const id = window.setInterval(() => {
      void refreshAll();
    }, 90_000);
    return () => window.clearInterval(id);
  }, [refreshAll]);

  const filteredSigs = signals.filter((s) => {
    if (tickerFilter !== "all" && s.ticker !== tickerFilter) return false;
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (priorityFilter !== "all" && s.priority !== priorityFilter) return false;
    return true;
  });

  const filteredNews = news.filter((n) => {
    const hl = n.headline;
    const low = hl.toLowerCase();
    const macroKeywords = ["VIX", "DXY", "TLT", "GLD"];
    const hasMacroTicker = n.tags.some((t) => macroKeywords.includes(t));
    const looksWire = /\bBloomberg\b/i.test(hl) || /\bReuters\b|\bwsj\b|\b华尔街日报\b/i.test(low);
    const looksTwitter =
      /\b@\w+/i.test(hl) ||
      /\b 𝕏 |\bTweetShift\b|\bTwitter\b|\bX\s*\(/i.test(hl) ||
      /@/.test(n.src);

    if (newsTab === "bloomberg") return looksWire;
    if (newsTab === "twitter") return looksTwitter;
    if (newsTab === "macro") return hasMacroTicker || /\bFed\b|\bFOMC\b|\bCPI\b/i.test(hl);
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg">
      {(signalsFault || newsFault) && (
        <div className="px-4 pt-3 text-[12px] text-red border-b border-border2 pb-3 bg-panel2 space-y-1">
          {signalsFault ? (
            <p className="whitespace-pre-wrap">
              信号数据源失败：`{signalsFault}`（确认 OPTIONS_AJI_BACKEND_URL）
            </p>
          ) : null}
          {newsFault ? <p className="whitespace-pre-wrap">Discord 侧栏：`{newsFault}`</p> : null}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border2 bg-panel2 flex-shrink-0 flex-wrap">
        {[
          {
            label: "标的",
            value: tickerFilter,
            set: setTickerFilter,
            opts: [
              { v: "all", l: "All" },
              { v: "^VIX", l: "VIX" },
              { v: "SPY", l: "SPY" },
              { v: "QQQ", l: "QQQ" },
              { v: "NVDA", l: "NVDA" },
            ],
          },
          {
            label: "类型",
            value: typeFilter,
            set: setTypeFilter,
            opts: [
              { v: "all", l: "All" },
              { v: "gex", l: "GEX" },
              { v: "flow", l: "Flow" },
              { v: "news", l: "News" },
              { v: "strategy", l: "Strategy" },
              { v: "macro", l: "Macro" },
            ],
          },
          {
            label: "优先级",
            value: priorityFilter,
            set: setPriorityFilter,
            opts: [
              { v: "all", l: "All" },
              { v: "urgent", l: "紧急" },
              { v: "high", l: "高" },
              { v: "medium", l: "中" },
              { v: "low", l: "低" },
            ],
          },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted uppercase tracking-wider">{f.label}</span>
            <div className="flex gap-0.5 bg-white/[0.03] border border-border2 p-0.5 rounded-[6px]">
              {f.opts.map((o) => (
                <button
                  key={o.v}
                  onClick={() => f.set(o.v)}
                  className={clsx(
                    "px-2 py-1 rounded-[4px] text-[11px] transition-all",
                    f.value === o.v ? "bg-gold-dim border border-border text-gold" : "text-muted hover:text-text",
                  )}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="ml-auto flex flex-col items-end gap-0.5 text-[11px] text-muted font-mono">
          <span>上次同步 UTC {lastSynced}</span>
          <div className="flex items-center gap-1 text-[11px] text-green bg-green/[0.08] border border-green/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-dot" />
            每 90s 轮询后端
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-[1fr_0.67fr]">
        <div className="flex flex-col overflow-hidden border-r border-border2">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border2 flex-shrink-0">
            <div className="flex items-center gap-2 text-[11px] text-muted uppercase tracking-wider">
              <Star className="w-3 h-3 text-gold" />
              信号 Feed
              <span className="bg-white/[0.06] px-1.5 py-px rounded-full text-[10px]">{filteredSigs.length} 条</span>
            </div>
            <span className="text-[11px] text-muted">OpenBBToolkit · yfinance（+可选 GEX 上游）</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
            {filteredSigs.map((sig, i) => (
              <div key={sig.id} style={{ animationDelay: `${i * 0.05}s` }}>
                <SignalCard sig={sig} />
              </div>
            ))}
            {!signalsFault && filteredSigs.length === 0 ? (
              <div className="text-center py-12 text-muted text-[13px]">暂无后端信号或筛选结果为空。</div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden">
          <div className="flex flex-col px-4 pt-2.5 border-b border-border2 flex-shrink-0 gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-muted uppercase tracking-wider">
                实时新闻流
                <span className="bg-white/[0.06] px-1.5 py-px rounded-full text-[10px]">{filteredNews.length} 条</span>
              </div>
              <span className="text-[11px] text-muted font-mono">Discord 存档 72h</span>
            </div>
            <div className="flex gap-1">
              {[
                { v: "all", l: "All" },
                { v: "bloomberg", l: "快讯文风" },
                { v: "twitter", l: "X / 社交" },
                { v: "macro", l: "宏观" },
              ].map((t) => (
                <button
                  key={t.v}
                  onClick={() => setNewsTab(t.v)}
                  className={clsx(
                    "px-3 py-1 text-[11px] rounded-[5px] border-b-2 transition-all",
                    newsTab === t.v ? "text-gold border-gold" : "text-muted border-transparent hover:text-text",
                  )}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4">
            {filteredNews.map((item) => (
              <NewsRow key={item.id} item={item} isNew={newIds.has(item.id)} />
            ))}
            {!newsFault && filteredNews.length === 0 ? (
              <div className="text-center py-16 text-muted text-[13px]">暂无 Discord 消息或未匹配筛选。</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
