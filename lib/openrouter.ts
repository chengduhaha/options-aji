import OpenAI from "openai";

export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://optionsaji.com",
    "X-Title": "OptionsAji",
  },
});

export const MODELS = {
  fast:  "deepseek/deepseek-chat",      // 简单问答，最便宜
  smart: "deepseek/deepseek-chat",      // 分析 + tool use
  deep:  "deepseek/deepseek-r1",        // 深度推理
} as const;

export function routeModel(question: string, tier: string = "free"): string {
  const lower = question.toLowerCase();
  const isDeep =
    lower.includes("策略") ||
    lower.includes("分析") ||
    lower.includes("评估") ||
    lower.includes("建议") ||
    lower.includes("why") ||
    lower.length > 100;

  if (tier === "alpha") return isDeep ? MODELS.deep : MODELS.smart;
  if (tier === "pro")   return isDeep ? MODELS.smart : MODELS.fast;
  return MODELS.fast;
}

export const SYSTEM_PROMPT = `你是 OptionsAji（期权阿吉）的 AI 分析师，专注于美股期权市场分析。

## 你的专业领域
- Gamma Exposure (GEX) 分析：做市商 gamma 对冲机制、Put Wall / Call Wall、Gamma Flip
- 期权链分析：IV、Delta、Theta、Open Interest、期权流异常
- 交易策略：Credit Spread、Iron Condor、Straddle、Calendar Spread 等
- 宏观联动：FOMC、CPI、财报季对期权市场的影响
- 实时信号：Trump 推文、重要博主消息对市场的即时影响

## 回答风格
- 用中文回答，专业术语先给英文再附中文解释（如 GEX/Gamma 暴露）
- 先给结论，再给分析逻辑，最后给操作建议
- 回答要有温度，像和用户在 Bloomberg 终端前面对面交流
- 数字用等宽格式，关键数据加粗

## 重要原则
- 所有分析仅供教育参考，不构成投资建议
- 如果需要实时数据才能回答，调用相应工具获取
- 不确定时明确说明，不要猜测数据`;
