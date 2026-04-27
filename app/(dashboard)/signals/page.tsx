"use client";

import { useState, useEffect, useRef } from "react";
import { clsx } from "clsx";
import { Star, Send, Bookmark } from "lucide-react";

type Signal = {
  id: number;
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
  id: number;
  src: string;
  srcColor: string;
  time: string;
  headline: string;
  sentiment: "bull" | "bear" | "neut";
  tags: string[];
  isTrump?: boolean;
  ai?: string;
};

const SIGNALS: Signal[] = [
  {
    id: 1, type: "gex", priority: "high", tag: "GEX Alert", time: "2 min ago",
    title: "SPY GEX Regime 切换：Positive → Negative Gamma",
    ticker: "SPY", direction: "bear", strength: 5,
    summary: "截至 14:32，SPY Net GEX 从 +2.1B 下滑至 -0.4B，Gamma Flip 位 543 已被有效跌破。在 Negative Gamma 环境下，做市商将顺势对冲，波动率扩张风险显著上升。建议警惕 535 Put Wall 是否支撑。",
  },
  {
    id: 2, type: "flow", priority: "medium", tag: "Flow Alert", time: "8 min ago",
    title: "NVDA 异常 Call 扫单：5,000 张 $140C，到期 5/9",
    ticker: "NVDA", direction: "bull", strength: 4,
    summary: "大单扫入 NVDA 5月9日到期 $140 Call，合约张数 5,000，名义价值约 $220万，溢价成交。IV 同步拉升至 62%。疑似财报前布局或消息面驱动。",
    flowBars: [20, 35, 55, 40, 80, 65, 90, 75, 45, 60, 85, 95],
  },
  {
    id: 3, type: "news", priority: "urgent", tag: "News Alert", time: "12 min ago",
    title: "Trump 发推：宣布对中国商品加征 35% 新关税",
    ticker: "SPY", direction: "bear", strength: 5, isTrump: true,
    tweetText: '"China has been RIPPING US OFF for years. New 35% tariffs effective immediately. AMERICA FIRST! 🇺🇸"',
    summary: "基于历史数据，Trump 关税推文后 SPY 平均在 15 分钟内下跌 0.6–1.2%。当前 Negative Gamma 环境将放大跌幅。建议立即评估现有多头头寸风险，考虑买入短期 Put 对冲。",
  },
  {
    id: 4, type: "macro", priority: "medium", tag: "Macro", time: "25 min ago",
    title: "VIX 突破 20.0，波动率扩张信号触发",
    ticker: "VIX", direction: "bear", strength: 3,
    summary: "VIX 收于 20.3，为近 3 周最高。VIX 期货 Term Structure 出现 Backwardation，显示市场对近期尾部风险的定价急剧上升。",
  },
  {
    id: 5, type: "strategy", priority: "medium", tag: "Strategy", time: "34 min ago",
    title: "AAPL 财报前 IV Crush 预警 — 5/1 盘后",
    ticker: "AAPL", direction: "neut", strength: 3,
    summary: "AAPL 将于 5月1日盘后公布 Q2 财报。ATM IV 当前 38%（IV Rank: 78%ile）。历史 IV Crush 均值 -42%。建议财报前卖方策略：Iron Condor 或 Straddle Sell。",
  },
  {
    id: 6, type: "strategy", priority: "low", tag: "Strategy", time: "1 hr ago",
    title: "每日 SPY 策略建议：Credit Put Spread 风险/收益评估",
    ticker: "SPY", direction: "bull", strength: 3,
    summary: "基于今日开盘 GEX 数据，建议 Credit Put Spread：Sell 540P / Buy 535P，到期 5/2，收益/风险约 1:2.2。注意：下午 GEX Regime 已转负，原策略风险上升，建议缩小仓位。",
  },
];

const NEWS: NewsItem[] = [
  { id: 1, src: "@DeItaone", srcColor: "#1d9bf0", time: "2 min ago", headline: "*BREAKING: Trump Signs Executive Order on China Tariffs — WSJ", sentiment: "bear", tags: ["SPY", "DXY"], isTrump: true, ai: "此消息将推动 SPY 短期下跌 0.5–1%，Put 需求将激增。" },
  { id: 2, src: "Bloomberg", srcColor: "#ff6600", time: "5 min ago", headline: "Fed's Waller: Still need 'several months' of good inflation data before rate cuts", sentiment: "bear", tags: ["SPY", "TLT"], ai: "鹰派言论打压降息预期，SPY 短线偏空。" },
  { id: 3, src: "@zerohedge", srcColor: "#aaa", time: "9 min ago", headline: "VIX spikes to 20.3 as dealers scramble to hedge short gamma exposure heading into weekend", sentiment: "bear", tags: ["VIX", "SPY"], ai: "做市商 Short Gamma 对冲需求加速波动率上升，形成正反馈。" },
  { id: 4, src: "@unusual_whales", srcColor: "#9B6DFF", time: "15 min ago", headline: "$NVDA seeing aggressive call buying: 5,000x $140C 5/9 @ $0.43 premium — Institutional flow", sentiment: "bull", tags: ["NVDA"], ai: "大额期权流显示机构看涨布局，可能有事件驱动。" },
  { id: 5, src: "Bloomberg", srcColor: "#ff6600", time: "22 min ago", headline: "Apple Q2 earnings due May 1 after close; options market pricing ±4.2% move vs historical ±3.8%", sentiment: "neut", tags: ["AAPL"], ai: "隐含波动率高于历史均值，卖方机会更佳。" },
  { id: 6, src: "@SpotGamma", srcColor: "#00D4AA", time: "35 min ago", headline: "SPY net GEX has crossed below zero — entering negative gamma territory. Expect vol expansion this PM.", sentiment: "bear", tags: ["SPY", "VIX"], ai: "SpotGamma 确认 GEX 转负，市场进入高波动阶段。" },
  { id: 7, src: "Reuters", srcColor: "#ff8800", time: "48 min ago", headline: "China's commerce ministry says will 'fight to the end' on any new US tariff measures", sentiment: "bear", tags: ["SPY", "FXI"], ai: "中美贸易摩擦升级，风险资产普遍承压。" },
  { id: 8, src: "@DeItaone", srcColor: "#1d9bf0", time: "1 hr ago", headline: "*NVIDIA CEO JENSEN HUANG TO SPEAK AT COMPUTEX 2026 KEYNOTE — MAY 20", sentiment: "bull", tags: ["NVDA", "SMH"], ai: "科技旗舰事件，NVDA 5月期权隐含波动率可能提前走高。" },
];

const LIVE_POOL: Omit<NewsItem, "id">[] = [
  { src: "@DeItaone", srcColor: "#1d9bf0", time: "just now", headline: '*TRUMP: "THE TARIFFS ARE WORKING, CHINA WILL NEGOTIATE"', sentiment: "neut", tags: ["SPY"], isTrump: true },
  { src: "Bloomberg", srcColor: "#ff6600", time: "just now", headline: "SPY options put volume surges 180% above average in afternoon session", sentiment: "bear", tags: ["SPY"] },
  { src: "@unusual_whales", srcColor: "#9B6DFF", time: "just now", headline: "$QQQ seeing massive put buying: 12,000x $450P 5/2 sweep", sentiment: "bear", tags: ["QQQ"] },
];

let liveId = 200;

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  gex:      { bg: "bg-gold/10",   text: "text-gold",   border: "border-gold/25" },
  flow:     { bg: "bg-blue/10",   text: "text-blue",   border: "border-blue/25" },
  news:     { bg: "bg-red/10",    text: "text-red",    border: "border-red/25" },
  macro:    { bg: "bg-purple/10", text: "text-purple", border: "border-purple/25" },
  strategy: { bg: "bg-green/10",  text: "text-green",  border: "border-green/25" },
};

function SignalCard({ sig }: { sig: Signal }) {
  const [expanded, setExpanded] = useState(true);
  const styles = TYPE_STYLES[sig.type] ?? TYPE_STYLES.news;
  const isUrgent = sig.priority === "urgent";
  const isHigh   = sig.priority === "high";

  return (
    <div
      onClick={() => setExpanded((e) => !e)}
      className={clsx(
        "bg-panel border rounded-[10px] p-3.5 cursor-pointer transition-all relative overflow-hidden",
        isUrgent ? "border-red/50" : isHigh ? "border-gold/40" : "border-border2",
        "hover:border-border hover:-translate-y-px animate-slide-down"
      )}
    >
      {/* Top accent bar */}
      <div className={clsx(
        "absolute top-0 left-0 right-0 h-0.5 rounded-t-[10px]",
        sig.type === "gex"      && "bg-gradient-to-r from-gold to-transparent",
        sig.type === "flow"     && "bg-gradient-to-r from-blue to-transparent",
        sig.type === "news"     && "bg-gradient-to-r from-red to-transparent",
        sig.type === "macro"    && "bg-gradient-to-r from-purple to-transparent",
        sig.type === "strategy" && "bg-gradient-to-r from-green to-transparent",
      )} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2 mt-0.5">
        <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wide", styles.bg, styles.text, styles.border)}>
          {sig.tag}
        </span>
        {sig.isTrump && <span className="text-[9.5px] font-bold text-red bg-red/10 border border-red/30 px-1.5 py-px rounded-full animate-blink">⚡ TRUMP</span>}
        {isUrgent && <span className="text-[9px] font-bold text-red bg-red/10 border border-red/30 px-1.5 py-px rounded-full">URGENT</span>}
        {isHigh && <span className="text-[9px] text-gold bg-gold/10 border border-gold/20 px-1.5 py-px rounded-full">HIGH</span>}
        <span className="ml-auto text-[10px] text-muted font-mono">{sig.time}</span>
      </div>

      {/* Title */}
      <div className={clsx("text-[13.5px] font-semibold leading-snug mb-2", isUrgent && "text-red/90")}>
        {sig.title}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-2 flex-wrap text-[11px] text-muted">
        <span>标的 <strong className="text-text font-mono">{sig.ticker}</strong></span>
        <span>
          方向{" "}
          <strong className={sig.direction === "bull" ? "text-green" : sig.direction === "bear" ? "text-red" : "text-muted"}>
            {sig.direction === "bull" ? "▲ Bullish" : sig.direction === "bear" ? "▼ Bearish" : "— Neutral"}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          强度{" "}
          {[1,2,3,4,5].map((i) => (
            <span key={i} className={clsx("inline-block w-1.5 h-2.5 rounded-sm", i <= sig.strength ? (isUrgent ? "bg-red" : "bg-gold") : "bg-white/10")} />
          ))}
          <span className="font-mono text-[10px]">{sig.strength}/5</span>
        </span>
      </div>

      {expanded && (
        <>
          {sig.flowBars && (
            <div className="flex gap-0.5 items-end h-7 mb-2">
              {sig.flowBars.map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: `rgba(74,158,255,${0.3 + h / 200})` }} />
              ))}
            </div>
          )}

          {sig.isTrump && sig.tweetText && (
            <div className="bg-[#1d9bf0]/[0.06] border border-[#1d9bf0]/20 rounded-[7px] p-2.5 mb-2">
              <div className="flex gap-2 items-start">
                <div className="w-5 h-5 rounded-full bg-[#1d9bf0] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">T</div>
                <div>
                  <div className="text-[11px] font-bold text-text">Donald J. Trump <span className="text-muted font-normal">@realDonaldTrump</span></div>
                  <div className="text-[11.5px] text-text mt-1 leading-snug">{sig.tweetText}</div>
                </div>
              </div>
            </div>
          )}

          <div className={clsx("text-[12px] text-muted leading-relaxed p-2 bg-black/20 rounded-[6px] border-l-2 mb-2.5",
            sig.type === "gex"      && "border-gold",
            sig.type === "flow"     && "border-blue",
            sig.type === "news"     && "border-red",
            sig.type === "macro"    && "border-purple",
            sig.type === "strategy" && "border-green",
          )}>
            {sig.summary}
          </div>
        </>
      )}

      {/* Actions */}
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
      className={clsx("py-2.5 border-b border-border2 cursor-pointer hover:bg-white/[0.02] transition-all", isNew && "animate-slide-down")}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[11px] font-semibold" style={{ color: item.srcColor }}>{item.src}</span>
        {item.isTrump && <span className="text-[9px] font-bold text-red bg-red/10 border border-red/30 px-1 rounded">TRUMP</span>}
        <span className={clsx("ml-auto text-[10px] font-semibold", item.sentiment === "bull" ? "text-green" : item.sentiment === "bear" ? "text-red" : "text-muted")}>
          ● {item.sentiment === "bull" ? "看涨" : item.sentiment === "bear" ? "看跌" : "中性"}
        </span>
        <span className="text-[10px] text-muted font-mono">{item.time}</span>
      </div>
      <p className="text-[12.5px] text-text leading-snug mb-1.5">{item.headline}</p>
      <div className="flex gap-1.5 flex-wrap">
        {item.tags.map((t) => (
          <span key={t} className="text-[9.5px] font-mono bg-white/[0.06] text-muted px-1.5 py-px rounded">{t}</span>
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
  const [news, setNews] = useState<NewsItem[]>(NEWS);
  const [newIds, setNewIds] = useState(new Set<number>());
  const [liveCount, setLiveCount] = useState(0);
  const poolIdx = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      const item = LIVE_POOL[poolIdx.current % LIVE_POOL.length];
      poolIdx.current++;
      const newItem = { ...item, id: liveId++ };
      setNews((prev) => [newItem, ...prev.slice(0, 14)]);
      setNewIds((s) => new Set([...s, newItem.id]));
      setLiveCount((c) => c + 1);
      setTimeout(() => setNewIds((s) => { const n = new Set(s); n.delete(newItem.id); return n; }), 2000);
    }, 14000);
    return () => clearInterval(id);
  }, []);

  const filteredSigs = SIGNALS.filter((s) => {
    if (tickerFilter !== "all" && s.ticker !== tickerFilter) return false;
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (priorityFilter !== "all" && s.priority !== priorityFilter) return false;
    return true;
  });

  const filteredNews = news.filter((n) => {
    if (newsTab === "bloomberg") return n.src === "Bloomberg" || n.src === "Reuters";
    if (newsTab === "twitter")   return n.src.startsWith("@");
    if (newsTab === "macro")     return n.tags.some((t) => ["DXY","TLT","GLD","VIX"].includes(t));
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg">
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border2 bg-panel2 flex-shrink-0 flex-wrap">
        {[
          { label: "标的", value: tickerFilter, set: setTickerFilter, opts: [{v:"all",l:"All"},{v:"SPY",l:"SPY"},{v:"QQQ",l:"QQQ"},{v:"NVDA",l:"NVDA"}] },
          { label: "类型", value: typeFilter,   set: setTypeFilter,   opts: [{v:"all",l:"All"},{v:"gex",l:"GEX"},{v:"flow",l:"Flow"},{v:"news",l:"News"},{v:"strategy",l:"Strategy"}] },
          { label: "优先级", value: priorityFilter, set: setPriorityFilter, opts: [{v:"all",l:"All"},{v:"urgent",l:"紧急"},{v:"high",l:"高"},{v:"medium",l:"中"},{v:"low",l:"低"}] },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted uppercase tracking-wider">{f.label}</span>
            <div className="flex gap-0.5 bg-white/[0.03] border border-border2 p-0.5 rounded-[6px]">
              {f.opts.map((o) => (
                <button key={o.v} onClick={() => f.set(o.v)}
                  className={clsx("px-2 py-1 rounded-[4px] text-[11px] transition-all",
                    f.value === o.v ? "bg-gold-dim border border-border text-gold" : "text-muted hover:text-text"
                  )}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {liveCount > 0 && <span className="text-[11px] text-green font-mono">+{liveCount} 新消息</span>}
          <div className="flex items-center gap-1.5 text-[11px] text-green bg-green/[0.08] border border-green/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-dot" />
            实时更新中
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="flex-1 overflow-hidden grid grid-cols-[1fr_0.67fr]">
        {/* Signal feed */}
        <div className="flex flex-col overflow-hidden border-r border-border2">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border2 flex-shrink-0">
            <div className="flex items-center gap-2 text-[11px] text-muted uppercase tracking-wider">
              <Star className="w-3 h-3 text-gold" />
              信号 Feed
              <span className="bg-white/[0.06] px-1.5 py-px rounded-full text-[10px]">{filteredSigs.length} 条</span>
            </div>
            <span className="text-[11px] text-muted">点击卡片展开/折叠</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
            {filteredSigs.map((sig, i) => (
              <div key={sig.id} style={{ animationDelay: `${i * 0.05}s` }}>
                <SignalCard sig={sig} />
              </div>
            ))}
            {filteredSigs.length === 0 && (
              <div className="text-center py-12 text-muted text-[13px]">没有符合条件的信号</div>
            )}
          </div>
        </div>

        {/* News feed */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex flex-col px-4 pt-2.5 border-b border-border2 flex-shrink-0 gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-muted uppercase tracking-wider">
                实时新闻流
                <span className="bg-white/[0.06] px-1.5 py-px rounded-full text-[10px]">{filteredNews.length} 条</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-green bg-green/[0.08] border border-green/20 px-2 py-px rounded-full">
                <span className="w-1 h-1 rounded-full bg-green animate-pulse-dot" />
                LIVE
              </div>
            </div>
            <div className="flex gap-1">
              {[{v:"all",l:"All"},{v:"bloomberg",l:"Bloomberg"},{v:"twitter",l:"X/Twitter"},{v:"macro",l:"Macro"}].map((t) => (
                <button key={t.v} onClick={() => setNewsTab(t.v)}
                  className={clsx("px-3 py-1 text-[11px] rounded-[5px] border-b-2 transition-all",
                    newsTab === t.v ? "text-gold border-gold" : "text-muted border-transparent hover:text-text"
                  )}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4">
            {filteredNews.map((item) => (
              <NewsRow key={item.id} item={item} isNew={newIds.has(item.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
