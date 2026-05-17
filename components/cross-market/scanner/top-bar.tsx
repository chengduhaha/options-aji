'use client'

import { useState, useEffect } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const FILTER_CHIPS = [
  { id: 'all', label: '全部' },
  { id: 'equity', label: '单股事件' },
  { id: 'macro', label: '宏观事件' },
  { id: 'geo', label: '地缘事件' },
  { id: 'earnings', label: '财报' },
  { id: 'product', label: '产品发布' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'sports', label: 'Sports' },
]

interface TopBarProps {
  activeFilter: string
  onFilterChange: (id: string) => void
}

export function TopBar({ activeFilter, onFilterChange }: TopBarProps) {
  const [seconds, setSeconds] = useState(2)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s >= 9 ? 1 : s + 1))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="px-4 py-3 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              今日跨市场背离机会
            </h1>
            <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-signal-green/10 text-signal-green border border-signal-green/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse" />
              实时 · {seconds} 秒前刷新
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI 在 4 个市场实时扫描概率定价错误，以下是按机会强度排序的 TOP 信号
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground font-mono">OptionsAji Pro</span>
          <button
            aria-label="刷新数据"
            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-4 pb-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.id}
            onClick={() => onFilterChange(chip.id)}
            className={cn(
              'shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-all border',
              activeFilter === chip.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:bg-secondary hover:border-border/80'
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  )
}
