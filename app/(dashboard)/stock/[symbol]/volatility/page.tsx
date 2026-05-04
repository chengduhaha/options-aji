import StockVolatilityPage from "@/components/stock/StockVolatilityPage";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <StockVolatilityPage symbol={symbol.trim().toUpperCase()} />;
}
