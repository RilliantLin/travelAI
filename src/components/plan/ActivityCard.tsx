"use client";

import { cn } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Star,
  Ticket,
  MoreHorizontal,
  Trash2,
  RefreshCw,
} from "lucide-react";
import type { Activity } from "@/types/itinerary";

interface ActivityCardProps {
  activity: Activity;
  index: number;
  isHighlighted?: boolean;
  onHover?: (id: string | null) => void;
  onRemove?: (id: string) => void;
  onReplace?: (id: string) => void;
}

export function ActivityCard({
  activity,
  index,
  isHighlighted,
  onHover,
  onRemove,
  onReplace,
}: ActivityCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-white p-4 transition-all",
        isHighlighted
          ? "border-blue-400 shadow-md ring-2 ring-blue-100"
          : "border-gray-200 hover:border-blue-200 hover:shadow-sm"
      )}
      onMouseEnter={() => onHover?.(activity.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-sm font-bold text-red-600">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-gray-900">
              {activity.name}
            </h4>
            {activity.rating != null && activity.rating > 0 && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {activity.rating.toFixed(1)}
              </span>
            )}
          </div>

          {activity.description && (
            <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
              {activity.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {activity.startTime && activity.endTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {activity.startTime} - {activity.endTime}
              </span>
            )}
            {activity.duration > 0 && (
              <span className="text-gray-400">
                {activity.duration >= 60
                  ? `${Math.floor(activity.duration / 60)}h${activity.duration % 60 > 0 ? `${activity.duration % 60}min` : ""}`
                  : `${activity.duration}min`}
              </span>
            )}
            {activity.estimatedCost != null && activity.estimatedCost > 0 && (
              <span className="inline-flex items-center gap-1 text-green-600">
                <Ticket className="h-3 w-3" />
                ¥{activity.estimatedCost}
              </span>
            )}
          </div>

          {activity.location?.address && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{activity.location.address}</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onReplace && (
            <button
              onClick={() => onReplace(activity.id)}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
              title="替换"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(activity.id)}
              className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="删除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
