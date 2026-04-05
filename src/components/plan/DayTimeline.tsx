"use client";

import { ActivityCard } from "./ActivityCard";
import { TransportCard, type TransportInfo } from "./TransportCard";
import { AccommodationCard } from "./AccommodationCard";
import type { DayPlan } from "@/types/itinerary";
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
  prevActivity: { name: string },
  nextActivity: { name: string }
): TransportInfo {
  return {
    id: `transport-${prevActivity.name}-${nextActivity.name}`,
    from: prevActivity.name,
    to: nextActivity.name,
    mode: "walking",
    duration: 15,
  };
}

export function DayTimeline({
  dayPlan,
  highlightedActivityId,
  onActivityHover,
  onRemoveActivity,
  onReplaceActivity,
}: DayTimelineProps) {
  const { activities, meals, accommodation } = dayPlan;

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

      {activities.map((activity, i) => (
        <div key={activity.id}>
          {i > 0 && (
            <TransportCard
              transport={estimateTransport(activities[i - 1], activity)}
            />
          )}

          {lunchMeal && i === Math.ceil(activities.length / 2) && (
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
      ))}

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
