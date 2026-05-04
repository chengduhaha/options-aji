export default function LearnPage() {
  const courses = [
    {
      title: "期权基础与 Greeks",
      level: "入门",
      duration: "25 min",
      pro: false,
      summary: "认识 Call/Put、Delta/Gamma、时间价值与波动率的基本直觉。",
    },
    {
      title: "垂直价差与 Iron Condor",
      level: "进阶",
      duration: "40 min",
      pro: true,
      summary: "在卖方/买方框架下组合腿位，理解最大收益、最大亏损与胜率直觉。",
    },
    {
      title: "GEX、0DTE 与微观结构",
      level: "高级",
      duration: "55 min",
      pro: true,
      summary: "把 Net GEX、Gamma Flip 与做市商对冲路径读进交易节奏里（框架性内容）。",
    },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-semibold text-text">期权学院</h1>
        <p className="text-[13px] text-muted mt-1">
          课程体系持续扩充；以下为占位大纲，可后续接入视频与互动例题。
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => (
          <div key={c.title} className="bg-panel border border-border2 rounded-[12px] p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-text">{c.title}</h2>
              <span className="text-[10px] text-gold border border-border px-2 py-px rounded-full">
                {c.pro ? "Pro" : "Free"}
              </span>
            </div>
            <div className="text-[11px] text-muted">
              {c.level} · {c.duration}
            </div>
            <p className="text-[13px] text-muted leading-relaxed">{c.summary}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted text-center pb-6">
        教育内容不构成投资建议；实盘前请自行评估风险。
      </p>
    </div>
  );
}
