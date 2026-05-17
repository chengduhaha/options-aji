import type { LucideIcon } from "lucide-react";
import { TrendingUp, Zap, AlertTriangle, BarChart2 } from "lucide-react";
import type { ScannerStat } from "@/lib/crossMarket";

const ICONS: Record<ScannerStat["icon"], LucideIcon> = {
  bar: BarChart2,
  zap: Zap,
  alert: AlertTriangle,
  trend: TrendingUp,
};

export function StatsBar({ stats }: { stats: ScannerStat[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 py-3">
      {stats.map((stat) => {
        const Icon = ICONS[stat.icon];
        return (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3"
          >
            <div className={`p-2 rounded-md bg-secondary/60 ${stat.iconColor}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-0.5">
                <span className={`text-2xl font-bold font-mono tracking-tight ${stat.color}`}>
                  {stat.value}
                </span>
                <span className={`text-sm font-semibold ${stat.color}`}>{stat.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              {stat.sub ? (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
