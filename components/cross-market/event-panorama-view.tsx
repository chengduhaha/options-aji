"use client";

import { useEffect, useState } from "react";
import { EventHeader } from "./event-header";
import { ProbabilityPanorama } from "./probability-panorama";
import { AiNarrativeCard } from "./ai-narrative-card";
import { ProbabilityTimeSeries } from "./probability-timeseries";
import { StrategyExecutionCard } from "./strategy-execution-card";
import { DataFooter } from "./data-footer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adaptHotEventToPanorama,
  getHotEvents,
  type EventPanoramaViewModel,
  type HotEvent,
} from "@/lib/crossMarket";

function PanoramaSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background terminal-grid px-4 py-6 max-w-[1600px] mx-auto w-full space-y-6">
      <Skeleton className="h-28 w-full rounded-xl bg-secondary" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl bg-secondary" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl bg-secondary" />
    </div>
  );
}

export function EventPanoramaView({ eventIdParam }: { eventIdParam: string }) {
  const decodedId = decodeURIComponent(eventIdParam);
  const [vm, setVm] = useState<EventPanoramaViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { events } = await getHotEvents();
        if (cancelled) return;
        let picked: HotEvent | undefined = events.find((e) => e.event_id === decodedId);
        if (!picked && events.length > 0) {
          picked = events[0];
        }
        if (!picked) {
          setError("未获取到事件数据，请稍后重试。");
          setVm(null);
          return;
        }
        setVm(adaptHotEventToPanorama(picked));
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "加载失败");
          setVm(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [decodedId]);

  if (error && !vm) {
    return (
      <div className="min-h-screen flex flex-col bg-background terminal-grid items-center justify-center p-8">
        <p className="text-destructive text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!vm) {
    return (
      <div className="min-h-screen flex flex-col bg-background terminal-grid">
        <PanoramaSkeleton />
      </div>
    );
  }

  const h = vm.header;

  return (
    <div className="min-h-screen flex flex-col bg-background terminal-grid">
      <EventHeader
        badgeLabel={h.badgeLabel}
        titleText={h.titleText}
        metaTicker={h.metaTicker}
        eventTimeDisplay={h.eventTimeDisplay}
        settlementNote={h.settlementNote}
        countdownPrimary={h.countdownPrimary}
        countdownSub={h.countdownSub}
        showArbitragePill={h.showArbitragePill}
      />

      <main className="flex-1 px-4 md:px-6 py-6 max-w-[1600px] mx-auto w-full">
        <div className="space-y-8">
          <ProbabilityPanorama
            sources={vm.panorama.sources}
            aiConsensusPercent={vm.panorama.aiConsensusPercent}
            disagreementPp={vm.panorama.disagreementPp}
            arbitrationHeadline={vm.panorama.arbitrationHeadline}
            arbitrationDetail={vm.panorama.arbitrationDetail}
            arbitrationStrengthLabel={vm.panorama.arbitrationStrengthLabel}
          />

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
            <AiNarrativeCard {...vm.narrative} />
            <ProbabilityTimeSeries data={vm.timeSeries} />
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-[#3DBF7A]" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                跨市场执行建议
              </h2>
            </div>
            <StrategyExecutionCard legs={vm.strategyLegs} summary={vm.strategySummary} />
          </section>
        </div>
      </main>

      <DataFooter />
    </div>
  );
}
