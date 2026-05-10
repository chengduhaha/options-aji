"use client";

import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export interface AgentTable {
  headers: string[];
  rows: string[][];
}

export interface AgentChart {
  type: "bar" | "line" | "area";
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  yLabels?: string[];
  colors?: string[];
}

export interface AgentCards {
  items: { label: string; value: string; color?: string }[];
}

export type StructuredData = {
  table?: AgentTable;
  chart?: AgentChart;
  cards?: AgentCards;
};

const CHART_COLORS = ["#f0b429", "#3b82f6", "#10b981", "#ef4444", "#a855f7", "#22d3ee"];

export default function StructuredOutput({ data }: { data: StructuredData }) {
  return (
    <div className="space-y-4 mt-3">
      {data.cards && <CardsSection cards={data.cards} />}
      {data.chart && <ChartSection chart={data.chart} />}
      {data.table && <TableSection table={data.table} />}
    </div>
  );
}

function CardsSection({ cards }: { cards: AgentCards }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {cards.items.map((item, i) => (
        <div key={i} className="bg-glass border border-glass-border rounded-lg px-3 py-2.5 text-center">
          <div className="text-[9px] text-muted uppercase tracking-wider mb-1">{item.label}</div>
          <div className={`text-[16px] font-mono font-bold ${item.color ?? "text-foreground"}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartSection({ chart }: { chart: AgentChart }) {
  const colors = chart.colors ?? CHART_COLORS;
  if (chart.data.length === 0) return null;

  const shared = (key: string, i: number) => ({
    dataKey: key,
    stroke: colors[i % colors.length],
    fill: colors[i % colors.length],
    name: chart.yLabels?.[i] ?? key,
  });

  return (
    <div className="bg-glass border border-glass-border rounded-xl p-3">
      <ResponsiveContainer width="100%" height={180}>
        {chart.type === "bar" ? (
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={chart.xKey} tick={{ fontSize: 9, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 9, fill: "#64748b" }} width={36} />
            <Tooltip contentStyle={{ background: "#0f1c30", border: "1px solid rgba(240,180,41,0.2)", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
            {chart.yKeys.map((key, i) => <Bar key={key} {...shared(key, i)} />)}
          </BarChart>
        ) : chart.type === "area" ? (
          <AreaChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={chart.xKey} tick={{ fontSize: 9, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 9, fill: "#64748b" }} width={36} />
            <Tooltip contentStyle={{ background: "#0f1c30", border: "1px solid rgba(240,180,41,0.2)", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
            {chart.yKeys.map((key, i) => <Area key={key} type="monotone" fillOpacity={0.2} {...shared(key, i)} />)}
          </AreaChart>
        ) : (
          <LineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={chart.xKey} tick={{ fontSize: 9, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 9, fill: "#64748b" }} width={36} />
            <Tooltip contentStyle={{ background: "#0f1c30", border: "1px solid rgba(240,180,41,0.2)", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
            {chart.yKeys.map((key, i) => <Line key={key} type="monotone" dot={false} {...shared(key, i)} />)}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function TableSection({ table }: { table: AgentTable }) {
  return (
    <div className="bg-glass border border-glass-border rounded-xl overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-glass-border text-muted">
            {table.headers.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-glass-border">
          {table.rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-white/[0.02]">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5 font-mono text-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Parse structured data blocks from AI response text.
 */
export function parseStructuredData(text: string): { cleanText: string; data?: StructuredData } {
  const jsonBlockRegex = /```json\s*({[\s\S]*?})\s*```/g;
  const match = jsonBlockRegex.exec(text);
  if (!match) return { cleanText: text };
  try {
    const parsed = JSON.parse(match[1]) as StructuredData;
    return { cleanText: text.replace(match[0], "").trim(), data: parsed };
  } catch {
    return { cleanText: text };
  }
}