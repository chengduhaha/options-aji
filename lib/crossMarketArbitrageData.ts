export type SignalLevel = 'EXTREME' | 'STRONG' | 'MODERATE' | 'LOW'
export type LiquidityLevel = 'good' | 'thin'

export interface ProbabilitySource {
  label: string
  value: number
}

export interface ArbitrageOpportunity {
  id: string
  rank: number
  title: string
  titleEn: string
  sources: ProbabilitySource[]
  disagreementScore: number
  signalLevel: SignalLevel
  action: string
  ev: number
  liquidity: LiquidityLevel
  tags: string[]
  relatedAssets?: string[]
  aiNarrative: string
}

/** Static ontology-style patterns for scanner sidebar when API returns no rows. */
export const patterns = [
  {
    id: 'kol-watch',
    color: 'red',
    type: 'Reactive Pattern',
    name: 'KOL Tweet Watch',
    desc: '监听: Trump, Elon, Cathie Wood',
    status: 'active',
    statusLabel: '实时运行',
  },
  {
    id: 'geo-cascade',
    color: 'yellow',
    type: 'Investigative Pattern',
    name: 'Geopolitical Cascade',
    desc: '地缘政治连锁效应分析',
    status: 'triggered',
    statusLabel: '23 分钟前触发',
  },
  {
    id: 'earnings-iv',
    color: 'green',
    type: 'Crossover Pattern',
    name: 'Earnings IV vs Polymarket',
    desc: '正在扫描市场中的定价分化',
    status: 'scanning',
    statusLabel: '扫描中',
  },
  {
    id: 'fed-crosscheck',
    color: 'green',
    type: 'Crossover Pattern',
    name: 'Fed Decision Cross-Check',
    desc: '正在扫描宏观事件',
    status: 'scanning',
    statusLabel: '扫描中',
  },
  {
    id: 'insider-retail',
    color: 'green',
    type: 'Crossover Pattern',
    name: 'Insider vs Retail Sentiment',
    desc: '正在扫描跨源情绪',
    status: 'scanning',
    statusLabel: '扫描中',
  },
]
