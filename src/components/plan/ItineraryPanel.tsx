"use client";

import { cn } from "@/lib/utils";
import { Calendar, MapPin, Wallet, Loader2 } from "lucide-react";
import { useItineraryStore } from "@/stores/itinerary-store";
import { DayTimeline } from "./DayTimeline";
import type { DayPlan } from "@/types/itinerary";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  } catch {
    return dateStr;
  }
}

function getDayEstimatedCost(dayPlan?: DayPlan): number {
  if (!dayPlan) return 0;

  const activityCost = dayPlan.activities.reduce(
    (sum, activity) => sum + (activity.estimatedCost || 0),
    0
  );
  const mealCost = dayPlan.meals.reduce(
    (sum, meal) => sum + (meal.estimatedCost || 0),
    0
  );
  const accommodationCost = dayPlan.accommodation?.estimatedCost || 0;

  return activityCost + mealCost + accommodationCost;
}

export function ItineraryPanel() {
  const { itinerary, activeDay, isLoading, setActiveDay, setHighlightedActivity, highlightedActivityId } =
    useItineraryStore();

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">正在生成行程...</p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Calendar className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">行程详情</h3>
        <p className="max-w-[240px] text-sm text-gray-500">
          通过 Codex 工具创建行程后，这里会展示详细安排
        </p>
      </div>
    );
  }

  const dayPlan = itinerary.days[activeDay];
  const dayEstimatedCost = getDayEstimatedCost(dayPlan);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900">{itinerary.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span>
            {itinerary.startDate} ~ {itinerary.endDate}
          </span>
          <span className="inline-flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            当日约 ¥{dayEstimatedCost}
          </span>
          {itinerary.budget && (
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              总预算 ¥{itinerary.budget.totalBudget || itinerary.budget.totalEstimated}
            </span>
          )}
        </div>
      </div>

      {/* Day tabs */}
      <div className="shrink-0 border-b border-gray-100">
        <div className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-hide">
          {itinerary.days.map((day, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeDay === i
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {day.date ? formatDate(day.date) : `第${day.dayNumber}天`}
            </button>
          ))}
        </div>
      </div>

      {/* Day content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {dayPlan ? (
          <>
            {dayPlan.summary && (
              <p className="mb-3 text-xs text-gray-500">{dayPlan.summary}</p>
            )}
            <DayTimeline
              dayPlan={dayPlan}
              highlightedActivityId={highlightedActivityId}
              onActivityHover={setHighlightedActivity}
            />
            {dayPlan.tips && (
              <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {dayPlan.tips}
              </div>
            )}
          </>
        ) : (
          <div className="py-10 text-center text-sm text-gray-400">
            暂无当日行程数据
          </div>
        )}
      </div>
    </div>
  );
}
