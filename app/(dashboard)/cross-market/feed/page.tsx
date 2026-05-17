import { getServerOrigin } from "@/lib/serverOrigin";

const KIND_ZH: Record<string, string> = {
  event: "事件",
  signal: "信号",
  news: "资讯",
};

const URGENCY_ZH: Record<string, string> = {
  urgent: "紧急",
  important: "重要",
  normal: "一般",
};

const SENT_ZH: Record<string, string> = {
  bullish: "偏多",
  bearish: "偏空",
  neutral: "中性",
};

function zhKind(k: string) {
  return KIND_ZH[k] ?? k;
}
function zhUrgency(u: string) {
  return URGENCY_ZH[u] ?? u;
}
function zhSent(s: string) {
  return SENT_ZH[s] ?? s;
}

export default async function CrossMarketFeedPage() {
  const origin = await getServerOrigin();
  const res = await fetch(`${origin}/api/cross-market/feed`, { cache: "no-store" });
  const data = res.ok ? await res.json() : { items: [] };
  const items = (data as { items: Array<Record<string, unknown>> }).items ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2 border-b border-border pb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cross-market feed</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">跨市场信息流</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          聚合热点事件与套利扫描信号。加载较慢时多为后端在拉取 Polymarket / 融合数据；请确认{" "}
          <span className="font-mono text-primary">OPTIONS_AJI_BACKEND_URL</span> 可访问。
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">暂无条目或代理/后端未配置。</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const id = String(item.item_id ?? "");
            const title = String(item.title ?? "");
            const kind = String(item.kind ?? "");
            const source = String(item.source ?? "");
            const sentiment = String(item.sentiment ?? "");
            const urgency = String(item.urgency ?? "");
            const summary = item.ai_summary_zh != null ? String(item.ai_summary_zh) : "";
            const tickers = Array.isArray(item.affected_tickers)
              ? (item.affected_tickers as string[]).filter((t) => typeof t === "string")
              : [];

            return (
              <li
                key={id}
                className="rounded-xl border border-border bg-card/60 p-5 space-y-2 hover:border-primary/25 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-foreground leading-snug pr-4">{title}</h2>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide rounded-full bg-primary/15 text-primary px-2 py-0.5">
                    {zhKind(kind)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span>来源：{source}</span>
                  <span>情绪：{zhSent(sentiment)}</span>
                  <span>优先级：{zhUrgency(urgency)}</span>
                  {tickers.length ? <span>标的：{tickers.join(", ")}</span> : null}
                </div>
                {summary ? (
                  <p className="text-sm text-foreground/85 leading-relaxed border-t border-border pt-3 mt-2">{summary}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
