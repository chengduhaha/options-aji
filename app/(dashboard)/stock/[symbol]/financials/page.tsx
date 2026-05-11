import StockFinancialsPage from "@/components/stock/StockFinancialsPage";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <StockFinancialsPage symbol={symbol.trim().toUpperCase()} />;
}
