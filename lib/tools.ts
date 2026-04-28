import type OpenAI from "openai";

const API_BASE = process.env.RAILWAY_API_URL || "http://localhost:8000";
const API_KEY = process.env.RAILWAY_API_KEY || "dev-key-change-me";

async function fetchBackend(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "X-API-Key": API_KEY },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }
  return res.json();
}

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

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const symbol = (args.symbol as string)?.toUpperCase() ?? "SPY";

  switch (name) {
    case "get_gex_data": {
      try {
        const data = await fetchBackend(`/gex/${symbol}`);
        return JSON.stringify({
          symbol: data.symbol,
          net_gex: data.netGex,
          net_gex_unit: "B",
          regime: data.regime,
          regime_zh: data.regime === "Positive Gamma" ? "正 Gamma 环境" : "负 Gamma 环境",
          gamma_flip: data.gammaFlip,
          call_wall: data.callWall,
          put_wall: data.putWall,
          max_pain: data.maxPain,
          updated_at: data.timestamp,
          note: `${data.symbol} 当前处于${data.regime}，Call Wall ${data.callWall}，Put Wall ${data.putWall}。`,
        });
      } catch (e: any) {
        return JSON.stringify({ error: `GEX data unavailable: ${e.message}` });
      }
    }

    case "get_market_data": {
      try {
        const data = await fetchBackend(`/market/${symbol}`);
        return JSON.stringify({
          symbol: data.symbol,
          price: data.price,
          change_pct: data.changePct,
          atm_iv: data.atmIv,
          iv_rank: data.ivRank,
          put_call_ratio: data.pcr,
          volume: data.volume,
        });
      } catch (e: any) {
        return JSON.stringify({ error: `Market data unavailable: ${e.message}` });
      }
    }

    case "get_recent_news":
      return JSON.stringify(mockNews(symbol));

    case "evaluate_strategy":
      return JSON.stringify(mockStrategyEval(args));

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
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
