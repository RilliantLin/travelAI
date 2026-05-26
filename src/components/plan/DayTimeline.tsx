"use client";

import { ActivityCard } from "./ActivityCard";
import { TransportCard, type TransportInfo } from "./TransportCard";
import { AccommodationCard } from "./AccommodationCard";
import type { Activity, DayPlan } from "@/types/itinerary";
import { Utensils } from "lucide-react";

interface DayTimelineProps {
  dayPlan: DayPlan;
  highlightedActivityId?: string | null;
  onActivityHover?: (id: string | null) => void;
  onRemoveActivity?: (id: string) => void;
  onReplaceActivity?: (id: string) => void;
}

function MealEntry({ name, time, cost }: { name: string; time?: string; cost?: number }) {
  return (
    <div className="flex items-center gap-3 py-1 pl-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
        <Utensils className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="font-medium text-orange-600">{name}</span>
        {time && <span>{time}</span>}
        {cost != null && cost > 0 && (
          <>
            <span className="text-gray-300">·</span>
            <span className="text-green-600">¥{cost}/人</span>
          </>
        )}
      </div>
    </div>
  );
}

function estimateTransport(
  prevActivity: Activity,
  nextActivity: Activity
): TransportInfo {
  const distance = getDistanceInMeters(prevActivity, nextActivity);

  if (!distance) {
    return {
      id: `transport-${prevActivity.id}-${nextActivity.id}`,
      from: prevActivity.name,
      to: nextActivity.name,
      mode: "unknown",
      details: `${prevActivity.name} → ${nextActivity.name}`,
    };
  }

  const mode = distance <= 1200 ? "walking" : distance <= 5000 ? "taxi" : "driving";
  const speedMetersPerMinute = mode === "walking" ? 80 : mode === "taxi" ? 250 : 400;

  return {
    id: `transport-${prevActivity.id}-${nextActivity.id}`,
    from: prevActivity.name,
    to: nextActivity.name,
    mode,
    duration: Math.max(1, Math.round(distance / speedMetersPerMinute)),
    distance,
  };
}

function getDistanceInMeters(prevActivity: Activity, nextActivity: Activity): number | null {
  const from = prevActivity.location;
  const to = nextActivity.location;
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return null;

  const earthRadius = 6371000;
  const toRadians = (degree: number) => (degree * Math.PI) / 180;
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
}

export function DayTimeline({
  dayPlan,
  highlightedActivityId,
  onActivityHover,
  onRemoveActivity,
  onReplaceActivity,
}: DayTimelineProps) {
  const { activities, meals, accommodation } = dayPlan;
  const scheduledActivityCount = activities.filter(
    (activity) => activity.type !== "transport"
  ).length;

  const morningMeal = meals?.find((m) => m.type === "breakfast");
  const lunchMeal = meals?.find((m) => m.type === "lunch");
  const dinnerMeal = meals?.find((m) => m.type === "dinner");

  return (
    <div className="space-y-2">
      {accommodation && (
        <AccommodationCard
          accommodation={accommodation}
          isHighlighted={highlightedActivityId === accommodation.id}
          onHover={onActivityHover}
        />
      )}

      {morningMeal && (
        <MealEntry
          name={morningMeal.name}
          time={morningMeal.time}
          cost={morningMeal.estimatedCost}
        />
      )}

      {activities.map((activity, i) => {
        const previousActivity = activities[i - 1];
        const scheduledIndex = activities
          .slice(0, i)
          .filter((item) => item.type !== "transport").length;
        const shouldShowTransport =
          i > 0 &&
          activity.type !== "transport" &&
          previousActivity?.type !== "transport";
        const shouldShowLunch =
          lunchMeal &&
          activity.type !== "transport" &&
          scheduledIndex === Math.ceil(scheduledActivityCount / 2);

        return (
        <div key={activity.id}>
          {shouldShowTransport && (
            <TransportCard
              transport={estimateTransport(previousActivity, activity)}
            />
          )}

          {shouldShowLunch && (
            <MealEntry
              name={lunchMeal.name}
              time={lunchMeal.time}
              cost={lunchMeal.estimatedCost}
            />
          )}

          <ActivityCard
            activity={activity}
            index={i}
            isHighlighted={highlightedActivityId === activity.id}
            onHover={onActivityHover}
            onRemove={onRemoveActivity}
            onReplace={onReplaceActivity}
          />
        </div>
        );
      })}

      {dinnerMeal && (
        <MealEntry
          name={dinnerMeal.name}
          time={dinnerMeal.time}
          cost={dinnerMeal.estimatedCost}
        />
      )}

      {activities.length === 0 && !accommodation && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-10 text-center">
          <p className="text-sm text-gray-400">暂无行程安排</p>
          <p className="mt-1 text-xs text-gray-400">
            在左侧聊天中告诉 AI 你的需求
          </p>
        </div>
      )}
    </div>
  );
}
