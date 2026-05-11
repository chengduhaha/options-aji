import NewsPage from "@/components/news/NewsPage";

export default async function Page(props: { searchParams?: Promise<{ ticker?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  return <NewsPage initialTicker={sp.ticker} />;
}