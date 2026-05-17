import type { ProbabilitySource } from '@/lib/crossMarket'

const SOURCE_COLORS = [
  'bg-blue-500',
  'bg-primary',
  'bg-purple-500',
  'bg-emerald-500',
]

interface ProbabilityBarsProps {
  sources: ProbabilitySource[]
  compact?: boolean
}

export function ProbabilityBars({ sources, compact = true }: ProbabilityBarsProps) {
  if (compact) {
    return (
      <div className="flex flex-col gap-1 min-w-[100px]">
        {sources.map((source, i) => (
          <div key={source.label} className="flex items-center gap-1.5">
            <div className="w-[60px] h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full ${SOURCE_COLORS[i % SOURCE_COLORS.length]} transition-all`}
                style={{ width: `${source.value}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">
              {source.value}%
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {sources.map((source, i) => (
        <div key={source.label} className="bg-secondary/40 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground">{source.label}</span>
            <span className={`text-sm font-bold font-mono ${SOURCE_COLORS[i % SOURCE_COLORS.length].replace('bg-', 'text-')}`}>
              {source.value}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full ${SOURCE_COLORS[i % SOURCE_COLORS.length]} transition-all duration-700`}
              style={{ width: `${source.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
