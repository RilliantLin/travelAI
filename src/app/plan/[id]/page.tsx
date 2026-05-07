"use client";

import { useEffect } from "react";
import { ChatPanel, ItineraryPanel, MapPanel } from "@/components/plan";
import { useItineraryStore } from "@/stores/itinerary-store";
import { useChatStore } from "@/stores/chat-store";
import { getItinerary } from "@/lib/api/itinerary";
import { useParams } from "next/navigation";

export default function PlanPage() {
  const params = useParams();
  const id = params.id as string;
  useEffect(() => {
    if (id && id !== "new") {
      const { setItinerary, setLoading } = useItineraryStore.getState();
      const { setLinkedItineraryId } = useChatStore.getState();
      setLoading(true);
      getItinerary(id)
        .then((data) => {
          if (data) {
            setItinerary(data);
            setLinkedItineraryId(data.id);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Chat Panel - 25% */}
      <div className="flex w-[25%] min-w-[280px] shrink-0 flex-col border-r border-gray-200 bg-white">
        <ChatPanel />
      </div>

      {/* Itinerary Panel - 40% */}
      <div className="flex w-[40%] min-w-[320px] flex-col border-r border-gray-200 bg-gray-50/50">
        <ItineraryPanel />
      </div>

      {/* Map Panel - 35% */}
      <div className="flex flex-1 flex-col bg-gray-100">
        <MapPanel />
      </div>
    </div>
  );
}
