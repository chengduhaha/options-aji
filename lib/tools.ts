// Tool definitions for the OpenRouter ReAct loop
// In POC: returns mock data. Replace with real API calls later.

export const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_gex_data",
      description:
        "获取指定标的的 Gamma Exposure 数据，包括 Net GEX、Gamma Flip、Call Wall、Put Wall",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "股票代码，如 SPY、QQQ、AAPL、TSLA、NVDA",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_market_data",
      description: "获取标的当前价格、IV、Put/Call Ratio 等市场数据",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "股票代码" },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_news",
      description:
        "获取与指定标的相关的最新新闻和重要推文，包括 Trump 推文、Bloomberg 消息",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "股票代码或主题词" },
          limit: { type: "number", description: "返回条数，默认 5" },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "evaluate_strategy",
      description: "评估期权策略的风险收益比，计算盈亏平衡点和最大收益/亏损",
      parameters: {
        type: "object",
        properties: {
          strategy: {
            type: "string",
            description: "策略名称，如 credit_put_spread、iron_condor、straddle",
          },
          symbol: { type: "string" },
          params: {
            type: "object",
            description: "策略参数，如行权价、到期日、权利金",
          },
        },
        required: ["strategy", "symbol"],
      },
    },
  },
];

// Tool execution — POC uses mock data
// Replace each function body with real API calls (FlashAlpha, Polygon.io, etc.)
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const symbol = (args.symbol as string)?.toUpperCase() ?? "SPY";

  switch (name) {
    case "get_gex_data":
      return JSON.stringify(mockGexData(symbol));

    case "get_market_data":
      return JSON.stringify(mockMarketData(symbol));

    case "get_recent_news":
      return JSON.stringify(mockNews(symbol));

    case "evaluate_strategy":
      return JSON.stringify(mockStrategyEval(args));

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ── Mock data (replace with real API calls) ──────────────────────────────────

function mockGexData(symbol: string) {
  const base: Record<string, object> = {
    SPY: {
      symbol: "SPY",
      net_gex: -0.4,
      net_gex_unit: "B",
      regime: "Negative Gamma",
      regime_zh: "负 Gamma 环境",
      gamma_flip: 543,
      call_wall: 555,
      put_wall: 535,
      max_pain: 545,
      updated_at: new Date().toISOString(),
      note: "做市商将顺势对冲，波动率扩张风险上升",
    },
    QQQ: {
      symbol: "QQQ",
      net_gex: 1.2,
      net_gex_unit: "B",
      regime: "Positive Gamma",
      regime_zh: "正 Gamma 环境",
      gamma_flip: 448,
      call_wall: 465,
      put_wall: 438,
      max_pain: 450,
      updated_at: new Date().toISOString(),
      note: "做市商做均值回归对冲，波动被压制",
    },
  };
  return (
    base[symbol] ?? {
      symbol,
      net_gex: 0.8,
      net_gex_unit: "B",
      regime: "Positive Gamma",
      regime_zh: "正 Gamma 环境",
      gamma_flip: 150,
      call_wall: 165,
      put_wall: 140,
      max_pain: 155,
      updated_at: new Date().toISOString(),
    }
  );
}

function mockMarketData(symbol: string) {
  const base: Record<string, object> = {
    SPY: { symbol: "SPY", price: 548.32, change_pct: -0.42, atm_iv: 18.5, iv_rank: 42, put_call_ratio: 0.92, volume: 82_000_000 },
    QQQ: { symbol: "QQQ", price: 452.18, change_pct: -0.31, atm_iv: 21.2, iv_rank: 38, put_call_ratio: 0.88, volume: 45_000_000 },
    AAPL: { symbol: "AAPL", price: 192.45, change_pct: 0.12, atm_iv: 24.5, iv_rank: 55, put_call_ratio: 0.74, volume: 62_000_000 },
    NVDA: { symbol: "NVDA", price: 138.72, change_pct: 1.84, atm_iv: 58.3, iv_rank: 72, put_call_ratio: 0.65, volume: 290_000_000 },
    TSLA: { symbol: "TSLA", price: 248.90, change_pct: -1.20, atm_iv: 68.1, iv_rank: 61, put_call_ratio: 0.81, volume: 120_000_000 },
  };
  return base[symbol] ?? { symbol, price: 100, change_pct: 0, atm_iv: 25, iv_rank: 50, put_call_ratio: 0.8 };
}

function mockNews(symbol: string) {
  return {
    symbol,
    items: [
      {
        source: "@DeItaone",
        time: "8 min ago",
        headline: `*BREAKING: Trump Signs Executive Order — New 35% Tariffs on Chinese Goods Effective Immediately`,
        sentiment: "bearish",
        is_trump_related: true,
        ai_summary: `关税消息推动风险资产承压，${symbol} 短期偏空，Put 需求可能激增。`,
      },
      {
        source: "Bloomberg",
        time: "22 min ago",
        headline: `Fed's Waller: Need "several months" of good data before rate cuts`,
        sentiment: "bearish",
        ai_summary: "鹰派表态打压降息预期，债券和股市短期承压。",
      },
      {
        source: "@SpotGamma",
        time: "35 min ago",
        headline: `${symbol} net GEX turning negative — expect vol expansion this afternoon`,
        sentiment: "bearish",
        ai_summary: "GEX 转负确认，做市商顺势对冲将放大波动。",
      },
    ],
  };
}

function mockStrategyEval(args: Record<string, unknown>) {
  return {
    strategy: args.strategy,
    symbol: args.symbol,
    recommended: true,
    confidence: 68,
    structure: "Sell 540P / Buy 535P，到期 5/2",
    max_profit: 185,
    max_loss: 315,
    breakeven: 538.15,
    reward_risk: "1:1.7",
    notes: ["当前 GEX 环境偏空，建议谨慎", "FOMC 会议前波动率可能上升", "建议仓位控制在账户的 2-3%"],
  };
}

// Type import for tool definition
import type OpenAI from "openai";
