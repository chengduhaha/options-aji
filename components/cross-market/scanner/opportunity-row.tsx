'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Bell, ExternalLink, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ArbitrageOpportunity } from '@/lib/crossMarket'
import { ProbabilityBars } from './probability-bars'

function SignalBadge({ level }: { level: ArbitrageOpportunity['signalLevel'] }) {
  const config = {
    EXTREME: { label: '极强', className: 'bg-destructive/15 text-destructive border-destructive/30 animate-pulse' },
    STRONG: { label: '强', className: 'bg-primary/15 text-primary border-primary/30' },
    MODERATE: { label: '中', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    LOW: { label: '弱', className: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20' },
  }
  const { label, className } = config[level]
  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold border', className)}>
      {label}
    </span>
  )
}

function DisagreementScore({ score, level }: { score: number; level: ArbitrageOpportunity['signalLevel'] }) {
  const colorClass =
    level === 'EXTREME'
      ? 'text-destructive'
      : level === 'STRONG'
      ? 'text-primary'
      : level === 'MODERATE'
      ? 'text-blue-400'
      : 'text-muted-foreground'
  return (
    <div className="text-center min-w-[52px]">
      <div className={cn('text-2xl font-bold font-mono leading-none', colorClass,
        level === 'EXTREME' && 'drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]'
      )}>
        {score.toFixed(1)}
      </div>
      <div className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider">背离度</div>
    </div>
  )
}

function ActionChip({ action }: { action: string }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary border border-border text-[11px] font-mono text-foreground/80 leading-snug">
      {action}
    </span>
  )
}

interface OpportunityRowProps {
  opportunity: ArbitrageOpportunity
  isTopThree: boolean
}

export function OpportunityRow({ opportunity, isTopThree }: OpportunityRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [alerted, setAlerted] = useState(false)

  const rankColor =
    opportunity.rank <= 3
      ? 'text-primary'
      : opportunity.rank <= 5
      ? 'text-foreground'
      : 'text-muted-foreground'

  return (
    <div
      className={cn(
        'group border rounded-lg transition-all duration-200',
        isTopThree
          ? 'border-primary/30 bg-card hover:border-primary/50 animate-gold-pulse'
          : 'border-border bg-card hover:border-border/60',
        opportunity.signalLevel === 'EXTREME' && 'border-destructive/30 hover:border-destructive/50',
        expanded && 'border-primary/40'
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Rank */}
        <div className={cn('text-2xl font-black font-mono w-8 text-center shrink-0', rankColor)}>
          #{opportunity.rank}
        </div>

        {/* Signal + Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <SignalBadge level={opportunity.signalLevel} />
            {opportunity.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/60 text-muted-foreground border border-border/50"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
            {opportunity.title}
          </h3>
          {opportunity.relatedAssets && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              影响: {opportunity.relatedAssets.join(' · ')}
            </p>
          )}
        </div>

        {/* Probability bars */}
        <div className="hidden md:block shrink-0">
          <ProbabilityBars sources={opportunity.sources} compact />
        </div>

        {/* Disagreement score */}
        <div className="shrink-0">
          <DisagreementScore score={opportunity.disagreementScore} level={opportunity.signalLevel} />
        </div>

        {/* Action */}
        <div className="hidden lg:flex shrink-0 max-w-[200px]">
          <ActionChip action={opportunity.action} />
        </div>

        {/* EV */}
        <div className="shrink-0 text-center min-w-[52px]">
          <div className="text-lg font-bold font-mono text-signal-green leading-none">
            +{opportunity.ev}%
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider">预期 EV</div>
        </div>

        {/* Liquidity */}
        <div className="shrink-0 hidden sm:block">
          {opportunity.liquidity === 'good' ? (
            <div className="flex items-center gap-1 text-signal-green text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>充裕</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-yellow-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>偏薄</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            aria-label="订阅提醒"
            onClick={() => setAlerted(!alerted)}
            className={cn(
              'p-1.5 rounded-md transition-colors border text-xs',
              alerted
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-transparent text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
            )}
            title="订阅提醒"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button
            aria-label={expanded ? '收起' : '展开'}
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-md transition-colors border border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Section */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Mobile action chip */}
          <div className="lg:hidden">
            <ActionChip action={opportunity.action} />
          </div>

          {/* Probability detail */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">市场概率详情</p>
            <ProbabilityBars sources={opportunity.sources} compact={false} />
          </div>

          {/* AI Narrative */}
          <div className="bg-secondary/30 border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">AI 背离分析</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{opportunity.aiNarrative}</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-secondary border border-border text-sm text-foreground hover:bg-secondary/80 hover:border-primary/40 transition-colors">
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              查看完整事件分析
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              立即让 AI 制定操作策略
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
