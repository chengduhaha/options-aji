"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, BookOpen, Building2, ChevronDown, ChevronRight,
  LayoutDashboard, LineChart, Landmark, ListFilter, Newspaper,
  RadioTower, ScanLine, Settings, Sparkles, Star, TrendingUp,
  Wallet, Globe, Layers,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { id: "dash", label: "市场总览", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "期权",
    items: [
      { id: "chain", label: "期权链", href: "/options/chain", icon: Layers },
      { id: "scanner", label: "期权扫描器", href: "/scanner", icon: ScanLine },
      { id: "unusual", label: "异常活动", href: "/options/unusual", icon: TrendingUp },
      { id: "gex", label: "GEX 分析", href: "/gex", icon: BarChart3 },
    ],
  },
  {
    label: "股票研究",
    items: [
      { id: "stock", label: "个股深度", href: "/stock/SPY", icon: LineChart },
      { id: "earnings", label: "财报日历", href: "/earnings", icon: ListFilter },
    ],
  },
  {
    label: "市场情报",
    items: [
      { id: "macro", label: "宏观经济", href: "/macro", icon: Globe },
      { id: "indices", label: "指数行情", href: "/indices", icon: TrendingUp },
      { id: "news", label: "新闻", href: "/news", icon: Newspaper },
    ],
  },
  {
    label: "机构追踪",
    items: [
      { id: "congress", label: "国会交易", href: "/congress", icon: Landmark },
      { id: "insider", label: "内部人交易", href: "/insider", icon: Building2 },
    ],
  },
  {
    label: "其他",
    items: [
      { id: "etf", label: "ETF 分析", href: "/etf", icon: Wallet },
      { id: "feed", label: "信息流", href: "/feed", icon: RadioTower },
      { id: "ai", label: "AI 助手", href: "/ai", icon: Sparkles },
      { id: "learn", label: "期权学院", href: "/learn", icon: BookOpen },
      { id: "settings", label: "设置", href: "/settings", icon: Settings },
    ],
  },
];

function NavItem({ item, pathname }: { item: typeof NAV_GROUPS[0]["items"][0]; pathname: string }) {
  const Icon = item.icon;
  const isActive =
    item.id === "dash"
      ? pathname === "/"
      : item.id === "stock"
        ? pathname.startsWith("/stock")
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      className={clsx(
        "flex items-center gap-2.5 px-2.5 py-[7px] rounded-[7px] text-[13px] border transition-all",
        isActive
          ? "bg-gold-dim border-border text-gold"
          : "border-transparent text-muted hover:bg-white/[0.04] hover:text-text",
      )}
    >
      <Icon className="w-[15px] h-[15px] flex-shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <aside className="flex flex-col w-56 bg-panel2 border-r border-border2 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-[16px] border-b border-border2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold to-[#a8832a] flex items-center justify-center text-[12px] font-bold text-bg flex-shrink-0">
          OA
        </div>
        <div>
          <div className="text-[14px] font-semibold text-text">OptionsAji</div>
          <div className="text-[10px] text-muted">期权阿吉 v2</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => {
          const key = group.label || "root";
          const isOpen = collapsed[key] !== false;
          return (
            <div key={gi} className="mb-1">
              {group.label && (
                <button
                  onClick={() => setCollapsed(c => ({ ...c, [key]: !isOpen }))}
                  className="flex items-center gap-1 w-full px-2 py-1.5 text-[10px] font-semibold text-muted/60 uppercase tracking-wider hover:text-muted transition-colors"
                >
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {group.label}
                </button>
              )}
              {isOpen && (
                <div className="space-y-0.5">
                  {group.items.map(item => (
                    <NavItem key={item.id} item={item} pathname={pathname} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-border2">
        <div className="flex gap-1.5 mb-1.5">
          <Link
            href="/landing"
            className="inline-flex items-center gap-1 bg-gold-dim border border-border px-2 py-1 rounded-[5px] text-[10px] font-semibold text-gold hover:opacity-90"
          >
            <BarChart3 className="w-2.5 h-2.5" />
            产品介绍
          </Link>
          <div className="inline-flex items-center gap-1 bg-gold-dim border border-border px-2 py-1 rounded-[5px] text-[10px] font-semibold text-gold">
            <Star className="w-2.5 h-2.5 fill-gold" />
            Pro
          </div>
        </div>
        <div className="text-[10px] text-muted">订阅与用量详见设置</div>
      </div>
    </aside>
  );
}
