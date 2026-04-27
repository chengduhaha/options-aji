"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  BarChart2,
  Zap,
  Newspaper,
  TrendingUp,
  Settings,
  Star,
} from "lucide-react";
import { clsx } from "clsx";

const NAV = [
  { id: "qa",      label: "AI 问答",      href: "/qa",      icon: MessageSquare, badge: null },
  { id: "gex",     label: "GEX Dashboard", href: "/gex",     icon: BarChart2,     badge: null },
  { id: "signals", label: "信号中心",      href: "/signals", icon: Zap,           badge: "6"  },
  { id: "news",    label: "新闻流",        href: "/news",    icon: Newspaper,     badge: null },
  { id: "strategy",label: "策略评估",      href: "/strategy",icon: TrendingUp,    badge: null },
  { id: "settings",label: "设置",          href: "/settings",icon: Settings,      badge: null },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 bg-panel2 border-r border-border2 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-[18px] border-b border-border2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-[#a8832a] flex items-center justify-center text-[13px] font-bold text-bg flex-shrink-0">
          OA
        </div>
        <div>
          <div className="text-[15px] font-semibold text-text">OptionsAji</div>
          <div className="text-[10px] text-muted">期权阿吉</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2.5 overflow-y-auto space-y-0.5">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13.5px] border transition-all",
                active
                  ? "bg-gold-dim border-border text-gold"
                  : "border-transparent text-muted hover:bg-white/[0.04] hover:text-text"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-gold text-bg text-[10px] font-bold px-1.5 py-px rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge */}
      <div className="px-3.5 py-2.5 border-t border-border2">
        <div className="inline-flex items-center gap-1.5 bg-gold-dim border border-border px-2 py-1 rounded-[5px] text-[11px] font-semibold text-gold mb-1">
          <Star className="w-2.5 h-2.5 fill-gold" />
          Pro Plan
        </div>
        <div className="text-[10px] text-muted">今日问答：12 / ∞ 次</div>
      </div>

      {/* User */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-t border-border2">
        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#2a4a6a] to-[#1a3a5a] border border-border flex items-center justify-center text-[12px] font-semibold text-gold flex-shrink-0">
          张
        </div>
        <div>
          <div className="text-[12.5px] font-medium text-text">张小明</div>
          <div className="text-[10px] text-gold">Pro · 活跃至 12/31</div>
        </div>
      </div>
    </aside>
  );
}
