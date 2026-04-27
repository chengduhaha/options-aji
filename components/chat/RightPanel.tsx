"use client";

const MARKET_DATA: Record<string, { price: number; chg: number; iv: number; ivRank: number; pcr: number }> = {
  SPY:  { price: 548.32, chg:  0.80, iv: 18.5, ivRank: 35, pcr: 0.85 },
  QQQ:  { price: 452.18, chg: -0.31, iv: 21.2, ivRank: 38, pcr: 0.88 },
  AAPL: { price: 192.45, chg:  0.12, iv: 24.5, ivRank: 55, pcr: 0.74 },
  TSLA: { price: 248.90, chg: -1.20, iv: 68.1, ivRank: 61, pcr: 0.81 },
  NVDA: { price: 138.72, chg:  1.84, iv: 58.3, ivRank: 72, pcr: 0.65 },
};

const NEWS = [
  { headline: "Trump 关税令推动 SPY Put 需求激增", sentiment: "bear", source: "@DeItaone", time: "3m" },
  { headline: "Fed Waller：还需几个月好数据才考虑降息", sentiment: "bear", source: "Bloomberg", time: "22m" },
  { headline: "NVDA 异常大单：5000 张 $140C 5/9", sentiment: "bull", source: "@unusual_whales", time: "35m" },
];

export default function RightPanel({ ticker }: { ticker: string }) {
  const data = MARKET_DATA[ticker] ?? MARKET_DATA.SPY;
  const isUp = data.chg >= 0;

  return (
    <aside className="w-[290px] flex-shrink-0 border-l border-border2 flex flex-col bg-panel2 overflow-y-auto">
      {/* Price */}
      <div className="px-4 pt-4 pb-3 border-b border-border2">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[13px] font-semibold font-mono text-text">{ticker}</span>
          <span className={`text-[11px] font-mono ${isUp ? "text-green" : "text-red"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(data.chg).toFixed(2)}%
          </span>
        </div>
        <div className="text-[26px] font-bold font-mono text-text leading-none">
          ${data.price.toFixed(2)}
        </div>

        {/* Sparkline placeholder */}
        <svg className="w-full h-12 mt-3" viewBox="0 0 200 48">
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUp ? "#00D4AA" : "#FF6B6B"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isUp ? "#00D4AA" : "#FF6B6B"} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={isUp
              ? "M0 36 L40 30 L80 20 L120 24 L160 14 L200 8"
              : "M0 12 L40 18 L80 28 L120 24 L160 34 L200 40"}
            fill="none"
            stroke={isUp ? "#00D4AA" : "#FF6B6B"}
            strokeWidth="1.5"
          />
          <path
            d={isUp
              ? "M0 36 L40 30 L80 20 L120 24 L160 14 L200 8 L200 48 L0 48Z"
              : "M0 12 L40 18 L80 28 L120 24 L160 34 L200 40 L200 48 L0 48Z"}
            fill="url(#sg)"
          />
        </svg>

        {/* IV / PCR */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "ATM IV", value: `${data.iv}%` },
            { label: "IV Rank", value: `${data.ivRank}%` },
            { label: "P/C Ratio", value: data.pcr.toFixed(2) },
          ].map((item) => (
            <div key={item.label} className="bg-bg/60 rounded-[6px] px-2 py-1.5 text-center">
              <div className="text-[9.5px] text-muted mb-0.5">{item.label}</div>
              <div className="text-[12px] font-mono font-semibold text-text">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* News */}
      <div className="flex-1 px-4 pt-3">
        <div className="text-[10px] text-muted uppercase tracking-widest mb-2">相关资讯</div>
        <div className="space-y-3">
          {NEWS.map((n, i) => (
            <div key={i} className="cursor-pointer group">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-muted">{n.source}</span>
                <span className="text-[9px] text-muted/50">{n.time} ago</span>
                <span
                  className={`ml-auto text-[9.5px] font-semibold ${
                    n.sentiment === "bull" ? "text-green" : n.sentiment === "bear" ? "text-red" : "text-muted"
                  }`}
                >
                  {n.sentiment === "bull" ? "● 看涨" : n.sentiment === "bear" ? "● 看跌" : "● 中性"}
                </span>
              </div>
              <p className="text-[12px] text-text leading-snug group-hover:text-gold transition-colors">
                {n.headline}
              </p>
            </div>
          ))}
        </div>
        <button className="mt-4 text-[11px] text-muted hover:text-gold transition-colors">
          查看全部新闻 →
        </button>
      </div>
    </aside>
  );
}
