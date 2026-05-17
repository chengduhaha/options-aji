"use client";

import { useEffect, useState } from "react";

import { ScannerPage } from "@/components/cross-market/scanner/scanner-page";
import { Skeleton } from "@/components/ui/skeleton";
import { adaptBackendScannerRows, scanArbitrage } from "@/lib/crossMarket";
import type { ArbitrageOpportunity } from "@/lib/crossMarket";

export default function CrossMarketScannerPage() {
  const [rows, setRows] = useState<ArbitrageOpportunity[] | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const data = await scanArbitrage();
        if (c) return;
        setRows(adaptBackendScannerRows(data.opportunities));
      } catch {
        if (!c) setRows([]);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  if (rows === null) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-4 max-w-[1600px] mx-auto">
        <Skeleton className="h-16 w-full rounded-lg bg-secondary" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg bg-secondary" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg bg-secondary" />
      </div>
    );
  }

  return <ScannerPage opportunities={rows} />;
}
