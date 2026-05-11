"use client";

const TREND_DAYS = ["4/21", "4/22", "4/23", "4/24", "4/25", "4/26", "4/27"];

function trendData(isPositive: boolean) {
  if (isPositive) return [0.8, 1.2, 1.8, 1.4, 2.1, 1.9, 2.3];
  return [1.2, 0.6, 0.1, -0.2, -0.4, -0.6, -0.4];
}

export default function GexTrendChart({ isPositive }: { ticker: string; isPositive: boolean }) {
  const data = trendData(isPositive);
  const W = 340, H = 140, PL = 40, PR = 10, PT = 10, PB = 24;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const max = Math.max(...data.map(Math.abs), 0.1);
  const zero = PT + chartH * (max / (max * 2));

  const toX = (i: number) => PL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => zero - (v / max) * (chartH / 2 - 4);

  const pts = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const color = isPositive ? "#00D4AA" : "#FF6B6B";

  const areaPath = `M${toX(0)},${toY(data[0])} ` +
    data.slice(1).map((v, i) => `L${toX(i + 1)},${toY(v)}`).join(" ") +
    ` L${toX(data.length - 1)},${zero} L${toX(0)},${zero} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="trend-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Zero line */}
      <line x1={PL} y1={zero} x2={PL + chartW} y2={zero} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

      {/* Y labels */}
      {[max, 0, -max].map((v) => (
        <text key={v} x={PL - 4} y={toY(v) + 4} textAnchor="end" fontSize="9" fill="#8B8D97">
          {v >= 0 ? "+" : ""}{v.toFixed(1)}B
        </text>
      ))}

      {/* Area */}
      <path d={areaPath} fill="url(#trend-g)" />

      {/* Line */}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />

      {/* Dots */}
      {data.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="2.5" fill={color} />
      ))}

      {/* Regime change annotation */}
      {!isPositive && (
        <g>
          <line x1={toX(2)} y1={PT} x2={toX(2)} y2={PT + chartH} stroke="rgba(212,175,55,0.4)" strokeWidth="1" strokeDasharray="3,2" />
          <text x={toX(2) + 3} y={PT + 10} fontSize="8.5" fill="#D4AF37">Regime↓</text>
        </g>
      )}

      {/* X labels */}
      {TREND_DAYS.map((d, i) => (
        <text key={d} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#8B8D97">
          {d}
        </text>
      ))}
    </svg>
  );
}
