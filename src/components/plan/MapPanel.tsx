"use client";

import { useMemo } from "react";
import { MapView } from "@/components/map/MapView";
import { useItineraryStore } from "@/stores/itinerary-store";
import type { MarkerData } from "@/types/map";
import { MapPin, Loader2 } from "lucide-react";

function activityTypeToMarkerType(
  type: string
): MarkerData["type"] {
  return (["attraction", "restaurant", "hotel"].includes(type) ? type : "waypoint") as MarkerData["type"];
}

export function MapPanel() {
  const { itinerary, activeDay, setHighlightedActivity, highlightedActivityId } =
    useItineraryStore();

  const { markers, center } = useMemo(() => {
    if (!itinerary || !itinerary.days[activeDay]) {
      return { markers: [], center: [116.397428, 39.90923] as [number, number] };
    }

    const dayPlan = itinerary.days[activeDay];
    const dayMarkers: MarkerData[] = [];

    dayPlan.activities.forEach((activity, i) => {
      if (activity.location?.lat && activity.location?.lng) {
        dayMarkers.push({
          id: activity.id,
          position: [activity.location.lng, activity.location.lat],
          type: activityTypeToMarkerType(activity.type),
          title: activity.name,
          description: activity.description || `${activity.startTime} - ${activity.endTime}`,
        });
      }
    });

    if (dayPlan.accommodation?.location?.lat && dayPlan.accommodation?.location?.lng) {
      dayMarkers.push({
        id: dayPlan.accommodation.id,
        position: [dayPlan.accommodation.location.lng, dayPlan.accommodation.location.lat],
        type: "hotel",
        title: dayPlan.accommodation.name,
        description: `住宿: ${dayPlan.accommodation.name}`,
      });
    }

    let mapCenter: [number, number] = [116.397428, 39.90923];
    if (dayMarkers.length > 0) {
      const avgLng = dayMarkers.reduce((s, m) => s + m.position[0], 0) / dayMarkers.length;
      const avgLat = dayMarkers.reduce((s, m) => s + m.position[1], 0) / dayMarkers.length;
      mapCenter = [avgLng, avgLat];
    }

    return { markers: dayMarkers, center: mapCenter };
  }, [itinerary, activeDay]);

  if (!itinerary) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-gray-50 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
          <MapPin className="h-7 w-7" />
        </div>
        <p className="text-sm text-gray-400">生成行程后显示地图</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <MapView
        markers={markers}
        center={center}
        zoom={12}
        height="100%"
        showControls={true}
        onMarkerClick={(marker) => {
          setHighlightedActivity(marker.id);
          setTimeout(() => setHighlightedActivity(null), 3000);
        }}
      />
    </div>
  );
}
