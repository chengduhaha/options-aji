'use client'

import { useState } from 'react'
import { TopBar } from './top-bar'
import { StatsBar } from './stats-bar'
import { OpportunityRow } from './opportunity-row'
import { RightSidebar } from './right-sidebar'
import type { ArbitrageOpportunity } from '@/lib/crossMarket'
import { computeScannerStats, type ScannerStat } from '@/lib/crossMarket'

const TAG_FILTER_MAP: Record<string, string[]> = {
  all: [],
  equity: ['单股'],
  macro: ['宏观'],
  geo: ['地缘'],
  earnings: ['财报'],
  product: ['产品发布'],
  crypto: ['Crypto'],
  sports: ['Sports'],
}

export function ScannerPage({
  opportunities,
  stats,
}: {
  opportunities: ArbitrageOpportunity[]
  stats?: ScannerStat[]
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const barStats = stats ?? computeScannerStats(opportunities)

  const filtered =
    activeFilter === 'all'
      ? opportunities
      : opportunities.filter((o) =>
          TAG_FILTER_MAP[activeFilter]?.some((tag) => o.tags.includes(tag))
        )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TopBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <StatsBar stats={barStats} />

      <div className="flex flex-1 gap-4 px-4 pb-6 max-w-[1600px] w-full mx-auto">
        <main className="flex-1 min-w-0 space-y-2.5">
          <div className="hidden lg:grid grid-cols-[32px_1fr_200px_100px_90px] gap-3 px-3 py-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider border-b border-border">
            <span>#</span>
            <span>事件 / 叙事</span>
            <span>四源概率</span>
            <span className="text-right">背离度</span>
            <span className="text-center">操作</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center border border-dashed border-border rounded-lg">
              暂无符合筛选条件的机会，或后端未返回足够背离信号。
            </div>
          ) : (
            filtered.map((opportunity) => (
              <OpportunityRow
                key={opportunity.id}
                opportunity={opportunity}
                isTopThree={opportunity.rank <= 3}
              />
            ))
          )}
        </main>

        <RightSidebar opportunities={opportunities} />
      </div>
    </div>
  )
}
