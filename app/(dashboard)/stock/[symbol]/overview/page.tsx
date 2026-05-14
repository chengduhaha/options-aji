import StockOverviewPage from "@/components/stock/StockOverviewPage";

export default async function StockOverviewRoute({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return <StockOverviewPage symbol={symbol.toUpperCase()} />;
}
