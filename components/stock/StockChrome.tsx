"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { clsx } from "clsx";

const HOT = ["SPY", "QQQ", "AAPL", "TSLA", "NVDA", "AMZN", "MSFT", "META"];

const TABS: { segment: string; label: string }[] = [
  { segment: "", label: "概览" },
  { segment: "chain", label: "期权链" },
  { segment: "volatility", label: "波动率" },
  { segment: "unusual", label: "异动" },
  { segment: "gex", label: "GEX" },
  { segment: "strategy", label: "策略" },
  { segment: "earnings", label: "财报" },
];

export default function StockChrome({ symbol }: { symbol: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const sym = q.trim().toUpperCase();
    if (!sym) return;
    const tail = pathname.replace(/^\/stock\/[^/]+/, "");
    router.push(`/stock/${sym}${tail}`);
  };

  return (
    <div className="border-b border-border2 bg-panel2 flex-shrink-0">
      <div className="px-5 py-3 space-y-3">
        <form onSubmit={submit} className="flex flex-wrap gap-2 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="输入标的代码"
            className="bg-panel border border-border2 rounded-[8px] px-3 py-1.5 text-[13px] text-text w-40 focus:outline-none focus:border-border font-mono"
          />
          <button
            type="submit"
            className="text-[12px] bg-gold text-bg font-semibold px-3 py-1.5 rounded-[8px] hover:opacity-90"
          >
            跳转
          </button>
          <div className="flex flex-wrap gap-1 ml-2">
            {HOT.map((h) => (
              <Link
                key={h}
                href={`/stock/${h}`}
                className={clsx(
                  "text-[11px] font-mono px-2 py-0.5 rounded-[6px] border border-border2",
                  h === symbol ? "text-gold border-border" : "text-muted hover:text-text",
                )}
              >
                {h}
              </Link>
            ))}
          </div>
        </form>
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => {
            const href = t.segment ? `/stock/${symbol}/${t.segment}` : `/stock/${symbol}`;
            const lit = pathname === href;
            return (
              <Link
                key={t.segment || "overview"}
                href={href}
                className={clsx(
                  "text-[12px] px-2.5 py-1 rounded-[6px] border",
                  lit
                    ? "border-gold text-gold bg-gold-dim"
                    : "border-border2 text-muted hover:text-text hover:border-border",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
