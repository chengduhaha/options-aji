import type OpenAI from "openai";

const API_BASE = (process.env.OPTIONS_AJI_BACKEND_URL ?? "").trim();
const API_KEY = process.env.OPTIONS_AJI_API_KEY ?? process.env.RAILWAY_API_KEY ?? "";

async function fetchBackend(path: string) {
  const res = await fetch(`${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`, {
    headers: { "X-API-Key": API_KEY },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
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
  {
    type: "function",
    function: {
      name: "scan_opportunities",
      description: "运行期权扫描器（高 Vol/OI 等预设），返回条目列表",
      parameters: {
        type: "object",
        properties: {
          preset: {
            type: "string",
            description: "high_vol_oi | high_iv_rank | low_iv_rank | otp",
          },
        },
        required: ["preset"],
      },
    },
  },
];

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const symbol = typeof args.symbol === "string" ? args.symbol.toUpperCase() : "SPY";

  try {
    switch (name) {
      case "get_gex_data": {
        const data = await fetchBackend(`/api/stock/${encodeURIComponent(symbol)}/gex`);
        return JSON.stringify({
          symbol: data.symbol,
          net_gex: data.netGex,
          regime: data.regime,
          gamma_flip: data.gammaFlip,
          call_wall: data.callWall,
          put_wall: data.putWall,
          max_pain: data.maxPain,
          updated_at: data.timestamp,
        });
      }
      case "get_market_data": {
        const data = await fetchBackend(`/market/${encodeURIComponent(symbol)}`);
        return JSON.stringify({
          symbol: data.symbol,
          price: data.price,
          change_pct: data.changePct,
          atm_iv: data.atmIv,
          iv_rank: data.ivRank,
          iv_percentile: data.ivPercentile,
          put_call_ratio: data.pcr,
          volume: data.volume,
          iv_methodology: data.ivMethodology,
        });
      }
      case "scan_opportunities": {
        if (!API_BASE) {
          return JSON.stringify({ error: "OPTIONS_AJI_BACKEND_URL not set" });
        }
        const preset = typeof args.preset === "string" ? args.preset : "high_vol_oi";
        const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/scanner/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
          },
          body: JSON.stringify({ preset, min_volume: 200, vol_oi_ratio: 2.5 }),
          cache: "no-store",
        });
        if (!res.ok) {
          return JSON.stringify({ error: `scanner ${res.status}` });
        }
        const j = (await res.json()) as { results?: unknown[]; count?: number };
        return JSON.stringify({ count: j.count, results: j.results?.slice(0, 15) });
      }
      case "get_recent_news":
        return JSON.stringify(mockNews(symbol));
      case "evaluate_strategy": {
        if (!API_BASE) {
          return JSON.stringify({ error: "OPTIONS_AJI_BACKEND_URL not set" });
        }
        const m = await fetchBackend(`/market/${encodeURIComponent(symbol)}`);
        const spot = Number(m.price ?? 0);
        if (!Number.isFinite(spot) || spot <= 0) {
          return JSON.stringify({ error: "invalid_spot", symbol });
        }
        const strat = typeof args.strategy === "string" ? args.strategy : "long_call";
        const params = (args.params as Record<string, unknown> | undefined) ?? {};
        const k = Number(params.strike ?? Math.round(spot));
        const k2 = Number(params.strike2 ?? Math.max(1, k - Math.max(1, spot * 0.02)));
        const prem = Number(params.premium ?? 2);
        const prem2 = Number(params.premium2 ?? 1);
        const dte = Number(params.days_to_expiry ?? 30);
        const iv = Number(params.iv ?? 0.35);

        const legs =
          strat === "credit_put_spread" || strat === "credit_spread"
            ? [
                {
                  side: "sell" as const,
                  option_type: "put" as const,
                  strike: k,
                  premium: prem,
                  contracts: 1,
                  days_to_expiry: dte,
                  iv,
                },
                {
                  side: "buy" as const,
                  option_type: "put" as const,
                  strike: k2,
                  premium: prem2,
                  contracts: 1,
                  days_to_expiry: dte,
                  iv,
                },
              ]
            : [
                {
                  side: "buy" as const,
                  option_type: "call" as const,
                  strike: k,
                  premium: prem,
                  contracts: 1,
                  days_to_expiry: dte,
                  iv,
                },
              ];

        const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/strategy/evaluate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
          },
          body: JSON.stringify({
            symbol,
            spot,
            legs,
          }),
          cache: "no-store",
        });
        if (!res.ok) {
          return JSON.stringify({ error: `evaluate ${res.status}`, body: await res.text() });
        }
        return JSON.stringify(await res.json());
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "tool_failed";
    return JSON.stringify({ error: msg });
  }
}

function mockNews(sym: string) {
  return {
    symbol: sym,
    items: [
      {
        source: "@DeItaone",
        time: "示例",
        headline: "（演示）请接入新闻源后替换为实时标题。",
        sentiment: "neutral",
        ai_summary: "占位：可对接 Benzinga/OpenBB news provider。",
      },
    ],
  };
}

