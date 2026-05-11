import StockOverviewPage from "@/components/stock/StockOverviewPage";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <StockOverviewPage symbol={symbol.trim().toUpperCase()} />;
}
