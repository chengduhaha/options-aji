import StockChainPage from "@/components/stock/StockChainPage";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <StockChainPage symbol={symbol.trim().toUpperCase()} />;
}
