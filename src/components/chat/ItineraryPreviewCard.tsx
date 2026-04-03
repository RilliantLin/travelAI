"use client";

import Link from "next/link";
import { MapPin, Calendar, ArrowRight, Plane } from "lucide-react";

interface ItineraryPreviewCardProps {
  destination?: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  itineraryId?: string;
}

export function ItineraryPreviewCard({
  destination = "目的地",
  startDate,
  endDate,
  totalDays,
  itineraryId,
}: ItineraryPreviewCardProps) {
  const href = itineraryId ? `/itinerary/${itineraryId}` : "#";

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Plane className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">行程方案已生成</p>
            <p className="text-xs text-gray-500">点击查看完整行程详情</p>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-3 rounded-lg bg-white p-3">
          <div className="flex flex-col items-center gap-1">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-900 truncate w-full text-center">
              {destination}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-gray-600">
              {totalDays ? `${totalDays}天` : "-"}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500">预算</span>
            <span className="text-xs font-medium text-gray-900">查看详情</span>
          </div>
        </div>

        {startDate && endDate && (
          <p className="mb-3 text-xs text-gray-500">
            {startDate} ~ {endDate}
          </p>
        )}

        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          查看完整行程
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
