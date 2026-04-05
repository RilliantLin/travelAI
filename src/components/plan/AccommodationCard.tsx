"use client";

import { cn } from "@/lib/utils";
import { Hotel, Star, MapPin } from "lucide-react";
import type { AccommodationPlan } from "@/types/itinerary";

interface AccommodationCardProps {
  accommodation: AccommodationPlan;
  isHighlighted?: boolean;
  onHover?: (id: string | null) => void;
}

export function AccommodationCard({
  accommodation,
  isHighlighted,
  onHover,
}: AccommodationCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-gradient-to-r from-blue-50/60 to-white p-4 transition-all",
        isHighlighted
          ? "border-blue-400 shadow-md ring-2 ring-blue-100"
          : "border-blue-200/60 hover:border-blue-300 hover:shadow-sm"
      )}
      onMouseEnter={() => onHover?.(accommodation.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Hotel className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-blue-600">
              住宿
            </span>
            {accommodation.rating && accommodation.rating > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {accommodation.rating.toFixed(1)}
              </span>
            )}
          </div>

          <h4 className="mb-1 truncate text-sm font-semibold text-gray-900">
            {accommodation.name}
          </h4>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {accommodation.type && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                {accommodation.type}
              </span>
            )}
            {accommodation.estimatedCost > 0 && (
              <span className="font-medium text-green-600">
                ¥{accommodation.estimatedCost}/晚
              </span>
            )}
          </div>

          {accommodation.location?.address && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{accommodation.location.address}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
