import type { HotEvent, BackendArbitrageOpportunity } from "./crossMarketApi";
import type {
  ArbitrageOpportunity as UiArbitrageOpportunity,
  SignalLevel,
} from "./crossMarketArbitrageData";

// --- View-model adapters (v0 UI shape) ---

/** A row in the probability time-series chart (percent 0–100). */
export type TimeSeriesRow = {
  date: string;
  options: number;
  polymarket: number;
  social: number;
  institutional: number;
};

export type StrategyLegRow = {
  leg: string;
  market: string;
  marketColor: string;
  action: string;
  actionColor: string;
  instrument: string;
  position: string;
  maxPL: string;
  plColor: string;
  risk: string;
};

export type ProbabilityPanoramaSource = {
  label: string;
  labelEn: string;
  probability: number;
  color: string;
  bgColor: string;
  borderColor: string;
  subLabel: string;
  detail: string;
  tooltip: string;
  rank: number;
};

export interface EventPanoramaViewModel {
  eventId: string;
  header: {
    badgeLabel: string;
    titleText: string;
    metaTicker?: string;
    eventTimeDisplay: string;
    settlementNote: string;
    countdownPrimary: string;
    countdownSub: string;
    showArbitragePill: boolean;
  };
  panorama: {
    sources: ProbabilityPanoramaSource[];
    aiConsensusPercent: number;
    disagreementPp: number;
    arbitrationHeadline: string;
    arbitrationDetail: string;
    arbitrationStrengthLabel: string;
  };
  narrative: {
    optionsPct: number;
    polymarketPct: number;
    socialPct: number;
    institutionalPct: number;
    estimatedLow: number;
    estimatedHigh: number;
    polyGapLow: number;
    polyGapHigh: number;
    histRallyPct: number;
    histDropPct: number;
    histChopPct: number;
    judgmentHint: string;
    strategyBullets: { num: string; color: string; label: string; desc: string }[];
  };
  timeSeries: TimeSeriesRow[];
  strategyLegs: StrategyLegRow[];
  strategySummary: {
    tagline: string;
    maxProfit: string;
    maxRisk: string;
    evAnnual: string;
  };
}

function pct01(x: number): number {
  return Math.round(Math.max(0, Math.min(1, x)) * 100);
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 1000;
}

/** Deterministic synthetic 14-point series ending at current probabilities (percent). */
export function buildSyntheticTimeSeries(
  eventId: string,
  end: { options: number; polymarket: number; social: number; institutional: number },
): TimeSeriesRow[] {
  const seed = hashSeed(eventId);
  const n = 14;
  const days: string[] = [];
  const start = new Date();
  start.setDate(start.getDate() - (n - 1));
  for (let i = 0; i < n; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(
      `${d.getMonth() + 1}月${d.getDate()}日`,
    );
  }

  const targets = {
    options: pct01(end.options),
    polymarket: pct01(end.polymarket),
    social: pct01(end.social),
    institutional: pct01(end.institutional),
  };

  const ease = (t: number) => t * t * (3 - 2 * t);
  const noise = (i: number, k: keyof typeof targets) => {
    const u = ((seed + i * 17 + k.length * 31) % 17) - 8;
    return u * 0.35;
  };

  return days.map((date, i) => {
    const t = ease(i / (n - 1));
    const mix = (endVal: number, startVal: number) =>
      Math.max(0, Math.min(100, Math.round(startVal + (endVal - startVal) * t + noise(i, "options"))));

    const startBias = {
      options: targets.options + ((seed % 11) - 5),
      polymarket: targets.polymarket + (((seed * 2) % 9) - 4),
      social: targets.social + (((seed * 3) % 13) - 6),
      institutional: targets.institutional + (((seed * 5) % 11) - 5),
    };

    return {
      date,
      options: mix(targets.options, startBias.options),
      polymarket: mix(targets.polymarket, startBias.polymarket),
      social: mix(targets.social, startBias.social),
      institutional: mix(targets.institutional, startBias.institutional),
    };
  }).map((row, i) =>
    i === n - 1
      ? {
          date: row.date,
          options: targets.options,
          polymarket: targets.polymarket,
          social: targets.social,
          institutional: targets.institutional,
        }
      : row,
  );
}

const SOURCE_META: Record<
  string,
  { label: string; labelEn: string; color: string; bgColor: string; borderColor: string; rank: number }
> = {
  options: {
    label: "期权市场",
    labelEn: "Options Market",
    color: "#4A8FD4",
    bgColor: "linear-gradient(135deg, #131E35 0%, #162035 100%)",
    borderColor: "#4A8FD430",
    rank: 1,
  },
  polymarket: {
    label: "预测市场",
    labelEn: "Polymarket",
    color: "#D4AF37",
    bgColor: "linear-gradient(135deg, #1A1A0A 0%, #1E1E0E 100%)",
    borderColor: "#D4AF3740",
    rank: 2,
  },
  social: {
    label: "社交情绪",
    labelEn: "Social Sentiment",
    color: "#E8842A",
    bgColor: "linear-gradient(135deg, #1A1208 0%, #1E160A 100%)",
    borderColor: "#E8842A40",
    rank: 3,
  },
  institutional: {
    label: "机构信号",
    labelEn: "Institutional",
    color: "#D44A4A",
    bgColor: "linear-gradient(135deg, #1A0F0F 0%, #1E1212 100%)",
    borderColor: "#D44A4A40",
    rank: 4,
  },
};

function directionLabel(arb: string): { headline: string; detail: string; strength: string } {
  const map: Record<string, { headline: string; detail: string }> = {
    options_overpriced: { headline: "STRONG", detail: "期权隐含概率相对偏高 · 关注预测市场对冲" },
    options_underpriced: { headline: "STRONG", detail: "期权隐含概率相对偏低 · 关注期权定价修复" },
    polymarket_overpriced: { headline: "STRONG", detail: "Polymarket 溢价 · 可关注 NO / 期权对冲" },
    polymarket_underpriced: { headline: "MODERATE", detail: "Polymarket 折价 · 可关注 YES 与现货/期权联动" },
    social_overpriced: { headline: "STRONG", detail: "社交情绪过热 · 与期权/机构定价背离" },
    social_underpriced: { headline: "MODERATE", detail: "社交情绪偏冷 · 关注事件催化" },
    institutional_overpriced: { headline: "MODERATE", detail: "机构隐含偏高 · 与散户情绪比对" },
    institutional_underpriced: { headline: "MODERATE", detail: "机构隐含偏低 · 聪明钱更谨慎" },
  };
  const m = map[arb] ?? {
    headline: "ACTIVE",
    detail: "跨源概率存在偏离 · 详见四源全景",
  };
  return { headline: m.headline, detail: m.detail, strength: m.headline };
}

export function adaptHotEventToPanorama(event: HotEvent): EventPanoramaViewModel {
  const p = event.probabilities;
  const o = pct01(p.options);
  const poly = pct01(p.polymarket);
  const s = pct01(p.social);
  const ins = pct01(p.institutional);
  const probs = [o, poly, s, ins];
  const maxP = Math.max(...probs);
  const minP = Math.min(...probs);
  const disagreementPp = maxP - minP;
  const consensusPct = pct01(event.consensus);

  const sources: ProbabilityPanoramaSource[] = (
    [
      { key: "options" as const, prob: o, sub: `融合权重参与者定价`, detail: `共识偏离: ${(o - consensusPct).toFixed(0)} pp` },
      { key: "polymarket" as const, prob: poly, sub: `YES 隐含 ${(p.polymarket).toFixed(2)}`, detail: `流动性由 Gamma API 推断` },
      { key: "social" as const, prob: s, sub: `X/社交 7 日加权`, detail: `关注度随事件演化` },
      { key: "institutional" as const, prob: ins, sub: `Form13F / 目标价修订`, detail: `机构 vs 散户暴露` },
    ] as const
  ).map(({ key, prob, sub, detail }) => {
    const meta = SOURCE_META[key];
    return {
      label: meta.label,
      labelEn: meta.labelEn,
      probability: prob,
      color: meta.color,
      bgColor: meta.bgColor,
      borderColor: meta.borderColor,
      subLabel: sub,
      detail,
      tooltip: `${meta.label} 当前隐含 ${prob}%（示意：由 ${event.title_zh.slice(0, 40)}… 相关市场数据融合）`,
      rank: meta.rank,
    };
  });

  const dir = directionLabel(event.arbitrage_direction);
  const estLow = Math.max(0, Math.min(100, Math.round(consensusPct - disagreementPp * 0.25)));
  const estHigh = Math.max(0, Math.min(100, Math.round(consensusPct + disagreementPp * 0.15)));
  const gapLow = Math.max(0, poly - estHigh);
  const gapHigh = Math.max(0, poly - estLow);

  const histRallyPct = Math.max(12, Math.min(42, Math.round(consensusPct * 0.45 + minP * 0.2)));
  const histDropPct = Math.max(18, Math.min(48, Math.round(maxP - consensusPct + 12)));
  const histChopPct = Math.max(12, 100 - histRallyPct - histDropPct);
  const judgmentHint =
    maxP - minP >= 30
      ? "多源定价高度分化，需优先核对流动性与结算规则再下注。"
      : "各源相对接近，但仍需关注预测市场与期权的名义概率差异。";

  const typeLabel =
    event.event_type === "macro_release" ? "宏观数据" : event.event_type === "geopolitical" ? "地缘 / 事件" : "跨市场事件";

  const eventTimeDisplay = event.event_time
    ? new Date(event.event_time).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" })
    : "待定";

  let countdownPrimary = "—";
  let countdownSub = "结算时间";
  if (event.event_time) {
    const end = new Date(event.event_time).getTime();
    const now = Date.now();
    const ms = Math.max(0, end - now);
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    countdownPrimary = `${d}天 ${h}小时`;
    countdownSub = "距离事件窗口";
  }

  const strategyLegs: StrategyLegRow[] = [
    {
      leg: "腿 1",
      market: "期权市场",
      marketColor: "#4A8FD4",
      action: event.arbitrage_direction.includes("polymarket") ? "对冲" : "关注",
      actionColor: "#D44A4A",
      instrument: `与「${event.title_zh.slice(0, 36)}${event.title_zh.length > 36 ? "…" : ""}」相关的波动率与方向敞口`,
      position: "按账户风险",
      maxPL: "见经纪商执行",
      plColor: "#3DBF7A",
      risk: `套利方向: ${event.arbitrage_direction}`,
    },
    {
      leg: "腿 2",
      market: "Polymarket",
      marketColor: "#D4AF37",
      action: event.arbitrage_direction.includes("polymarket_overpriced") ? "买 NO" : "买 YES",
      actionColor: "#3DBF7A",
      instrument: `主合约 YES 隐含 ${(p.polymarket).toFixed(2)}`,
      position: "$500 示意",
      maxPL: "二元结算",
      plColor: "#3DBF7A",
      risk: "事件与规则风险",
    },
  ];

  return {
    eventId: event.event_id,
    header: {
      badgeLabel: typeLabel,
      titleText: event.title_zh,
      metaTicker: undefined,
      eventTimeDisplay,
      settlementNote: "盘口与链上数据延迟 ~15min",
      countdownPrimary,
      countdownSub,
      showArbitragePill: event.disagreement >= 0.12,
    },
    panorama: {
      sources,
      aiConsensusPercent: consensusPct,
      disagreementPp,
      arbitrationHeadline: dir.headline,
      arbitrationDetail: dir.detail,
      arbitrationStrengthLabel: dir.strength,
    },
    narrative: {
      optionsPct: o,
      polymarketPct: poly,
      socialPct: s,
      institutionalPct: ins,
      estimatedLow: estLow,
      estimatedHigh: estHigh,
      polyGapLow: gapLow,
      polyGapHigh: gapHigh,
      histRallyPct,
      histDropPct,
      histChopPct,
      judgmentHint,
      strategyBullets: [
        {
          num: "1",
          color: "#4A8FD4",
          label: "期权侧",
          desc: `当前四源分歧约 ${disagreementPp} 个百分点，期权隐含 ${o}% — 用于对冲或表达波动率观点`,
        },
        {
          num: "2",
          color: "#D4AF37",
          label: "预测市场",
          desc: `Polymarket 隐含 ${poly}% ，相对估计区间 ${estLow}–${estHigh}% ，溢价区间约 ${gapLow}–${gapHigh} pp`,
        },
        {
          num: "3",
          color: "#3DBF7A",
          label: "组合提示",
          desc: `共识 ${consensusPct}% | 方向标签 ${event.arbitrage_direction.replace(/_/g, " ")}`,
        },
      ],
    },
    timeSeries: buildSyntheticTimeSeries(event.event_id, p),
    strategyLegs,
    strategySummary: {
      tagline: `组合特点 · 套利方向 ${event.arbitrage_direction.replace(/_/g, " ")}`,
      maxProfit: "见执行路径",
      maxRisk: "见各腿说明",
      evAnnual: "示意",
    },
  };
}

function inferTags(question: string): string[] {
  const lower = question.toLowerCase();
  const tags: string[] = [];
  if (/nvda|apple|tsla|股票|earnings|财报/i.test(lower)) tags.push("单股", "财报");
  if (/fed|加息|降息|cpi|非农|宏观/i.test(lower)) tags.push("宏观");
  if (/war|ukraine|iran|hormuz|军事|制裁/i.test(lower)) tags.push("地缘");
  if (/btc|eth|crypto|比特币/i.test(lower)) tags.push("Crypto");
  if (tags.length === 0) tags.push("跨资产");
  return tags;
}

function signalLevelFromDisagreement(d: number): SignalLevel {
  const x = d * 100;
  if (x >= 18) return "EXTREME";
  if (x >= 12) return "STRONG";
  if (x >= 7) return "MODERATE";
  return "LOW";
}

function actionFromArb(arb: string): string {
  if (arb.includes("polymarket_overpriced")) return "卖 Poly YES / 买 NO + 期权对冲";
  if (arb.includes("polymarket_underpriced")) return "买 Poly YES + 现货/期权表达";
  if (arb.includes("options_underpriced")) return "买期权波动率 / 日历价差";
  if (arb.includes("options_overpriced")) return "卖期权收租 + Poly 对冲";
  return "多源对冲 · 详见套利方向字段";
}

export function adaptBackendScannerRows(rows: BackendArbitrageOpportunity[]): UiArbitrageOpportunity[] {
  const sorted = [...rows].sort((a, b) => b.disagreement - a.disagreement);
  return sorted.map((row, idx) => {
    const sources = [
      { label: "期权市场", value: pct01(row.options_probability) },
      { label: "Polymarket", value: pct01(row.polymarket_probability) },
      { label: "社交情绪", value: pct01(row.social_probability) },
      { label: "机构信号", value: pct01(row.institutional_probability) },
    ];
    const dScore = Math.round(row.disagreement * 100);
    return {
      id: row.event_id,
      rank: idx + 1,
      title: row.question,
      titleEn: row.question,
      sources,
      disagreementScore: dScore,
      signalLevel: signalLevelFromDisagreement(row.disagreement),
      action: actionFromArb(row.arbitrage_direction),
      ev: Math.round(row.confidence_score * row.disagreement * 120),
      liquidity: row.confidence_score >= 0.45 ? "good" : "thin",
      tags: inferTags(row.question),
      aiNarrative: `四源概率分歧 ${dScore}（示意分）· ${row.arbitrage_direction.replace(/_/g, " ")} · 置信 ${Math.round(row.confidence_score * 100)}%`,
    };
  });
}

export type ScannerStat = {
  icon: "bar" | "zap" | "alert" | "trend";
  label: string;
  value: string;
  unit: string;
  sub?: string;
  color: string;
  iconColor: string;
};

export function computeScannerStats(opportunities: UiArbitrageOpportunity[]): ScannerStat[] {
  const n = opportunities.length;
  const significant = opportunities.filter((o) => o.disagreementScore >= 15).length;
  const extreme = opportunities.filter((o) => o.signalLevel === "EXTREME").length;
  const avgEv =
    n === 0 ? 0 : opportunities.reduce((a, o) => a + o.ev, 0) / n;
  const evStr = n === 0 ? "0" : `+${avgEv.toFixed(1)}`;

  return [
    {
      icon: "bar",
      label: "当前活跃事件",
      value: String(Math.max(n, 0)),
      unit: "",
      color: "text-foreground",
      iconColor: "text-muted-foreground",
    },
    {
      icon: "zap",
      label: "显著背离信号",
      value: String(significant),
      unit: "个",
      sub: "背离度 > 15",
      color: "text-primary",
      iconColor: "text-primary",
    },
    {
      icon: "alert",
      label: "极强背离信号",
      value: String(extreme),
      unit: "个",
      sub: "signal = EXTREME",
      color: "text-destructive",
      iconColor: "text-destructive",
    },
    {
      icon: "trend",
      label: "平均潜在收益分",
      value: evStr,
      unit: "",
      color: "text-signal-green",
      iconColor: "text-signal-green",
    },
  ];
}
