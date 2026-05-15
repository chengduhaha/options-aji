"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  Eye,
  LayoutDashboard,
  LineChart,
  RadioTower,
  ScanLine,
  Settings,
  Sparkles,
  Star,
  User,
  Zap,
  Activity,
  BarChart3,
  Shield,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { id: "dash", label: "市场总览", href: "/", icon: LayoutDashboard },
      { id: "scanner", label: "期权扫描器", href: "/scanner", icon: ScanLine },
      { id: "stock", label: "个股深度", href: "/stock/SPY", icon: LineChart },
      { id: "feed", label: "统一信息流", href: "/feed", icon: RadioTower },
      { id: "ai", label: "AI 分析师", href: "/ai", icon: Sparkles, badge: "AI" },
      { id: "learn", label: "期权学院", href: "/learn", icon: BookOpen },
      { id: "settings", label: "设置", href: "/settings", icon: Settings },
    ],
  },
  {
    label: "另类数据",
    items: [
      { id: "divergence", label: "散户背离扫描", href: "/scanner/divergence", icon: AlertTriangle, badge: "NEW" },
      { id: "darkpool", label: "暗池雷达", href: "/dark-pool", icon: Eye },
      { id: "congress", label: "国会山追踪", href: "/congress", icon: Building2, badge: "HOT" },
    ],
  },
];

function NavItem({
  item,
  pathname,
}: {
  item: typeof NAV_GROUPS[0]["items"][0] & { badge?: string };
  pathname: string;
}) {
  const Icon = item.icon;
  const isActive =
    item.id === "dash"
      ? pathname === "/"
      : item.id === "stock"
        ? pathname.startsWith("/stock")
        : item.id === "scanner"
          ? pathname === "/scanner"
          : item.id === "profile"
            ? pathname === "/profile" || pathname.startsWith("/profile/")
            : item.id === "admin_users"
            ? pathname.startsWith("/admin")
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={clsx(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5"
          : "text-muted-foreground hover:bg-glass hover:text-foreground border border-transparent hover:border-glass-border",
      )}
    >
      <div className={clsx(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
        isActive
          ? "bg-primary/20 text-primary"
          : "bg-glass text-muted-foreground group-hover:text-foreground group-hover:bg-glass"
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className={clsx(
          "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
          item.badge === "AI" && "bg-accent/20 text-accent",
          item.badge === "HOT" && "bg-red/20 text-red",
          item.badge === "NEW" && "bg-green/20 text-green",
        )}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [logoutBusy, setLogoutBusy] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  async function handleLogout() {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      await logout();
      router.push("/login");
    } finally {
      setLogoutBusy(false);
    }
  }

  return (
    <aside className="flex flex-col w-64 glass border-r border-glass-border h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-glass-border">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[14px] font-bold text-primary-foreground shadow-lg shadow-primary/20">
            OA
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green rounded-full border-2 border-background animate-pulse" />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-foreground flex items-center gap-2">
            OptionsAji
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-[11px] text-muted flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-green" />
            <span>市场开放中</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {NAV_GROUPS.map((group, gi) => {
          const key = group.label || "root";
          const isOpen = collapsed[key] !== false;
          return (
            <div key={gi} className="mb-2">
              {group.label && (
                <button
                  onClick={() => setCollapsed(c => ({ ...c, [key]: !isOpen }))}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[10px] font-semibold text-muted uppercase tracking-widest hover:text-muted-foreground transition-colors"
                >
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {group.label}
                </button>
              )}
              {isOpen && (
                <div className="space-y-1 mt-1">
                  {group.items.map((item) => (
                    <NavItem key={item.id} item={item} pathname={pathname} />
                  ))}
                  {group.label === null && user ? (
                    <NavItem
                      item={{
                        id: "profile",
                        label: "个人中心",
                        href: "/profile",
                        icon: User,
                      }}
                      pathname={pathname}
                    />
                  ) : null}
                  {group.label === null && isAdmin ? (
                    <NavItem
                      item={{
                        id: "admin_users",
                        label: "用户管理",
                        href: "/admin/users",
                        icon: Shield,
                      }}
                      pathname={pathname}
                    />
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-glass-border">
        {user ? (
          <div className="mb-3 px-1">
            <div className="text-[10px] text-muted uppercase tracking-wide">已登录</div>
            <div className="text-[11px] font-mono text-foreground truncate" title={user.email}>
              {user.email}
            </div>
            <div className="text-[10px] text-muted">角色 · {user.role}</div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutBusy}
              className="mt-2 text-[11px] text-primary hover:underline disabled:opacity-60"
            >
              {logoutBusy ? "退出中…" : "退出登录"}
            </button>
          </div>
        ) : (
          <div className="mb-3 px-1 text-[11px] text-muted">
            <div className="mb-2">未登录</div>
            <div className="flex gap-2">
              <Link href="/login" className="text-primary hover:underline">
                登录
              </Link>
              <span>·</span>
              <Link href="/register" className="text-primary hover:underline">
                注册
              </Link>
            </div>
          </div>
        )}
        {/* Pro Badge */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Star className="w-4 h-4 fill-primary text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-semibold text-foreground">Pro 会员</div>
            <div className="text-[10px] text-muted">全功能访问</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link
            href="/landing"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-glass border border-glass-border text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            <BarChart3 className="w-3 h-3" />
            产品介绍
          </Link>
          <Link
            href="/ai"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 border border-primary/20 text-[11px] text-primary font-medium hover:bg-primary/20 transition-all"
          >
            <Sparkles className="w-3 h-3" />
            AI 分析
          </Link>
        </div>
      </div>
    </aside>
  );
}
