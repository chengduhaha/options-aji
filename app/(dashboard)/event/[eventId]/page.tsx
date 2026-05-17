import { EventPanoramaView } from "@/components/cross-market/event-panorama-view";

export default async function EventPanoramaPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventPanoramaView eventIdParam={eventId} />;
}
