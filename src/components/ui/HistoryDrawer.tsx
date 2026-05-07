"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, MapPin, Calendar, Clock, Loader2, Route } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { getItineraries } from "@/lib/api/itinerary";
import type { Itinerary } from "@/types/itinerary";
import { cn } from "@/lib/utils";

// 颜色池，为没有封面图的行程生成渐变色
const GRADIENT_COLORS = [
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-green-400 to-green-600",
  "from-orange-400 to-orange-600",
  "from-pink-400 to-pink-600",
  "from-teal-400 to-teal-600",
  "from-indigo-400 to-indigo-600",
  "from-rose-400 to-rose-600",
];

function getGradient(id: string) {
  const index = id.charCodeAt(0) % GRADIENT_COLORS.length;
  return GRADIENT_COLORS[index];
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${fmt(start)}-${fmt(end)}`;
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

function groupItinerariesByTime(itineraries: Itinerary[]) {
  const now = new Date();
  const groups: { label: string; items: Itinerary[] }[] = [];
  const recent: Itinerary[] = [];
  const lastMonth: Itinerary[] = [];
  const older: Itinerary[] = [];

  for (const it of itineraries) {
    const diffMs = now.getTime() - new Date(it.updatedAt).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 7) recent.push(it);
    else if (diffDays < 30) lastMonth.push(it);
    else older.push(it);
  }

  if (recent.length > 0) groups.push({ label: "近期", items: recent });
  if (lastMonth.length > 0) groups.push({ label: "一个月内", items: lastMonth });
  if (older.length > 0) groups.push({ label: "更早", items: older });

  return groups;
}

function ItineraryItem({
  itinerary,
  onClick,
}: {
  itinerary: Itinerary;
  onClick: () => void;
}) {
  const totalActivities = itinerary.days.reduce(
    (sum, d) => sum + d.activities.length,
    0
  );
  const cities = new Set(
    itinerary.days
      .flatMap((d) => d.activities)
      .map((a) => a.location?.address?.split("市")[0])
      .filter(Boolean)
  ).size;

  return (
    <button
      onClick={onClick}
      className="group flex w-full gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      {/* 封面缩略图 */}
      <div className="relative h-[60px] w-[80px] shrink-0 overflow-hidden rounded-lg">
        {itinerary.coverImage ? (
          <img
            src={itinerary.coverImage}
            alt={itinerary.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br text-white",
              getGradient(itinerary.id)
            )}
          >
            <span className="text-lg font-bold">
              {itinerary.destination?.slice(0, 1)}
            </span>
          </div>
        )}
      </div>

      {/* 行程信息 */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <p className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-600">
          {itinerary.title || itinerary.destination}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>{formatDateRange(itinerary.startDate, itinerary.endDate)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {totalActivities > 0 && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {totalActivities}个地点
            </span>
          )}
          {cities > 0 && (
            <span className="flex items-center gap-0.5">
              <Route className="h-3 w-3" />
              {cities}个城市
            </span>
          )}
          <span className="ml-auto flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(itinerary.updatedAt)} 自动保存
          </span>
        </div>
      </div>
    </button>
  );
}

export function HistoryDrawer() {
  const { isHistoryDrawerOpen, closeHistoryDrawer } = useUIStore();
  const router = useRouter();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItineraries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { itineraries: data } = await getItineraries({ pageSize: 50 });
      setItineraries(data);
    } catch {
      setError("加载失败，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isHistoryDrawerOpen) {
      fetchItineraries();
    }
  }, [isHistoryDrawerOpen, fetchItineraries]);

  const handleOpen = (id: string) => {
    closeHistoryDrawer();
    router.push(`/plan/${id}`);
  };

  const handleNew = () => {
    closeHistoryDrawer();
    router.push("/plan/new");
  };

  const groups = groupItinerariesByTime(itineraries);

  return (
    <>
      {/* 遮罩层 */}
      {isHistoryDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={closeHistoryDrawer}
        />
      )}

      {/* 抽屉 */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out",
          isHistoryDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* 头部 */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">我的线路</span>
            {itineraries.length > 0 && (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                {itineraries.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNew}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              创建
            </button>
            <button
              onClick={closeHistoryDrawer}
              className="ml-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2 text-sm">加载中…</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-2 py-16 text-sm text-gray-500">
              <span>{error}</span>
              <button
                onClick={fetchItineraries}
                className="text-blue-600 underline hover:text-blue-700"
              >
                重试
              </button>
            </div>
          )}

          {!loading && !error && itineraries.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Route className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">暂无历史线路</p>
              <button
                onClick={handleNew}
                className="text-sm text-blue-600 underline hover:text-blue-700"
              >
                去创建第一条线路
              </button>
            </div>
          )}

          {!loading && !error && groups.length > 0 && (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 px-2 text-xs font-medium text-gray-400">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((it) => (
                      <ItineraryItem
                        key={it.id}
                        itinerary={it}
                        onClick={() => handleOpen(it.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
