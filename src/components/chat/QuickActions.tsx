"use client";

import { cn } from "@/lib/utils";
import { MapPin, UtensCrossed, Hotel, Plane, CloudSun, Calculator, Settings } from "lucide-react";

const QUICK_ACTIONS = [
  {
    id: "plan_itinerary",
    label: "规划行程",
    icon: MapPin,
    prompt: "帮我规划一次旅行",
    color: "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200",
  },
  {
    id: "search_attractions",
    label: "推荐景点",
    icon: MapPin,
    prompt: "有什么值得去的景点？",
    color: "text-red-600 bg-red-50 hover:bg-red-100 border-red-200",
  },
  {
    id: "search_restaurants",
    label: "美食推荐",
    icon: UtensCrossed,
    prompt: "推荐一些当地美食",
    color: "text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200",
  },
  {
    id: "search_hotels",
    label: "酒店推荐",
    icon: Hotel,
    prompt: "推荐性价比高的酒店",
    color: "text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200",
  },
  {
    id: "search_flights",
    label: "查询机票",
    icon: Plane,
    prompt: "帮我查一下机票信息",
    color: "text-cyan-600 bg-cyan-50 hover:bg-cyan-100 border-cyan-200",
  },
  {
    id: "check_weather",
    label: "天气查询",
    icon: CloudSun,
    prompt: "未来几天天气怎么样？",
    color: "text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-200",
  },
  {
    id: "get_budget",
    label: "预算估算",
    icon: Calculator,
    prompt: "帮我估算一下旅行预算",
    color: "text-green-600 bg-green-50 hover:bg-green-100 border-green-200",
  },
  {
    id: "modify_preferences",
    label: "偏好设置",
    icon: Settings,
    prompt: "我想更新我的旅行偏好",
    color: "text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200",
  },
];

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled = false }: QuickActionsProps) {
  return (
    <div className="px-4 pb-3">
      <p className="mb-2.5 text-xs font-medium text-gray-500">快捷操作</p>
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => !disabled && onSelect(action.prompt)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                action.color,
                disabled && "pointer-events-none opacity-50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
