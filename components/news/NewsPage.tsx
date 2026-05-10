"use client";

import { useCallback, useEffect, useState } from "react";
import { Newspaper, ExternalLink, Search } from "lucide-react";
import { clsx } from "clsx";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

interface Article {
  id?: number;
  symbols?: string[];
  title?: string;
  content?: string;
  url?: string;
  source?: string;
  published_at?: string;
  title_zh?: string;
  summary_zh?: string;
}

const TICKERS = ["SPY", "QQQ", "AAPL", "NVDA", "TSLA", "AMZN", "MSFT", "META", "GOOGL", "AMD"];

export default function NewsPage({ initialTicker }: { initialTicker?: string }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticker, setTicker] = useState(initialTicker ?? "");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const url = ticker
      ? `/api/news/stock?tickers=${encodeURIComponent(ticker)}&limit=30`
      : `/api/news/latest?page=${page}&limit=30`;

    try {
      const res = await fetch(url, { headers: { "X-API-Key": API_KEY }, cache: "no-store" });
      if (!res.ok) { setArticles([]); return; }
      const j = await res.json();
      setArticles(j.articles ?? []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [ticker, page]);

  useEffect(() => { void load(); }, [load]);

  const searched = search.trim()
    ? articles.filter(a => {
        const t = (a.title ?? "") + " " + (a.title_zh ?? "") + " " + (a.content ?? "");
        return t.toLowerCase().includes(search.toLowerCase());
      })
    : articles;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-5 py-4 border-b border-glass-border glass flex-shrink-0 space-y-3">
        <div className="flex items-center gap-3">
          <Newspaper className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">财经资讯</h1>
          {ticker && (
            <span className="text-[12px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              {ticker}
            </span>
          )}
          <button
            type="button"
            onClick={() => { setTicker(""); setPage(0); }}
            className="ml-auto text-[11px] text-muted hover:text-foreground"
          >
            {ticker ? "清除筛选" : ""}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Ticker filter chips */}
          {TICKERS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTicker(t === ticker ? "" : t); setPage(0); }}
              className={clsx(
                "text-[11px] font-mono px-2.5 py-1 rounded-[6px] border transition-all",
                ticker === t
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border2 text-muted hover:text-foreground hover:border-primary/30",
              )}
            >
              {t}
            </button>
          ))}
          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索新闻..."
              className="bg-glass border border-glass-border rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-foreground w-44 focus:outline-none focus:border-primary/30 placeholder:text-muted"
            />
          </div>
        </div>
      </header>

      {/* News list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {loading ? (
          <div className="text-center text-muted text-[13px] py-16">加载新闻...</div>
        ) : searched.length === 0 ? (
          <div className="text-center text-muted text-[13px] py-16">
            {ticker ? `暂无 ${ticker} 相关新闻` : "暂无新闻 — 等待数据同步或检查 API Key"}
          </div>
        ) : (
          searched.map((a) => {
            const sentiment = guessSentiment(a.title ?? "", a.title_zh ?? "");
            return (
              <a
                key={a.id ?? a.url ?? Math.random()}
                href={a.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group block glass rounded-xl p-4 card-interactive"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {a.title_zh ?? a.title}
                    </h3>
                    {a.summary_zh && (
                      <p className="text-[12px] text-muted mt-1.5 line-clamp-2 leading-relaxed">
                        {a.summary_zh}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="text-[10px] text-muted bg-glass px-2 py-0.5 rounded">
                        {a.source ?? "—"}
                      </span>
                      {a.published_at && (
                        <span className="text-[10px] text-muted">
                          {new Date(a.published_at).toLocaleString("zh-CN", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      )}
                      {sentiment && (
                        <span className={clsx(
                          "text-[10px] px-1.5 py-0.5 rounded font-medium",
                          sentiment === "bull" ? "bg-green/20 text-green" :
                          sentiment === "bear" ? "bg-red/20 text-red" : "bg-muted/20 text-muted",
                        )}>
                          {sentiment === "bull" ? "利好" : sentiment === "bear" ? "利空" : "中性"}
                        </span>
                      )}
                      <div className="flex gap-1.5">
                        {(a.symbols ?? []).slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-px rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </div>
              </a>
            );
          })
        )}

        {/* Pagination */}
        {!ticker && articles.length > 0 && (
          <div className="flex justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-[12px] px-4 py-2 rounded-lg glass border border-glass-border disabled:opacity-30 hover:text-foreground transition-all"
            >
              上一页
            </button>
            <span className="text-[12px] text-muted self-center">第 {page + 1} 页</span>
            <button
              type="button"
              onClick={() => setPage(p => p + 1)}
              disabled={articles.length < 30}
              className="text-[12px] px-4 py-2 rounded-lg glass border border-glass-border disabled:opacity-30 hover:text-foreground transition-all"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function guessSentiment(titleEn: string, titleZh: string): "bull" | "bear" | "neutral" | null {
  const t = (titleEn + " " + titleZh).toLowerCase();
  const bull = ["surge", "jump", "gain", "rally", "bullish", "upgrade", "beat", "涨", "升", "利好", "突破"];
  const bear = ["drop", "fall", "decline", "loss", "bearish", "downgrade", "miss", "跌", "降", "利空", "风险"];
  const bScore = bull.filter(w => t.includes(w)).length;
  const beScore = bear.filter(w => t.includes(w)).length;
  if (bScore > beScore) return "bull";
  if (beScore > bScore) return "bear";
  return null;
}
