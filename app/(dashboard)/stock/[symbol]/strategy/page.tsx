import StockStrategyPage from "@/components/stock/StockStrategyPage";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <StockStrategyPage symbol={symbol.trim().toUpperCase()} />;
}
