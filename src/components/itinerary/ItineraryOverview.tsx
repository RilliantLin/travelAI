"use client";

import { cn } from "@/lib/utils";
import type { Itinerary } from "@/types/itinerary";
import {
  MapPin,
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  Edit3,
  XCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-700" },
  confirmed: { label: "已确认", color: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700" },
  cancelled: { label: "已取消", color: "bg-red-100 text-red-700" },
} as const;

interface ItineraryOverviewProps {
  itinerary: Itinerary;
}

export function ItineraryOverview({ itinerary }: ItineraryOverviewProps) {
  const status = STATUS_CONFIG[itinerary.status];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{itinerary.title}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                status.color
              )}
            >
              {status.label}
            </span>
          </div>

          {itinerary.description && (
            <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
              {itinerary.description}
            </p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gray-400" />
              {itinerary.destination}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              {itinerary.startDate} ~ {itinerary.endDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              共 {itinerary.totalDays} 天
            </span>
          </div>

          {itinerary.tags && itinerary.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {itinerary.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {itinerary.budget && (
        <div className="mt-5 flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <div>
            <p className="text-xs font-medium text-gray-500">预估总费用</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">
              ¥{itinerary.budget.totalEstimated.toLocaleString()}
            </p>
          </div>
          {itinerary.budget.totalBudget > 0 && (
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500">预算</p>
              <p className="text-lg font-semibold text-gray-700">
                ¥{itinerary.budget.totalBudget.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
