"use client";

import { useEffect, useState } from "react";

type CheckState = "pending" | "ok" | "error";

interface CheckResult {
  name: string;
  state: CheckState;
  detail: string;
}

async function checkEndpoint(path: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    const body = await res.text();
    return {
      ok: res.ok,
      detail: res.ok ? `HTTP ${res.status}` : `HTTP ${res.status} · ${body.slice(0, 120)}`,
    };
  } catch (error: unknown) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : "network_error";
    return { ok: false, detail };
  }
}

export default function DeploymentHealthPage() {
  const [checks, setChecks] = useState<CheckResult[]>([
    { name: "后端集成状态", state: "pending", detail: "检查中..." },
    { name: "市场总览接口", state: "pending", detail: "检查中..." },
    { name: "统一信息流接口", state: "pending", detail: "检查中..." },
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [integration, overview, feed] = await Promise.all([
        checkEndpoint("/api/integration/status"),
        checkEndpoint("/api/market/overview"),
        checkEndpoint("/api/feed/unified?limit=1"),
      ]);
      if (cancelled) return;
      setChecks([
        {
          name: "后端集成状态",
          state: integration.ok ? "ok" : "error",
          detail: integration.detail,
        },
        {
          name: "市场总览接口",
          state: overview.ok ? "ok" : "error",
          detail: overview.detail,
        },
        {
          name: "统一信息流接口",
          state: feed.ok ? "ok" : "error",
          detail: feed.detail,
        },
      ]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto space-y-4 text-[13px]">
      <header>
        <h1 className="text-[18px] font-semibold text-text">部署健康检查</h1>
        <p className="text-muted mt-1">
          用于验证 Vercel 前端是否可以稳定访问本地 FastAPI 后端代理链路。
        </p>
      </header>

      <section className="rounded-[10px] border border-border2 bg-panel2 p-4 space-y-3">
        {checks.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-md border border-border2 bg-bg/60 px-3 py-2"
          >
            <div>
              <div className="text-text font-medium">{item.name}</div>
              <div className="text-[11px] text-muted">{item.detail}</div>
            </div>
            <div
              className={
                item.state === "ok"
                  ? "text-[11px] text-green"
                  : item.state === "error"
                    ? "text-[11px] text-red"
                    : "text-[11px] text-muted"
              }
            >
              {item.state === "ok" ? "正常" : item.state === "error" ? "异常" : "检查中"}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[10px] border border-border2 bg-panel2 p-4 text-[12px] text-muted space-y-1.5">
        <p>建议生产启用以下环境变量：</p>
        <p>- `OPTIONS_AJI_REQUIRE_HTTPS_BACKEND=1`</p>
        <p>- `OPTIONS_AJI_BACKEND_TIMEOUT_MS=25000`</p>
        <p>- 后端 `CORS_ORIGINS` 仅允许你的前端域名列表</p>
      </section>
    </div>
  );
}
