"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, GraduationCap, BookMarked, FlaskConical, Lock } from "lucide-react";
import { clsx } from "clsx";

const SECTIONS = [
  {
    title: "期权基础",
    icon: GraduationCap,
    free: true,
    articles: [
      {
        title: "什么是期权？",
        content: `期权是一种合约，赋予持有人在特定日期或之前以特定价格买入或卖出标的资产的权利，但没有义务。

核心概念：
• Call（看涨期权）：买入标的的权利
• Put（看跌期权）：卖出标的的权利
• Strike（行权价）：合约约定的买卖价格
• Expiration（到期日）：合约失效的日期
• Premium（权利金）：买入期权需要支付的价格

类比：期权就像买保险。你支付保费（权利金），获得在出事时索赔的权利，但没有索赔义务。`,
      },
      {
        title: "期权 Greeks 详解",
        content: `Greeks 是衡量期权价格对不同因素敏感度的指标：

Δ Delta（方向）
衡量期权价格对标的物价格变化的敏感度。
• Call Delta: 0~1，平值约 0.5
• Put Delta: -1~0，平值约 -0.5
• 例：Delta 0.5 表示标的涨 $1，期权涨 $0.5

Γ Gamma（加速度）
衡量 Delta 对标的物价格变化的敏感度。
• 平值期权的 Gamma 最高
• 临近到期的平值期权 Gamma 急剧增大
• 高 Gamma 意味着风险敞口变化快

Θ Theta（时间衰减）
衡量期权价格随时间的流失速度。
• 买方亏损 Theta（每天赔时间价值）
• 卖方赚取 Theta（每天收时间价值）
• 最后 30 天 Theta 衰减加速

V（Vega（波动率敏感度）
衡量期权价格对隐含波动率变化的敏感度。
• 高 Vega = 受 IV 变化影响大
• 财报前 Vega 通常较高
• Long Straddle 做多 Vega，Short Straddle 做空 Vega`,
      },
      {
        title: "隐含波动率 (IV) 与 IV Rank",
        content: `隐含波动率 (IV) 是市场对未来波动率的预期，由期权价格反过来推算得出。

IV 的意义：
• 高 IV → 期权贵 → 适合卖方策略
• 低 IV → 期权便宜 → 适合买方策略
• IV 通常在财报、宏观事件前升高，事件后回落（IV Crush）

IV Rank：
• IV Rank 衡量当前 IV 在过去 N 天中的百分位排名
• IV Rank > 70% → IV 偏高，适合卖期权
• IV Rank < 30% → IV 偏低，适合买期权
• 例：SPY 当前 IV Rank 45%，表示当前 IV 在过去一年中处于中等水平`,
      },
    ],
  },
  {
    title: "常见策略",
    icon: BookMarked,
    free: true,
    articles: [
      {
        title: "Covered Call（持股卖出 Call）",
        content: `适用场景：持有正股，认为短期不会大涨，想增加收益

构建方式：
• 持有 100 股正股
• 卖出 1 张 Call（通常选虚值）

盈亏特征：
• 最大收益：权利金 + (行权价 - 买入价) × 100
• 最大亏损：正股跌到 0 的风险
• 盈亏平衡：买入价 - 权利金

策略优势：
• 在震荡市增加持仓收益
• 下行保护有限（权利金收入）

风险提示：
• 大涨时机会成本（正股被 call 走）
• 仅适合中长期持股者`,
      },
      {
        title: "Cash-Secured Put（现金担保卖出 Put）",
        content: `适用场景：想以更低价格买入正股，同时赚取权利金

构建方式：
• 卖出 1 张 Put
• 账户需保留足够的现金（行权价 × 100）

盈亏特征：
• 最大收益：权利金（Put 过期归零）
• 最大亏损：行权价 × 100 - 权利金
• 盈亏平衡：行权价 - 权利金

核心逻辑：
• 相当于"限价买单 + 收租金"
• 行权时以目标价买入正股（已打折扣）
• 未行权时白赚权利金`,
      },
      {
        title: "Iron Condor（铁鹰策略）",
        content: `适用场景：预期标的将窄幅震荡，波动不大

构建方式：
• 卖出较低行权价的 Put Spread
• 卖出较高行权价的 Call Spread
• 四个合约形成"铁鹰"形状

盈亏特征：
• 最大收益：收到的净权利金
• 最大亏损：两个 Spread 之间的宽度 - 净权利金
• 胜率较高，但盈亏比一般

最佳使用条件：
• IV 偏高时（权利金收入更多）
• 财报后、重大事件后
• 市场方向不明时`,
      },
      {
        title: "Bull Call Spread（牛市 Call 价差）",
        content: `适用场景：温和看涨，想控制成本

构建方式：
• 买入 1 张较低行权的 Call
• 卖出 1 张较高行权的 Call
• 同到期日

盈亏特征：
• 最大收益：(高行权 - 低行权) × 100 - 净权利金
• 最大亏损：净权利金支出
• 盈亏平衡：低行权 + 净权利金

优点 vs 直接买 Call：
• 成本更低（卖出 Call 的权利金补贴买入）
• 有上限但方向判断正确的收益仍可观
• 时间衰减影响较小`,
      },
    ],
  },
  {
    title: "进阶概念",
    icon: FlaskConical,
    free: false,
    articles: [
      {
        title: "Gamma Exposure (GEX) 深入理解",
        content: `Gamma Exposure（GEX）衡量做市商需要对冲的 Gamma 风险。

净 GEX = Call GEX - Put GEX

正 Gamma 环境（Net GEX > 0）：
• 做市商低买高卖 → 抑制波动
• 市场更"平滑"，趋势延续性差
• 适合区间震荡策略

负 Gamma 环境（Net GEX < 0）：
• 做市商追涨杀跌 → 放大波动
• 市场更容易"失控"
• 适合趋势跟踪策略

Gamma Flip：Net GEX 从正转负的价位
• 这是做市商行为反转的关键点位
• Flip 以下市场更不稳定`,
      },
      {
        title: "Max Pain 理论与应用",
        content: `Max Pain 是使所有期权买方总亏损最大的价格水平。

核心逻辑：
• 期权是零和游戏
• 买方赚钱 = 卖方亏钱
• Max Pain 是让最多期权过期归零的价格

如何计算：
• 每个行权价：Call 持有者收益 + Put 持有者收益
• Max Pain = 总收益最小的价格

实战意义：
• 临近到期时价格倾向于向 Max Pain 靠拢
• 大行权日（OPEX）前后尤为明显
• 不是精确预测，而是概率偏向`,
      },
      {
        title: "Put/Call Ratio 解读",
        content: `Put/Call Ratio 是 Put 成交量除以 Call 成交量。

PCR > 1：Put 比 Call 活跃
• 市场偏谨慎/看跌
• 极端高 PCR 可能是反向买入信号

PCR < 0.7：Call 比 Put 活跃
• 市场偏乐观/看涨
• 极端低 PCR 需警惕回调风险

不同类型的 PCR：
• 成交量 PCR（Volume PCR）：日内情绪指标
• 持仓量 PCR（OI PCR）：机构持仓偏好
• 股票 PCR vs 指数 PCR：指数 PCR 更可靠`,
      },
    ],
  },
];

export default function LearnPage() {
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [openArticle, setOpenArticle] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-5 py-4 border-b border-glass-border glass flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">期权学院</h1>
            <p className="text-[11px] text-muted">从入门到精通，系统学习期权交易知识</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {SECTIONS.map((section, si) => {
          const isOpen = openSection === si;
          const Icon = section.icon;
          return (
            <div key={section.title} className="glass rounded-xl border border-glass-border overflow-hidden">
              {/* Section header */}
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : si)}
                className="flex items-center gap-3 w-full px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className={clsx(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  section.free ? "bg-primary/20" : "bg-muted/20",
                )}>
                  <Icon className={clsx("w-4 h-4", section.free ? "text-primary" : "text-muted")} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-foreground">{section.title}</span>
                    {!section.free && (
                      <span className="text-[9px] text-muted bg-muted/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Pro
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted">{section.articles.length} 篇文章</span>
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
              </button>

              {/* Article list */}
              {isOpen && (
                <div className="px-5 pb-4 space-y-2">
                  {section.articles.map((article, ai) => {
                    const isArticleOpen = openArticle === ai && openSection === si;
                    return (
                      <div key={article.title} className="rounded-lg border border-glass-border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenArticle(isArticleOpen ? null : ai)}
                          className={clsx(
                            "flex items-center gap-2 w-full px-4 py-3 text-left transition-colors text-[12px]",
                            isArticleOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.02]",
                          )}
                        >
                          <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-medium">{article.title}</span>
                          <span className="ml-auto text-[10px] text-muted">
                            {isArticleOpen ? "收起" : "阅读"}
                          </span>
                        </button>
                        {isArticleOpen && (
                          <div className="px-4 pb-4 pt-2 text-[13px] text-foreground leading-relaxed whitespace-pre-wrap border-t border-glass-border">
                            {article.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <p className="text-[10px] text-muted text-center pb-6">
          教育内容仅供学习参考，不构成投资建议。实盘交易前请自行评估风险。
        </p>
      </div>
    </div>
  );
}