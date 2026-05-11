import StockGexPage from "@/components/stock/StockGexPage";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <StockGexPage symbol={symbol.trim().toUpperCase()} />;
}
