import StockEarningsPage from "@/components/stock/StockEarningsPage";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <StockEarningsPage symbol={symbol.trim().toUpperCase()} />;
}
