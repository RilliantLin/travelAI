"use client";

import { cn } from "@/lib/utils";
import {
  Footprints,
  Bus,
  Train,
  Plane,
  Car,
  Navigation,
  Bike,
} from "lucide-react";

export interface TransportInfo {
  id: string;
  from: string;
  to: string;
  mode: "walking" | "bus" | "subway" | "taxi" | "train" | "flight" | "driving" | "cycling" | "unknown";
  duration?: number;
  distance?: number;
  cost?: number;
  details?: string;
}

const MODE_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  walking: { icon: Footprints, label: "步行", color: "text-green-600", bgColor: "bg-green-50" },
  bus: { icon: Bus, label: "公交", color: "text-blue-600", bgColor: "bg-blue-50" },
  subway: { icon: Train, label: "地铁", color: "text-purple-600", bgColor: "bg-purple-50" },
  taxi: { icon: Car, label: "打车", color: "text-orange-600", bgColor: "bg-orange-50" },
  train: { icon: Train, label: "火车", color: "text-cyan-600", bgColor: "bg-cyan-50" },
  flight: { icon: Plane, label: "飞机", color: "text-sky-600", bgColor: "bg-sky-50" },
  driving: { icon: Car, label: "自驾", color: "text-gray-600", bgColor: "bg-gray-50" },
  cycling: { icon: Bike, label: "骑行", color: "text-lime-600", bgColor: "bg-lime-50" },
  unknown: { icon: Navigation, label: "交通", color: "text-gray-500", bgColor: "bg-gray-50" },
};

interface TransportCardProps {
  transport: TransportInfo;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

function formatDistance(meters?: number): string {
  if (!meters) return "";
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function TransportCard({ transport }: TransportCardProps) {
  const config = MODE_CONFIG[transport.mode] || MODE_CONFIG.walking;
  const Icon = config.icon;

  return (
    <div className="relative flex items-center gap-3 py-1.5 pl-4">
      <div className="absolute left-[1.95rem] top-0 bottom-0 w-px border-l border-dashed border-gray-300" />

      <div
        className={cn(
          "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          config.bgColor,
          config.color
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
        <span className={cn("font-medium", config.color)}>{config.label}</span>
        {transport.duration != null ? (
          <span>{formatDuration(transport.duration)}</span>
        ) : (
          <span>待确认</span>
        )}
        {transport.distance != null && transport.distance > 0 && (
          <>
            <span className="text-gray-300">·</span>
            <span>{formatDistance(transport.distance)}</span>
          </>
        )}
        {transport.cost != null && transport.cost > 0 && (
          <>
            <span className="text-gray-300">·</span>
            <span className="text-green-600">¥{transport.cost}</span>
          </>
        )}
        {transport.details && (
          <>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400">{transport.details}</span>
          </>
        )}
      </div>
    </div>
  );
}
