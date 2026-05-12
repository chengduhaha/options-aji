"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function StrategyPage() {
  const router = useRouter();
  const [sym, setSym] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const s = sym.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.\-]{0,11}$/.test(s)) return;
    router.push(`/stock/${encodeURIComponent(s)}/strategy`);
  };

  return (
    <div className="flex flex-col items-center justify-start h-full p-8 space-y-6 overflow-y-auto">
      <div className="max-w-md w-full space-y-2 text-center">
        <h1 className="text-lg font-semibold text-text">期权策略评估</h1>
        <p className="text-[13px] text-muted leading-relaxed">
          请输入标的代码，进入该股「策略」页：可添加多腿合约并使用 Mid 价与 IV 试算收益与风险。也可在
          期权链页面点击行权旁的{" "}
          <span className="text-gold font-mono text-[12px]">C</span>/
          <span className="text-gold font-mono text-[12px]">P</span>{" "}
          预填开仓。
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="flex flex-wrap gap-2 items-center justify-center w-full max-w-md"
      >
        <input
          value={sym}
          onChange={(e) => setSym(e.target.value.toUpperCase())}
          placeholder="例如 AAPL"
          className="flex-1 min-w-[140px] bg-panel border border-border2 text-[13px] px-3 py-2 rounded-[8px] font-mono uppercase"
          maxLength={16}
          autoCapitalize="characters"
          autoCorrect="off"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-[8px] bg-gold/90 text-[#0A1628] text-[13px] font-semibold hover:bg-gold"
        >
          打开策略页
        </button>
      </form>
      <p className="text-[11px] text-muted max-w-md text-center">
        说明：本平台仅提供数据与教育用途，不构成投资建议。
      </p>
      <div className="text-[12px] text-muted">
        快速入口：{" "}
        {["SPY", "QQQ", "NVDA"].map((t) => (
          <Link
            key={t}
            href={`/stock/${t}/strategy`}
            className="text-blue hover:underline mx-1 font-mono"
          >
            {t}
          </Link>
        ))}
      </div>
    </div>
  );
}
