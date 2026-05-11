import StockChrome from "@/components/stock/StockChrome";

export default async function StockLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const sym = symbol.trim().toUpperCase();
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <StockChrome symbol={sym} />
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
}
