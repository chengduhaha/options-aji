"use client";

import { useMemo } from "react";

type GexData = {
  price: number;
  flip: number;
  callWall: number;
  putWall: number;
};

function generateStrikes(price: number, count = 30) {
  const step = price > 400 ? 5 : price > 100 ? 2.5 : 1;
  const center = Math.round(price / step) * step;
  const strikes = [];
  for (let i = -Math.floor(count / 2); i <= Math.floor(count / 2); i++) {
    const strike = center + i * step;
    const dist = Math.abs(strike - price) / price;
    const callGex = Math.max(0, (1.5 - dist * 12) + (Math.random() - 0.4) * 0.8);
    const putGex  = Math.min(0, -(1.2 - dist * 10) + (Math.random() - 0.6) * 0.6);
    strikes.push({ strike, callGex, putGex });
  }
  return strikes;
}

export default function GexChart({ ticker, data }: { ticker: string; data: GexData }) {
  const strikes = useMemo(() => generateStrikes(data.price), [ticker]);

  const W = 700, H = 260, PL = 48, PR = 20, PT = 10, PB = 30;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const maxGex = Math.max(...strikes.map((s) => Math.abs(s.callGex)), ...strikes.map((s) => Math.abs(s.putGex)), 0.1);
  const barW = chartW / strikes.length - 1;

  const toY = (val: number) => {
    if (val >= 0) return chartH / 2 - (val / maxGex) * (chartH / 2 - 4);
    return chartH / 2 + (Math.abs(val) / maxGex) * (chartH / 2 - 4);
  };

  const toX = (i: number) => PL + i * (chartW / strikes.length) + barW / 2;

  const strikeToX = (strike: number) => {
    const idx = strikes.findIndex((s) => s.strike >= strike);
    if (idx < 0) return PL + chartW;
    const frac = (strike - strikes[idx - 1]?.strike) / ((strikes[idx]?.strike ?? strike) - (strikes[idx - 1]?.strike ?? strike - 1));
    return PL + ((idx - 1 + frac) / strikes.length) * chartW;
  };

  const midY = PT + chartH / 2;

  const refLines = [
    { val: data.price,    color: "#D4AF37", dash: "5,3", label: `${ticker} $${data.price.toFixed(2)}` },
    { val: data.flip,     color: "#D4AF37", dash: "0",   label: `γ Flip: ${data.flip}` },
    { val: data.callWall, color: "#00D4AA", dash: "5,3", label: `Call Wall: ${data.callWall}` },
    { val: data.putWall,  color: "#FF6B6B", dash: "5,3", label: `Put Wall: ${data.putWall}` },
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
        {strikes.map((s, i) => {
          const x = toX(i) - barW / 2;
          const callH = Math.abs(toY(s.callGex) - midY);
          const putH  = Math.abs(toY(s.putGex)  - midY);
          return (
            <g key={s.strike}>
              {s.callGex > 0.02 && (
                <rect x={x} y={midY - callH} width={barW} height={callH}
                  fill="#00D4AA" fillOpacity={0.75} rx="1" />
              )}
              {s.putGex < -0.02 && (
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
        {strikes.filter((_, i) => i % 5 === 0).map((s, i, arr) => {
          const x = toX(strikes.indexOf(s));
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
