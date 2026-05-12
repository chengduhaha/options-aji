"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

export type TourStep = { title: string; content: string };

export default function TourOverlay({
  pageKey,
  steps,
}: {
  pageKey: string;
  steps: TourStep[];
}) {
  const storageKey = `tour_${pageKey}_seen`;
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(storageKey)) setOpen(true);
  }, [storageKey]);

  if (!open || steps.length === 0) return null;

  const step = steps[idx]!;

  const finish = () => {
    if (typeof window !== "undefined") localStorage.setItem(storageKey, "1");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="bg-panel2 border border-gold/30 rounded-xl p-5 max-w-sm w-full shadow-xl space-y-3">
        <div className="text-sm font-semibold text-gold">新手引导 ({idx + 1}/{steps.length})</div>
        <div>
          <div className="text-[14px] font-medium text-text mb-1">{step.title}</div>
          <p className="text-[13px] text-muted leading-relaxed">{step.content}</p>
        </div>
        <div className="flex justify-between gap-2 pt-2">
          <button
            type="button"
            className="text-[12px] px-3 py-1.5 rounded-md border border-border2 text-muted"
            onClick={finish}
          >
            Skip
          </button>
          <div className="flex gap-2">
            {idx > 0 && (
              <button
                type="button"
                className="text-[12px] px-3 py-1.5 rounded-md border border-border2 text-muted"
                onClick={() => setIdx((i) => Math.max(i - 1, 0))}
              >
                上一步
              </button>
            )}
            <button
              type="button"
              className={clsx(
                "text-[12px] px-3 py-1.5 rounded-md border",
                idx >= steps.length - 1 ? "border-gold text-gold" : "border-border2 text-text",
              )}
              onClick={() => {
                if (idx >= steps.length - 1) finish();
                else setIdx((i) => Math.min(i + 1, steps.length - 1));
              }}
            >
              {idx >= steps.length - 1 ? "完成" : "下一步"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
