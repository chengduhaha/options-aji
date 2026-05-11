import StockUnusualPage from "@/components/stock/StockUnusualPage";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <StockUnusualPage symbol={symbol.trim().toUpperCase()} />;
}
