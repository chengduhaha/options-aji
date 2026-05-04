import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border2 px-6 py-4 flex items-center justify-between">
        <div className="font-semibold text-gold">OptionsAji</div>
        <Link href="/" className="text-[13px] text-blue hover:underline">
          进入应用
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-6">
        <h1 className="text-3xl font-bold leading-tight">
          中文美股期权数据 + AI 分析
        </h1>
        <p className="text-[15px] text-muted leading-relaxed">
          市场总览、个股深度（7 大 Tab）、扫描器与信息流，一站式对齐专业终端常见工作流；AI
          分析师可叠加自然语言问数与解读。
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { t: "Free", p: "$0", d: "基础行情 / 延迟数据 / 有限 AI（规划）" },
            { t: "Pro", p: "$49/月", d: "全模块 + 更高频刷新 + 推送（规划）" },
            { t: "Alpha", p: "$149/月", d: "深度报告与优先支持（规划）" },
          ].map((x) => (
            <div key={x.t} className="bg-panel border border-border2 rounded-[12px] p-4">
              <div className="text-gold font-semibold">{x.t}</div>
              <div className="text-xl font-mono my-2">{x.p}</div>
              <p className="text-[12px] text-muted">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted">
          免责声明：本平台仅提供数据分析与教育内容，不构成投资建议。
        </p>
      </main>
    </div>
  );
}
