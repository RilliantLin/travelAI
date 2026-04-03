"use client";

import { cn } from "@/lib/utils";
import type { DayPlan, Activity, MealPlan } from "@/types/itinerary";
import {
  MapPin,
  Clock,
  UtensilsCrossed,
  Hotel,
  Camera,
  Mountain,
  ShoppingBag,
  Sun,
  CloudRain,
} from "lucide-react";

const ACTIVITY_ICONS: Record<string, typeof MapPin> = {
  attraction: MapPin,
  restaurant: UtensilsCrossed,
  hotel: Hotel,
  transport: Mountain,
  other: Sun,
};

const MEAL_LABELS: Record<MealPlan["type"], string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "加餐",
};

function ActivityCard({ activity, isLast }: { activity: Activity; isLast?: boolean }) {
  const Icon = ACTIVITY_ICONS[activity.type] || MapPin;

  return (
    <div className={cn("group relative flex gap-3 pb-6", !isLast && "border-l-2 border-gray-200 ml-[11px] pl-6")}>
      <div
        className={cn(
          "absolute -left-[11px] z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white text-white shadow-sm",
          activity.type === "attraction"
            ? "bg-red-500"
            : activity.type === "restaurant"
            ? "bg-orange-500"
            : activity.type === "hotel"
            ? "bg-blue-500"
            : "bg-gray-500"
        )}
      >
        <Icon className="h-3 w-3" />
      </div>

      <div className={cn("flex-1 rounded-lg border border-gray-100 bg-white p-4 transition-all hover:shadow-md")}>
        <div className="mb-2 flex items-start justify-between">
          <h4 className="font-medium text-gray-900">{activity.name}</h4>
          <span className="shrink-0 text-xs text-gray-500">
            {activity.startTime} - {activity.endTime}
          </span>
        </div>

        {activity.location?.address && (
          <p className="mb-1 flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            {activity.location.address}
          </p>
        )}

        {activity.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            {activity.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {activity.duration}分钟
          </span>
          {activity.estimatedCost != null && (
            <span>¥{activity.estimatedCost}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function MealCard({ meal }: { meal: MealPlan }) {
  return (
    <div className="ml-[11px] pl-6 border-l-2 border-dashed border-orange-200 pb-4">
      <div className="flex gap-3">
        <div className="-left-[11px] relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <UtensilsCrossed className="h-2.5 w-2.5" />
        </div>
        <div className="flex-1 rounded-lg border border-orange-50 bg-orange-50/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-orange-700">
              {MEAL_LABELS[meal.type]}
            </span>
            <span className="text-xs text-gray-500">{meal.time}</span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-gray-800">{meal.name}</p>
          {meal.cuisine && (
            <p className="mt-0.5 text-xs text-gray-500">菜系：{meal.cuisine}</p>
          )}
          {meal.estimatedCost > 0 && (
            <p className="mt-1 text-xs text-orange-600">约 ¥{meal.estimatedCost}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ScheduleTimelineProps {
  days: DayPlan[];
  activeDay?: number;
  onDayChange?: (day: number) => void;
}

export function ScheduleTimeline({ days, activeDay, onDayChange }: ScheduleTimelineProps) {
  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-gray-500">暂无行程安排</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((day, index) => (
          <button
            key={day.dayNumber}
            onClick={() => onDayChange?.(index + 1)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              (activeDay == null || activeDay === index + 1)
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            Day {day.dayNumber}
            <span className="ml-1.5 block text-xs opacity-75">{day.date}</span>
          </button>
        ))}
      </div>

      {(activeDay ? days.filter((d) => d.dayNumber === activeDay) : days).map((day) => (
        <div key={day.dayNumber} className="space-y-1">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              第 {day.dayNumber} 天
            </h3>
            <span className="text-sm text-gray-500">{day.date}</span>
          </div>

          {day.summary && (
            <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              💡 {day.summary}
            </p>
          )}

          <div className="relative">
            {day.activities.map((activity, i) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                isLast={i === day.activities.length - 1 && day.meals.length === 0}
              />
            ))}

            {day.meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}

            {day.accommodation && (
              <div className="ml-[11px] pl-6 border-l-2 border-dashed border-blue-200 pb-2">
                <div className="flex gap-3">
                  <div className="-left-[11px] relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Hotel className="h-2.5 w-2.5" />
                  </div>
                  <div className="flex-1 rounded-lg border border-blue-50 bg-blue-50/50 p-3">
                    <p className="text-xs font-medium text-blue-700">住宿</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-800">
                      {day.accommodation.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {day.accommodation.checkIn} 入住
                    </p>
                  </div>
                </div>
              </div>
            )}

            {day.tips && (
              <div className="mt-4 rounded-lg border border-yellow-100 bg-yellow-50 p-3">
                <p className="text-xs font-medium text-yellow-800">📌 小贴士</p>
                <p className="mt-1 text-sm text-yellow-700">{day.tips}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
