"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LineChart,
  ScanLine,
  RadioTower,
  Settings,
  Sparkles,
  Star,
} from "lucide-react";
import { clsx } from "clsx";

const NAV = [
  { id: "dash", label: "市场总览", href: "/", icon: LayoutDashboard },
  { id: "stock", label: "个股深度", href: "/stock/SPY", icon: LineChart },
  { id: "scanner", label: "期权扫描器", href: "/scanner", icon: ScanLine },
  { id: "feed", label: "信息流", href: "/feed", icon: RadioTower },
  { id: "ai", label: "AI 分析师", href: "/ai", icon: Sparkles },
  { id: "learn", label: "期权学院", href: "/learn", icon: BookOpen },
  { id: "settings", label: "设置", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 bg-panel2 border-r border-border2 h-screen">
      <div className="flex items-center gap-2.5 px-4 py-[18px] border-b border-border2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-[#a8832a] flex items-center justify-center text-[13px] font-bold text-bg flex-shrink-0">
          OA
        </div>
        <div>
          <div className="text-[15px] font-semibold text-text">OptionsAji</div>
          <div className="text-[10px] text-muted">期权阿吉 2.0</div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-2.5 overflow-y-auto space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === "dash"
              ? pathname === "/"
              : item.id === "stock"
                ? pathname.startsWith("/stock")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13.5px] border transition-all",
                isActive
                  ? "bg-gold-dim border-border text-gold"
                  : "border-transparent text-muted hover:bg-white/[0.04] hover:text-text",
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3.5 py-2.5 border-t border-border2">
        <Link
          href="/landing"
          className="inline-flex items-center gap-1.5 bg-gold-dim border border-border px-2 py-1 rounded-[5px] text-[11px] font-semibold text-gold mb-1 hover:opacity-90"
        >
          <BarChart3 className="w-2.5 h-2.5" />
          产品介绍
        </Link>
        <div className="inline-flex items-center gap-1.5 bg-gold-dim border border-border px-2 py-1 rounded-[5px] text-[11px] font-semibold text-gold mb-1">
          <Star className="w-2.5 h-2.5 fill-gold" />
          Pro Plan
        </div>
        <div className="text-[10px] text-muted">订阅与用量详见设置</div>
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-t border-border2">
        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#2a4a6a] to-[#1a3a5a] border border-border flex items-center justify-center text-[12px] font-semibold text-gold flex-shrink-0">
          访客
        </div>
        <div>
          <div className="text-[12.5px] font-medium text-text">演示用户</div>
          <div className="text-[10px] text-gold">登录 / 注册（即将上线）</div>
        </div>
      </div>
    </aside>
  );
}
