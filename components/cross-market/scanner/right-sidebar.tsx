'use client'

import { cn } from '@/lib/utils'
import { HelpCircle } from 'lucide-react'
import type { ArbitrageOpportunity } from '@/lib/crossMarket'
import { patterns as defaultPatterns } from '@/lib/crossMarket'

const STATUS_DOT: Record<string, string> = {
  red: 'bg-destructive',
  yellow: 'bg-yellow-500',
  green: 'bg-signal-green',
}

const STATUS_TEXT: Record<string, string> = {
  active: 'text-destructive',
  triggered: 'text-yellow-500',
  scanning: 'text-signal-green',
}

type PatternItem = (typeof defaultPatterns)[number]

function opportunitiesToPatterns(opps: ArbitrageOpportunity[]): PatternItem[] {
  return opps.slice(0, 5).map((o, i) => ({
    id: o.id,
    color: o.signalLevel === 'EXTREME' ? 'red' : o.signalLevel === 'STRONG' ? 'yellow' : 'green',
    type: 'Live Signal',
    name: o.title.slice(0, 48) + (o.title.length > 48 ? '…' : ''),
    desc: `背离 ${o.disagreementScore} · ${o.signalLevel}`,
    status: i === 0 ? 'active' : 'scanning',
    statusLabel: i === 0 ? '本轮扫描置顶' : '跟踪中',
  }))
}

export function RightSidebar({ opportunities }: { opportunities: ArbitrageOpportunity[] }) {
  const displayPatterns =
    opportunities.length > 0 ? opportunitiesToPatterns(opportunities) : defaultPatterns

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
      <div className="bg-card border border-border rounded-lg p-4 sticky top-[120px]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          当前活跃 Pattern
        </h2>

        <div className="space-y-2">
          {displayPatterns.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-2.5 p-2.5 rounded-md bg-secondary/30 border border-border/50 hover:border-border transition-colors"
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0 mt-1',
                  STATUS_DOT[p.color]
                )}
              />
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {p.type}
                </div>
                <div className="text-xs font-semibold text-foreground leading-snug mt-0.5">
                  {p.name}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</div>
                <div className={cn('text-[10px] font-mono mt-1', STATUS_TEXT[p.status])}>
                  ● {p.statusLabel}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
            <h3 className="text-xs font-semibold text-foreground">什么是「背离度」?</h3>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            当 4 个市场对同一事件的概率估计差距越大，意味着至少一方在错误定价。
            <span className="text-primary font-semibold"> 背离度 {'>'} 25</span> 通常代表强烈的套利机会。
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">信号强度</p>
          <div className="space-y-1.5">
            {[
              { label: '极强 (背离 >25)', color: 'bg-destructive', text: 'text-destructive' },
              { label: '强 (背离 15-25)', color: 'bg-primary', text: 'text-primary' },
              { label: '中 (背离 8-15)', color: 'bg-blue-500', text: 'text-blue-400' },
              { label: '弱 (背离 <8)', color: 'bg-muted-foreground', text: 'text-muted-foreground' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full shrink-0', item.color)} />
                <span className={cn('text-[11px]', item.text)}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
