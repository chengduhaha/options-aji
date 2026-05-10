import StockAnalystPage from "@/components/stock/StockAnalystPage";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <StockAnalystPage symbol={symbol.trim().toUpperCase()} />;
}