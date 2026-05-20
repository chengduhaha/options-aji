/** MVP「期权选择框架」展示文案与 Expected Move 桶标签 */

export const EXPECTED_MOVE_BUCKET_ZH: Record<string, string> = {
  this_week: "本周到期",
  next_week: "下周窗口",
  monthly: "近月到期",
};

export function expectedMoveBucketLabel(bucket: string): string {
  return EXPECTED_MOVE_BUCKET_ZH[bucket] ?? bucket;
}

export function expectedMoveBucketHint(bucket: string): string {
  if (bucket === "this_week") {
    return "0–6 日内最近到期：ATM 跨式价格隐含的价格波动区间";
  }
  if (bucket === "next_week") {
    return "0–14 日内最近到期：略长窗口的预期波动";
  }
  if (bucket === "monthly") {
    return "近月（最长约 6 个月窗口内）到期：月度级隐含波动参考";
  }
  return "ATM Call + Put 跨式价格 ÷ 现价，表示期权市场隐含的预期波动幅度";
}

export const OPTION_FRAMEWORK_INTRO =
  "根据你选择的看多/看空方向，从该标的完整期权链中筛选近 60 日内、成交相对活跃的合约，便于对比行权价、流动性与 IV。右侧为不同到期窗口的隐含预期波动（Expected Move），不是异动榜单。";

export const OPTION_TABLE_LEGEND =
  "量/持仓 = 当日成交量 / 未平仓合约数（Open Interest），反映今日交易活跃度与存量持仓，非历史累计统计。";
