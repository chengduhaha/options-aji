"use client";

type StrikeData = {
  strike: number;
  callGex: number;
  putGex: number;
  net: number;
  gamma: number;
  oi: number;
  iv: number;
};

export default function GexChart({ ticker, strikes, price }: { ticker: string; strikes: StrikeData[]; price: number }) {
  if (!strikes || strikes.length === 0) return null;

  const W = 700, H = 260, PL = 48, PR = 20, PT = 10, PB = 30;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  // Sort by strike ascending for chart rendering
  const sorted = [...strikes].sort((a, b) => a.strike - b.strike);

  const maxGex = Math.max(...sorted.map((s) => Math.max(s.callGex, s.putGex)), 0.1);
  const barW = chartW / sorted.length - 1;

  const toY = (val: number) => {
    if (val >= 0) return chartH / 2 - (val / maxGex) * (chartH / 2 - 4);
    return chartH / 2 + (Math.abs(val) / maxGex) * (chartH / 2 - 4);
  };

  const toX = (i: number) => PL + i * (chartW / sorted.length) + barW / 2;

  const strikeToX = (strike: number) => {
    const idx = sorted.findIndex((s) => s.strike >= strike);
    if (idx <= 0) return PL;
    const frac = (strike - sorted[idx - 1].strike) / (sorted[idx].strike - sorted[idx - 1].strike);
    return PL + ((idx - 1 + frac) / sorted.length) * chartW;
  };

  const midY = PT + chartH / 2;

  const refLines = [
    { val: price, color: "#D4AF37", dash: "5,3", label: `${ticker} $${price.toFixed(2)}` },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="min-w-[500px]"
      >
        {/* Y axis labels */}
        {[1, 0.5, 0, -0.5, -1].map((v) => {
          const y = PT + chartH / 2 - (v / 1) * (chartH / 2 - 4);
          return (
            <g key={v}>
              <line x1={PL - 3} y1={y} x2={PL + chartW} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#8B8D97">
                {(v * maxGex).toFixed(1)}B
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {sorted.map((s, i) => {
          const x = toX(i) - barW / 2;
          const callH = Math.abs(toY(s.callGex) - midY);
          const putH = Math.abs(toY(s.putGex) - midY);
          return (
            <g key={s.strike}>
              {s.callGex > 0.001 && (
                <rect x={x} y={midY - callH} width={barW} height={callH}
                  fill="#00D4AA" fillOpacity={0.75} rx="1" />
              )}
              {s.putGex > 0.001 && (
                <rect x={x} y={midY} width={barW} height={putH}
                  fill="#FF6B6B" fillOpacity={0.75} rx="1" />
              )}
            </g>
          );
        })}

        {/* Reference lines */}
        {refLines.map((rl) => {
          const x = strikeToX(rl.val);
          return (
            <g key={rl.label}>
              <line
                x1={x} y1={PT} x2={x} y2={PT + chartH}
                stroke={rl.color} strokeWidth="1.2"
                strokeDasharray={rl.dash}
                strokeOpacity={0.85}
              />
              <text x={x + 3} y={PT + 10} fontSize="9" fill={rl.color} fontFamily="JetBrains Mono, monospace">
                {rl.label}
              </text>
            </g>
          );
        })}

        {/* Zero line */}
        <line x1={PL} y1={midY} x2={PL + chartW} y2={midY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

        {/* X axis labels (every 5th strike) */}
        {sorted.filter((_, i) => i % 5 === 0).map((s) => {
          const x = toX(sorted.indexOf(s));
          return (
            <text key={s.strike} x={x} y={PT + chartH + 16} textAnchor="middle" fontSize="9" fill="#8B8D97" fontFamily="JetBrains Mono, monospace">
              {s.strike.toFixed(0)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
