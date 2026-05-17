import Link from "next/link";

import type { HotEvent } from "@/lib/crossMarket";
import { getServerOrigin } from "@/lib/serverOrigin";

export default async function CrossMarketHomePage() {
  const origin = await getServerOrigin();
  const res = await fetch(`${origin}/api/cross-market/events/hot`, { cache: "no-store" });
  const data = (res.ok ? await res.json() : { events: [] }) as { events: HotEvent[] };
  const events = data.events ?? [];
  const avgDisagreement =
    events.length > 0 ? (events.reduce((sum, event) => sum + event.disagreement, 0) / events.length) * 100 : 0;
  const topPolymarket = events[0]?.probabilities.polymarket ?? 0;
  const highRiskCount = events.filter((event) => event.disagreement > 0.15).length;

  const cards = [
    {
      title: "波动率环境",
      subtitle: "跨源概率平均背离",
      value: `${avgDisagreement.toFixed(1)}%`,
      hint: "背离越高，期权与预测市场分歧越大",
    },
    {
      title: "事件流动性",
      subtitle: "今日热点事件数量",
      value: `${events.length}`,
      hint: "来自 Polymarket 与多源融合",
    },
    {
      title: "高背离机会",
      subtitle: "背离 > 15% ",
      value: `${highRiskCount}`,
      hint: "可优先查看套利扫描",
    },
    {
      title: "预测市场热度",
      subtitle: "列表首条 PM 概率",
      value: `${(topPolymarket * 100).toFixed(1)}%`,
      hint: "仅示意，非投资建议",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <header className="space-y-2 border-b border-border pb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Cross-market</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">跨市场总览</h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          一览预测市场与多源概率结构。数据经 Next.js 代理至后端；生产环境请配置{" "}
          <span className="font-mono text-primary">OPTIONS_AJI_BACKEND_URL</span>。
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <article
            key={card.title}
            className="group relative rounded-xl border border-border bg-card/80 p-5 shadow-sm hover:border-primary/30 transition-colors"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-xs font-medium text-primary mb-1">{card.title}</h3>
            <p className="text-[11px] text-muted-foreground mb-3">{card.subtitle}</p>
            <p className="text-2xl font-mono font-semibold text-foreground tabular-nums">{card.value}</p>
            <p className="text-[11px] text-muted-foreground/80 mt-3 leading-snug">{card.hint}</p>
          </article>
        ))}
      </div>

      <article className="rounded-xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">跨市场热点事件</h2>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{events.length} 条</span>
        </div>
        <div className="p-5 space-y-1">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              暂无事件数据。请确认后端已启动且 Polymarket 可访问。
            </p>
          ) : (
            events.map((event) => (
              <div
                key={event.event_id}
                className="rounded-lg border border-transparent hover:border-border hover:bg-background/50 px-3 py-3 transition-colors"
              >
                <div className="font-medium text-foreground">
                  <Link href={`/event/${encodeURIComponent(event.event_id)}`} className="text-primary hover:underline">
                    {event.title_zh}
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground mt-1.5 space-x-2 flex flex-wrap gap-y-1">
                  <span>预测市场 {(event.probabilities.polymarket * 100).toFixed(1)}%</span>
                  <span>·</span>
                  <span>背离 {(event.disagreement * 100).toFixed(1)}%</span>
                  <span>·</span>
                  <span>方向 {event.arbitrage_direction}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </article>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/cross-market/scanner"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          套利扫描
        </Link>
        <Link
          href="/cross-market/feed"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-glass"
        >
          跨市场信息流
        </Link>
        <Link href="/copilot" className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-glass">
          本体 Copilot
        </Link>
      </div>
    </div>
  );
}
