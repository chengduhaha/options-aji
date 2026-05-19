"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Gauge,
  LineChart as LineChartIcon,
  Loader2,
  LockKeyhole,
  Newspaper,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  AnalystPriceTargetContract,
  FeedEnvelopeContract,
  FeedItemContract,
  MarketOverviewContract,
  SignalCardContract,
  SignalsFeedEnvelopeContract,
  SmartVsRetailContract,
  StockOverviewContract,
} from "@/lib/contracts";

type Direction = "bull" | "bear" | "neutral";
type JsonRecord = Record<string, unknown>;

type AsyncSlot<T> = {
  data: T | null;
  error: string | null;
};

type WarRoomData = {
  overview: AsyncSlot<MarketOverviewContract>;
  brief: AsyncSlot<{ brief?: string }>;
  macro: AsyncSlot<JsonRecord>;
  treasury: AsyncSlot<JsonRecord>;
  news: AsyncSlot<JsonRecord>;
  feed: AsyncSlot<FeedEnvelopeContract>;
  signals: AsyncSlot<SignalsFeedEnvelopeContract>;
};

type StockReport = {
  overview: AsyncSlot<StockOverviewContract>;
  priceTarget: AsyncSlot<AnalystPriceTargetContract>;
  smart: AsyncSlot<SmartVsRetailContract>;
  news: AsyncSlot<JsonRecord>;
  chain: AsyncSlot<JsonRecord>;
  unusual: AsyncSlot<JsonRecord>;
  strategy: AsyncSlot<JsonRecord>;
};

type EventItem = {
  title: string;
  body: string;
  tag: string;
  impact: "利好" | "利空" | "中性" | "风险";
  time?: string;
};

type OptionCandidate = {
  side: "call" | "put";
  strike: number;
  expiration: string;
  dte: number | null;
  bid: number | null;
  ask: number | null;
  mid: number | null;
  ivPct: number | null;
  delta: number | null;
  volume: number | null;
  openInterest: number | null;
};

const QUICK_SYMBOLS = ["SPY", "QQQ", "NVDA", "TSLA", "AAPL", "AMD"];

const EMPTY_WAR_ROOM: WarRoomData = {
  overview: { data: null, error: null },
  brief: { data: null, error: null },
  macro: { data: null, error: null },
  treasury: { data: null, error: null },
  news: { data: null, error: null },
  feed: { data: null, error: null },
  signals: { data: null, error: null },
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace("%", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function pct(value: unknown, digits = 2): string {
  const n = num(value);
  if (n === null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

function money(value: unknown, digits = 2): string {
  const n = num(value);
  if (n === null) return "—";
  return `$${n.toFixed(digits)}`;
}

function compactMoney(value: unknown): string {
  const n = num(value);
  if (n === null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function zhTime(value: unknown): string {
  const raw = text(value);
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "加载失败");
}

/** Beijing calendar day as YYYY-MM-DD for macro calendar window. */
function beijingDateString(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}

const MACRO_EVENT_ZH: Array<[string, string]> = [
  ["nonfarm", "非农就业"],
  ["payrolls", "非农就业"],
  ["cpi", "CPI 通胀"],
  ["ppi", "PPI 生产者物价"],
  ["fomc", "FOMC 利率决议"],
  ["fed", "美联储"],
  ["gdp", "GDP"],
  ["pmi", "PMI"],
  ["retail sales", "零售销售"],
  ["jobless", "初请失业金"],
  ["unemployment", "失业率"],
  ["consumer confidence", "消费者信心"],
  ["ism", "ISM 制造业"],
  ["housing", "房地产数据"],
  ["trade balance", "贸易帐"],
  ["jolts", "JOLTS 职位空缺"],
];

function macroEventTitleZh(eventName: string): string {
  const lower = eventName.toLowerCase();
  for (const [key, zh] of MACRO_EVENT_ZH) {
    if (lower.includes(key)) return zh;
  }
  if (/[\u4e00-\u9fff]/.test(eventName)) return eventName;
  return `宏观：${eventName}`;
}

function friendlyApiError(error: string | null, slot: string): string | null {
  if (!error) return null;
  const lower = error.toLowerCase();
  if (lower.includes("internal server error") || lower.includes("500")) {
    if (slot === "overview") return "个股行情源暂不可用，请稍后刷新";
    if (slot === "chain") return "期权链快照暂不可用";
    return "服务暂时不可用，请稍后重试";
  }
  if (lower.includes("not found") || lower.includes("404")) {
    if (slot === "news") return "新闻数据暂不可用";
    if (slot === "priceTarget") return "分析师目标价暂不可用";
    return "部分数据接口未启用";
  }
  if (lower.includes("chain_meta_failed") || lower.includes("openrouter")) {
    return "数据源暂不可用";
  }
  return error.length > 80 ? `${error.slice(0, 80)}…` : error;
}

async function settle<T>(fn: () => Promise<T>): Promise<AsyncSlot<T>> {
  try {
    return { data: await fn(), error: null };
  } catch (error) {
    return { data: null, error: errorMessage(error) };
  }
}

async function fetchJson(path: string): Promise<JsonRecord> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as JsonRecord;
}

function getArticles(payload: JsonRecord | null): JsonRecord[] {
  if (!payload) return [];
  return asArray(payload.articles).map(asRecord);
}

function getEvents(payload: JsonRecord | null): JsonRecord[] {
  if (!payload) return [];
  return asArray(payload.events).map(asRecord);
}

function getTreasuryRows(payload: JsonRecord | null): JsonRecord[] {
  if (!payload) return [];
  return asArray(payload.rates).map(asRecord);
}

function classifyMarket(overview: MarketOverviewContract | null, signals: SignalCardContract[]) {
  const spy = overview?.pulse.find((p) => p.symbol === "SPY")?.changePct ?? null;
  const qqq = overview?.pulse.find((p) => p.symbol === "QQQ")?.changePct ?? null;
  const vixChange = overview?.volatility.vixChangePct ?? null;
  const avgIndex =
    spy !== null && qqq !== null ? (spy + qqq) / 2 : spy !== null ? spy : qqq !== null ? qqq : 0;
  const signalScore = signals.reduce((sum, sig) => {
    if (sig.direction === "bull") return sum + sig.strength;
    if (sig.direction === "bear") return sum - sig.strength;
    return sum;
  }, 0);

  if (avgIndex <= -0.35 || (vixChange !== null && vixChange > 3) || signalScore <= -5) {
    return {
      label: "风险优先",
      tone: "text-red",
      icon: TrendingDown,
      summary: "指数或波动率显示压力，盘前计划应先定义失效条件，再考虑方向。",
    };
  }
  if (avgIndex >= 0.35 && (vixChange === null || vixChange < 2) && signalScore >= 0) {
    return {
      label: "顺势进攻",
      tone: "text-green",
      icon: TrendingUp,
      summary: "盘前风险偏好偏积极，优先寻找强势板块中的回踩机会。",
    };
  }
  return {
    label: "等待确认",
    tone: "text-gold",
    icon: Gauge,
    summary: "数据没有形成单边共识，开盘前 30 分钟适合缩小观察名单。",
  };
}

function feedItemImpact(item: FeedItemContract): EventItem["impact"] {
  const s = (item.sentiment ?? "").toLowerCase();
  if (s.includes("bull")) return "利好";
  if (s.includes("bear")) return "利空";
  if (item.kind === "macro") return "风险";
  return "中性";
}

function buildWarRoomEvents(data: WarRoomData): EventItem[] {
  const events: EventItem[] = [];
  const now = Date.now();

  const feedItems = [...(data.feed.data?.items ?? [])].sort(
    (a, b) => new Date(b.created_at_utc).getTime() - new Date(a.created_at_utc).getTime(),
  );
  for (const item of feedItems.slice(0, 5)) {
    const body =
      item.bullets_zh?.filter(Boolean).join(" ") ||
      item.risk_note_zh ||
      item.body.slice(0, 200);
    events.push({
      title: item.title,
      body,
      tag: item.kind === "macro" ? "宏观情报" : item.kind === "signal" ? "信号" : item.kind,
      impact: feedItemImpact(item),
      time: zhTime(item.created_at_utc),
    });
  }

  for (const sig of (data.signals.data?.signals ?? []).slice(0, 4)) {
    events.push({
      title: sig.title,
      body: sig.summary,
      tag: `${sig.ticker} · ${sig.priority}`,
      impact: sig.direction === "bull" ? "利好" : sig.direction === "bear" ? "利空" : "中性",
      time: sig.time_cn,
    });
  }

  const macroEvents = getEvents(data.macro.data)
    .filter((ev) => ["High", "Medium"].includes(text(ev.impact)))
    .map((ev) => ({ ev, ts: new Date(text(ev.date)).getTime() }))
    .filter((row) => !Number.isNaN(row.ts))
    .sort((a, b) => Math.abs(a.ts - now) - Math.abs(b.ts - now))
    .slice(0, 3);

  for (const { ev } of macroEvents) {
    const impact = text(ev.impact) === "High" ? "风险" : "中性";
    const eventName = text(ev.event, "宏观事件");
    events.push({
      title: macroEventTitleZh(eventName),
      body: [
        text(ev.country) === "US" ? "美国" : text(ev.country),
        ev.estimate != null ? `预期 ${String(ev.estimate)}` : "",
        ev.previous != null ? `前值 ${String(ev.previous)}` : "",
        eventName !== macroEventTitleZh(eventName) ? `原文：${eventName}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      tag: text(ev.impact) === "High" ? "高影响" : "中影响",
      impact,
      time: zhTime(ev.date),
    });
  }

  for (const article of getArticles(data.news.data).slice(0, 3)) {
    events.push({
      title: text(article.title_zh) || text(article.title, "市场新闻"),
      body: text(article.summary_zh) || text(article.content).slice(0, 160),
      tag: text(article.source, "News"),
      impact: "中性",
      time: zhTime(article.published_at ?? article.publishedDate ?? article.date),
    });
  }

  const seen = new Set<string>();
  return events
    .filter((ev) => {
      const key = `${ev.title}|${ev.time ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function normalizeOptionCandidates(payload: JsonRecord | null, direction: Direction): OptionCandidate[] {
  if (!payload) return [];
  const desiredSide = direction === "bear" ? "put" : "call";
  const contracts = asArray(payload.contracts);
  const calls = asArray(payload.calls);
  const puts = asArray(payload.puts);
  const rows = contracts.length > 0 ? contracts : desiredSide === "put" ? puts : calls;
  const today = new Date();

  return rows
    .map(asRecord)
    .map((row): OptionCandidate | null => {
      const sideRaw = text(row.contract_type) || text(row.type) || desiredSide;
      const side = sideRaw.toLowerCase().startsWith("p") ? "put" : "call";
      if (side !== desiredSide) return null;
      const expiration = text(row.expiration_date) || text(row.expiration) || text(payload.expiration);
      const strike = num(row.strike_price ?? row.strike);
      if (!expiration || strike === null) return null;
      const expiryDate = new Date(expiration);
      const dte = Number.isNaN(expiryDate.getTime())
        ? null
        : Math.ceil((expiryDate.getTime() - today.getTime()) / 86_400_000);
      const bid = num(row.bid);
      const ask = num(row.ask);
      const mid = num(row.midpoint) ?? (bid !== null && ask !== null ? (bid + ask) / 2 : null);
      const ivRaw = num(row.implied_volatility ?? row.impliedVolatility);
      return {
        side,
        strike,
        expiration,
        dte,
        bid,
        ask,
        mid,
        ivPct: ivRaw !== null && ivRaw <= 3 ? ivRaw * 100 : ivRaw,
        delta: num(row.delta),
        volume: num(row.day_volume ?? row.volume),
        openInterest: num(row.open_interest ?? row.openInterest),
      };
    })
    .filter((row): row is OptionCandidate => row !== null)
    .filter((row) => row.dte === null || (row.dte >= 7 && row.dte <= 75))
    .sort((a, b) => {
      const ad = a.dte ?? 999;
      const bd = b.dte ?? 999;
      if (ad !== bd) return ad - bd;
      return (b.volume ?? 0) - (a.volume ?? 0);
    })
    .slice(0, 8);
}

function pickActionBias(direction: Direction, report: StockReport | null) {
  const overview = report?.overview.data ?? null;
  const bar = overview?.bar;
  const price = num(bar?.price);
  const change = num(bar?.changePct);
  const keyStats = overview?.keyStats ?? {};
  const ivRank = num(keyStats.ivRank);
  const smart = report?.smart.data;
  const institutional = smart?.institutional_direction?.toLowerCase() ?? "";
  const retail = smart?.retail_direction?.toLowerCase() ?? "";

  if (!overview) {
    return {
      label: "等待数据",
      tone: "text-muted-foreground",
      thesis: "个股数据未完全载入，先不要基于单一价格做判断。",
    };
  }

  if (direction === "bull") {
    if ((change ?? 0) > 2.5 && (ivRank ?? 0) > 65) {
      return {
        label: "追高成本偏高",
        tone: "text-red",
        thesis: "价格和隐含波动率同时偏热，优先等回踩或用价差降低权利金暴露。",
      };
    }
    if (institutional.includes("bull") || smart?.consensus_type === "aligned_bullish") {
      return {
        label: "可列入多头观察",
        tone: "text-green",
        thesis: "机构/情绪与多头方向更接近，等待价格靠近支撑或突破确认。",
      };
    }
    return {
      label: "多头需等待确认",
      tone: "text-gold",
      thesis: `当前价格 ${price !== null ? `$${price.toFixed(2)}` : "—"}，先观察开盘后是否放量站稳关键区间。`,
    };
  }

  if (direction === "bear") {
    if ((change ?? 0) < -2.5 && (ivRank ?? 0) > 65) {
      return {
        label: "看空拥挤",
        tone: "text-red",
        thesis: "价格已快速下跌且 IV 偏高，直接买 put 的容错较低。",
      };
    }
    if (institutional.includes("bear") || retail.includes("bull")) {
      return {
        label: "可观察下行验证",
        tone: "text-gold",
        thesis: "看空方向需要跌破支撑或反弹不过压力位后再确认。",
      };
    }
  }

  return {
    label: "中性观察",
    tone: "text-gold",
    thesis: "先判断波动率和区间边界，再决定正股等待还是期权用有限风险结构表达。",
  };
}

function buildChecklist(direction: Direction, report: StockReport | null): string[] {
  const overview = report?.overview.data ?? null;
  const price = num(overview?.bar?.price);
  const moves = overview?.expectedMoves ?? [];
  const nearestMove = moves[0];
  const ivRank = num(overview?.keyStats?.ivRank);
  const gex = asRecord(report?.chain.data);
  const chainCount = asArray(gex.contracts).length || asArray(gex.calls).length + asArray(gex.puts).length;

  return [
    price !== null
      ? `正股先围绕 ${money(price)} 做区间判断，不在开盘第一根大波动里追价。`
      : "正股价格缺失时，只保留观察，不做期权筛选。",
    nearestMove
      ? `用最近一期 Expected Move 作为日内风险尺：${nearestMove.bucket} 约 ±${nearestMove.pct.toFixed(2)}%。`
      : "如果 Expected Move 缺失，用小仓位和更远止损替代精确点位。",
    ivRank !== null && ivRank > 60
      ? "IV Rank 偏高，买方期权优先考虑价差或等待 IV 回落。"
      : "IV 未明显偏高时，可比较 ATM 与轻度 OTM 的权利金效率。",
    chainCount > 0
      ? "期权只看有成交量和 OI 的合约，避开价差过宽的远月/深虚值。"
      : "期权链不可用时，不输出具体行权价，只给正股分析。",
    direction === "neutral"
      ? "中性场景先等突破/跌破，不急于选择 call 或 put。"
      : "方向场景必须先定义失效条件，再比较正股和期权表达成本。",
  ];
}

function reportErrors(
  slots: Array<{ slot: AsyncSlot<unknown>; key: string }>,
): string[] {
  return slots
    .map(({ slot, key }) => friendlyApiError(slot.error, key))
    .filter((e): e is string => Boolean(e));
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`glass rounded-xl border border-glass-border ${className}`}>{children}</section>;
}

function Pill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "gold" | "blue" | "muted";
}) {
  const color =
    tone === "green"
      ? "border-green/30 bg-green/10 text-green"
      : tone === "red"
        ? "border-red/30 bg-red/10 text-red"
        : tone === "gold"
          ? "border-gold/30 bg-gold/10 text-gold"
          : tone === "blue"
            ? "border-blue/30 bg-blue/10 text-blue"
            : "border-white/10 bg-white/[0.03] text-muted-foreground";
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${color}`}>{children}</span>;
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border2 bg-white/[0.02] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-foreground">{value}</div>
      {sub ? <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function EmptyLine({ text: value }: { text: string }) {
  return <div className="rounded-lg border border-border2 bg-white/[0.02] px-4 py-3 text-sm text-muted">{value}</div>;
}

export default function MvpPage() {
  const auth = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [warRoom, setWarRoom] = useState<WarRoomData>(EMPTY_WAR_ROOM);
  const [warLoading, setWarLoading] = useState(true);
  const [symbol, setSymbol] = useState("SPY");
  const [direction, setDirection] = useState<Direction>("bull");
  const [report, setReport] = useState<StockReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    try {
      setApiKey(window.localStorage.getItem("optionsaji_api_key") || "");
    } catch {
      setApiKey("");
    }
  }, []);

  const deepMode = Boolean(auth.token || apiKey.trim().length >= 8);

  const loadWarRoom = useCallback(async () => {
    setWarLoading(true);
    const today = beijingDateString(0);
    const tomorrow = beijingDateString(1);
    const [overview, brief, macro, treasury, news, feed, signals] = await Promise.all([
      settle<MarketOverviewContract>(() => api.market.overview()),
      settle<{ brief?: string }>(() => api.market.brief() as Promise<{ brief?: string }>),
      settle<JsonRecord>(() => api.macro.calendar(today, tomorrow, "US") as Promise<JsonRecord>),
      settle<JsonRecord>(() => api.macro.treasury(30) as Promise<JsonRecord>),
      settle<JsonRecord>(() => api.news.latest() as Promise<JsonRecord>),
      settle<FeedEnvelopeContract>(() => api.feed.unified(40)),
      settle<SignalsFeedEnvelopeContract>(() => api.market.signalsFeed()),
    ]);
    setWarRoom({ overview, brief, macro, treasury, news, feed, signals });
    setWarLoading(false);
  }, []);

  useEffect(() => {
    void loadWarRoom();
  }, [loadWarRoom]);

  const runStockReport = useCallback(async (nextSymbol?: string) => {
    const sym = (nextSymbol || symbol).trim().toUpperCase();
    if (!sym) return;
    setSymbol(sym);
    setReportLoading(true);
    const [overview, priceTarget, smart, news, chain, unusual, strategy] = await Promise.all([
      settle<StockOverviewContract>(() => api.stock.overview(sym)),
      settle<AnalystPriceTargetContract>(() => api.analyst.priceTarget(sym)),
      settle<SmartVsRetailContract>(() => api.social.smartVsRetail(sym)),
      settle<JsonRecord>(() => api.news.stock(sym) as Promise<JsonRecord>),
      settle<JsonRecord>(() => api.options.chain(sym) as Promise<JsonRecord>),
      settle<JsonRecord>(() =>
        fetchJson(`/api/stock/${encodeURIComponent(sym)}/unusual-v2?page_size=20`),
      ),
      settle<JsonRecord>(() => api.stock.strategyIdeas(sym) as Promise<JsonRecord>),
    ]);
    setReport({ overview, priceTarget, smart, news, chain, unusual, strategy });
    setReportLoading(false);
  }, [symbol]);

  useEffect(() => {
    void runStockReport("SPY");
    // Initial report should run once; subsequent deep-mode flips are reflected on next manual refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signals = warRoom.signals.data?.signals ?? [];
  const marketState = classifyMarket(warRoom.overview.data, signals);
  const MarketIcon = marketState.icon;
  const events = useMemo(() => buildWarRoomEvents(warRoom), [warRoom]);
  const treasuryRows = getTreasuryRows(warRoom.treasury.data);
  const latestTreasury = treasuryRows[0] ?? {};
  const yieldBars = [
    { term: "1M", rate: num(latestTreasury.month1 ?? latestTreasury["1M"]) },
    { term: "2Y", rate: num(latestTreasury.year2 ?? latestTreasury["2Y"]) },
    { term: "10Y", rate: num(latestTreasury.year10 ?? latestTreasury["10Y"]) },
    { term: "30Y", rate: num(latestTreasury.year30 ?? latestTreasury["30Y"]) },
  ].filter((row): row is { term: string; rate: number } => row.rate !== null);
  const overview = warRoom.overview.data;
  const pulseRows = overview?.pulse ?? [];
  const vixSeries = (overview?.volatility.vixSeries ?? []).map((value, index) => ({
    day: String(index + 1),
    value,
  }));
  const allWarErrors = reportErrors([
    { slot: warRoom.overview, key: "overview" },
    { slot: warRoom.brief, key: "brief" },
    { slot: warRoom.macro, key: "macro" },
    { slot: warRoom.news, key: "news" },
    { slot: warRoom.signals, key: "signals" },
  ]);

  const stockBias = pickActionBias(direction, report);
  const stockOverview = report?.overview.data ?? null;
  const priceSeries = (stockOverview?.priceSeries ?? [])
    .slice(-66)
    .map((row) => ({ date: row.date.slice(5), close: row.close ?? null }));
  const optionCandidates = normalizeOptionCandidates(report?.chain.data ?? null, direction);
  const checklist = buildChecklist(direction, report);
  const stockNews = getArticles(report?.news.data ?? null).slice(0, 4);
  const reportErrorList = report
    ? reportErrors([
        { slot: report.overview, key: "overview" },
        { slot: report.priceTarget, key: "priceTarget" },
        { slot: report.smart, key: "smart" },
        { slot: report.news, key: "news" },
        { slot: report.chain, key: "chain" },
        { slot: report.unusual, key: "unusual" },
        { slot: report.strategy, key: "strategy" },
      ])
    : [];

  const unusualItems = asArray(report?.unusual.data?.items).map(asRecord).slice(0, 5);
  const strategyIdeas = asArray(report?.strategy.data?.ideas).map(asRecord).slice(0, 3);
  const priceTarget = report?.priceTarget.data;
  const ptAvg = priceTarget?.summary?.lastMonthAvgPriceTarget ?? priceTarget?.consensus?.priceTarget ?? null;
  const spot = num(stockOverview?.bar?.price);
  const upside = spot !== null && ptAvg ? ((ptAvg - spot) / spot) * 100 : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-4 md:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-glass-border bg-panel/80 px-4 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <Pill tone="gold">MVP</Pill>
              <span>北京时间 21:30 美股开盘前作战台</span>
              <span className="hidden md:inline">/mvp</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              今日作战室
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={deepMode ? "green" : "muted"}>
              {deepMode ? "深度数据已启用" : "公开简版"}
            </Pill>
            <Link
              href="/"
              className="rounded-lg border border-border2 px-3 py-2 text-sm text-muted-foreground transition hover:border-gold/40 hover:text-gold"
            >
              返回旧版
            </Link>
            <button
              type="button"
              onClick={() => void loadWarRoom()}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold transition hover:bg-gold/15"
            >
              <RefreshCw className={`h-4 w-4 ${warLoading ? "animate-spin" : ""}`} />
              刷新
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4 text-gold" />
                  盘前总览
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <MarketIcon className={`h-8 w-8 ${marketState.tone}`} />
                  <div>
                    <div className={`text-xl font-semibold ${marketState.tone}`}>{marketState.label}</div>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{marketState.summary}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {pulseRows.slice(0, 4).map((row) => (
                  <Metric
                    key={row.symbol}
                    label={row.symbol}
                    value={row.price !== null ? row.price.toFixed(2) : "—"}
                    sub={<span className={row.changePct && row.changePct >= 0 ? "text-green" : "text-red"}>{pct(row.changePct)}</span>}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
              <div className="min-h-[220px]">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                  <Newspaper className="h-4 w-4 text-blue" />
                  影响今日交易的事件
                </div>
                <div className="space-y-2">
                  {warLoading && events.length === 0 ? (
                    <EmptyLine text="正在载入盘前事件..." />
                  ) : events.length === 0 ? (
                    <EmptyLine text="暂无高优先级事件，先观察指数、VIX 与开盘前成交量。" />
                  ) : (
                    events.slice(0, 5).map((event, index) => (
                      <div key={`${event.title}-${index}`} className="rounded-lg border border-border2 bg-white/[0.02] px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone={event.impact === "利好" ? "green" : event.impact === "利空" || event.impact === "风险" ? "red" : "muted"}>
                            {event.impact}
                          </Pill>
                          <span className="text-xs text-muted">{event.tag}</span>
                          {event.time ? <span className="text-xs text-muted">{event.time}</span> : null}
                        </div>
                        <div className="mt-2 text-sm font-medium text-foreground">{event.title}</div>
                        {event.body ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{event.body}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-[120px] rounded-lg border border-border2 bg-white/[0.02] p-2">
                  {vixSeries.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={vixSeries}>
                        <defs>
                          <linearGradient id="vixFill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#f0b429" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#f0b429" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" hide />
                        <YAxis hide domain={["auto", "auto"]} />
                        <Tooltip contentStyle={{ background: "#0f1c30", border: "1px solid rgba(255,255,255,.1)" }} />
                        <Area type="monotone" dataKey="value" stroke="#f0b429" fill="url(#vixFill)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">VIX 序列不可用</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="VIX" value={overview?.volatility.vix?.toFixed(2) ?? "—"} sub={pct(overview?.volatility.vixChangePct)} />
                  <Metric label="P/C" value={overview?.liquidity.putCallRatioVolumeApprox?.toFixed(2) ?? "—"} sub="成交量近似" />
                </div>
              </div>
            </div>

            {allWarErrors.length > 0 ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red/20 bg-red/10 px-3 py-2 text-xs text-red">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{allWarErrors.slice(0, 2).join(" · ")}</span>
              </div>
            ) : null}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4 text-green" />
              今日交易计划
            </div>
            <div className="mt-4 space-y-3">
              {[
                "开盘前只保留 3 个观察标的：指数方向、强势板块龙头、事件驱动个股。",
                "开盘后先等 15-30 分钟确认量价，不在第一根大波动里追单。",
                "正股看价格是否接近支撑/压力；期权看 IV、DTE、成交量和 OI。",
                "如果 VIX 快速上行或宏观数据超预期，降低仓位并缩短持仓时间。",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-border2 bg-white/[0.02] p-3">
              <div className="mb-2 text-xs text-muted">国债曲线</div>
              {yieldBars.length > 0 ? (
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={yieldBars}>
                    <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                    <XAxis dataKey="term" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ background: "#0f1c30", border: "1px solid rgba(255,255,255,.1)" }} />
                    <Bar dataKey="rate" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[120px] items-center justify-center text-xs text-muted">收益率暂不可用</div>
              )}
            </div>
          </Card>
        </section>

        <Card className="p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4 text-gold" />
                股票交易分析器
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_SYMBOLS.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => void runStockReport(sym)}
                    className="rounded-lg border border-border2 px-3 py-2 text-sm text-muted-foreground transition hover:border-gold/40 hover:text-gold"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
            <form
              className="flex flex-col gap-2 sm:flex-row lg:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                void runStockReport();
              }}
            >
              <div className="flex min-w-[220px] flex-col gap-1">
                <label className="text-xs text-muted">Ticker</label>
                <input
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                  className="h-10 rounded-lg border border-border2 bg-background px-3 font-mono text-sm text-foreground outline-none transition focus:border-gold/50"
                  placeholder="NVDA"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">方向</label>
                <div className="grid grid-cols-3 rounded-lg border border-border2 bg-background p-1">
                  {([
                    ["bull", "看多"],
                    ["bear", "看空"],
                    ["neutral", "观察"],
                  ] as const).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDirection(id)}
                      className={`h-8 rounded-md px-3 text-xs transition ${direction === id ? "bg-gold text-background" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-sm font-medium text-background transition hover:bg-gold/90 disabled:opacity-60"
                disabled={reportLoading}
              >
                {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                生成分析报告
              </button>
            </form>
          </div>
        </Card>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LineChartIcon className="h-4 w-4 text-blue" />
                  正股价格是否合适
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className={`text-lg font-semibold ${stockBias.tone}`}>{stockBias.label}</div>
                  {spot !== null ? <Pill tone="blue">{money(spot)}</Pill> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{stockBias.thesis}</p>
              </div>
              {reportLoading ? <Loader2 className="h-5 w-5 animate-spin text-gold" /> : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Metric label="现价" value={money(spot)} sub={pct(stockOverview?.bar?.changePct)} />
              <Metric label="IV Rank" value={num(stockOverview?.keyStats?.ivRank)?.toFixed(1) ?? "—"} sub="波动率热度" />
              <Metric label="目标价差" value={upside !== null ? pct(upside) : "—"} sub={ptAvg ? money(ptAvg) : "分析师"} />
              <Metric label="情绪" value={report?.smart.data?.retail_sentiment_score ?? "—"} sub={report?.smart.data?.consensus_type ?? "smart vs retail"} />
            </div>

            <div className="mt-4 h-[220px] rounded-lg border border-border2 bg-white/[0.02] p-2">
              {priceSeries.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceSeries}>
                    <defs>
                      <linearGradient id="stockFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} minTickGap={24} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} domain={["auto", "auto"]} width={48} />
                    <Tooltip contentStyle={{ background: "#0f1c30", border: "1px solid rgba(255,255,255,.1)" }} />
                    <Area type="monotone" dataKey="close" stroke="#22d3ee" fill="url(#stockFill)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted">K 线数据载入中</div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <WalletCards className="h-4 w-4 text-gold" />
                期权选择框架
              </div>
              {!deepMode ? (
                <Pill tone="muted">
                  <LockKeyhole className="mr-1 h-3 w-3" />
                  简版
                </Pill>
              ) : (
                <Pill tone="green">深度版</Pill>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
              <div className="overflow-hidden rounded-lg border border-border2">
                <div className="grid grid-cols-[0.9fr_0.9fr_0.8fr_0.8fr_0.8fr] bg-white/[0.03] px-3 py-2 text-[11px] text-muted">
                  <span>合约</span>
                  <span>到期</span>
                  <span>DTE</span>
                  <span>IV</span>
                  <span>量/OI</span>
                </div>
                {optionCandidates.length > 0 ? (
                  optionCandidates.slice(0, 6).map((row) => (
                    <div key={`${row.side}-${row.expiration}-${row.strike}`} className="grid grid-cols-[0.9fr_0.9fr_0.8fr_0.8fr_0.8fr] border-t border-border2 px-3 py-2 text-xs">
                      <span className={row.side === "call" ? "text-green" : "text-red"}>
                        {row.side.toUpperCase()} {row.strike}
                      </span>
                      <span className="font-mono text-muted-foreground">{row.expiration.slice(5)}</span>
                      <span className="font-mono text-foreground">{row.dte ?? "—"}</span>
                      <span className="font-mono text-foreground">{row.ivPct !== null ? `${row.ivPct.toFixed(1)}%` : "—"}</span>
                      <span className="font-mono text-muted-foreground">
                        {row.volume ?? "—"}/{row.openInterest ?? "—"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="border-t border-border2 px-3 py-8 text-center text-sm text-muted">期权链暂不可用</div>
                )}
              </div>

              <div className="space-y-2">
                {(stockOverview?.expectedMoves ?? []).slice(0, 3).map((move) => (
                  <div key={move.bucket} className="rounded-lg border border-border2 bg-white/[0.02] px-3 py-2">
                    <div className="text-[11px] text-muted">{move.bucket}</div>
                    <div className="font-mono text-sm text-foreground">
                      ±{move.pct.toFixed(2)}% · {money(move.straddleUsd)}
                    </div>
                    <div className="mt-1 text-[10px] text-muted">{move.expiration}</div>
                  </div>
                ))}
                {strategyIdeas.map((idea) => (
                  <div key={text(idea.id) || text(idea.title)} className="rounded-lg border border-border2 bg-white/[0.02] px-3 py-2">
                    <div className="text-xs font-medium text-foreground">{text(idea.title)}</div>
                    <div className="mt-1 text-[11px] leading-4 text-muted-foreground">{text(idea.note)}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldAlert className="h-4 w-4 text-red" />
              风险与等待条件
            </div>
            <div className="mt-4 space-y-3">
              {checklist.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                  <Clock3 className="mt-1 h-4 w-4 shrink-0 text-gold" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            {reportErrorList.length > 0 ? (
              <div className="mt-4 rounded-lg border border-red/20 bg-red/10 px-3 py-2 text-xs text-red">
                {reportErrorList.slice(0, 3).join(" · ")}
              </div>
            ) : null}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-green" />
              新闻、资金与异动
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                {stockNews.length > 0 ? (
                  stockNews.map((article, index) => (
                    <div key={`${text(article.title)}-${index}`} className="rounded-lg border border-border2 bg-white/[0.02] px-3 py-2">
                      <div className="line-clamp-2 text-xs font-medium text-foreground">
                        {text(article.title_zh) || text(article.title, "个股新闻")}
                      </div>
                      <div className="mt-1 text-[10px] text-muted">{text(article.source, "News")} · {zhTime(article.published_at ?? article.publishedDate ?? article.date)}</div>
                    </div>
                  ))
                ) : (
                  <EmptyLine text="暂无个股新闻" />
                )}
              </div>
              <div className="space-y-2">
                {unusualItems.length > 0 ? (
                  unusualItems.map((item, index) => {
                    const side = text(item.type ?? item.contract_type).toLowerCase().includes("put") ? "PUT" : "CALL";
                    return (
                      <div key={`${side}-${String(item.strike ?? item.strike_price)}-${index}`} className="rounded-lg border border-border2 bg-white/[0.02] px-3 py-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={side === "CALL" ? "text-green" : "text-red"}>
                            {side} {String(item.strike ?? item.strike_price ?? "—")}
                          </span>
                          <span className="font-mono text-gold">
                            {item.score != null ? `Score ${String(item.score)}` : `Vol/OI ${String(item.volOiRatio ?? "—")}`}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-muted">
                          Flow {compactMoney(item.estimatedFlowUsd)} · Vol {String(item.volume ?? item.day_volume ?? "—")}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyLine text="暂无期权异动" />
                )}
              </div>
            </div>
          </Card>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 pb-6 text-xs text-muted">
          <span>教育和分析用途，不构成投资建议。</span>
          <div className="flex items-center gap-3">
            <Link href="/macro" className="hover:text-gold">宏观</Link>
            <Link href="/stock/SPY/overview" className="hover:text-gold">个股深挖</Link>
            <Link href="/options/unusual" className="hover:text-gold">期权异动</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
