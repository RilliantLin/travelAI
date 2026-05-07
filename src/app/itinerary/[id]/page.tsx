"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPinned, Wallet, Plane, Hotel } from "lucide-react";
import {
  ItineraryOverview,
  ScheduleTimeline,
  BudgetCard,
  TabNav,
} from "@/components/itinerary";
import { MapView } from "@/components/map";
import { FlightSearchPanel } from "@/components/flight";
import { HotelSearchPanel } from "@/components/hotel";
import { getItinerary } from "@/lib/api/itinerary";
import type { Itinerary } from "@/types/itinerary";
import type { MarkerData } from "@/types/map";

const TABS = [
  { id: "schedule", label: "日程安排", icon: Calendar },
  { id: "map", label: "地图视图", icon: MapPinned },
  { id: "budget", label: "费用预算", icon: Wallet },
  { id: "flights", label: "航班信息", icon: Plane },
  { id: "hotels", label: "酒店推荐", icon: Hotel },
];

interface ItineraryPageProps {
  params: { id: string };
}

export default function ItineraryPage({ params }: ItineraryPageProps) {
  const { id } = params;
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schedule");
  const [activeDay, setActiveDay] = useState<number>(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getItinerary(id);
        setItinerary(data);
      } catch (error) {
        console.error("Failed to load itinerary:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">加载行程详情...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-600">未找到行程信息</p>
        <Link
          href="/plan/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          返回行程规划
        </Link>
      </div>
    );
  }

  const markers: MarkerData[] = [];
  itinerary.days?.forEach((day) => {
    day.activities?.forEach((activity) => {
      if (activity.location?.lat && activity.location?.lng) {
        markers.push({
          id: activity.id,
          position: [activity.location.lng, activity.location.lat],
          type:
            activity.type === "restaurant"
              ? "restaurant"
              : activity.type === "hotel"
              ? "hotel"
              : "attraction",
          title: activity.name,
          description: `Day ${day.dayNumber} - ${activity.startTime || ""}`,
          data: { dayNumber: day.dayNumber, ...activity },
        });
      }
    });
  });

  const filteredMarkers =
    activeDay != null && activeTab === "map"
      ? markers.filter((m) => (m.data as Record<string, unknown>)?.dayNumber === activeDay)
      : markers;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="border-b border-gray-200 bg-white sticky top-14 z-30">
        <div className="mx-auto max-w-6xl flex items-center gap-4 px-4 py-3">
          <Link
            href="/plan/new"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <ItineraryOverview itinerary={itinerary} />

        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="pb-8">
          {activeTab === "schedule" && (
            <ScheduleTimeline
              days={itinerary.days}
              activeDay={activeDay}
              onDayChange={setActiveDay}
            />
          )}

          {activeTab === "map" && (
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setActiveDay(0)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeDay == null || activeDay === 0
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  全部日程
                </button>
                {itinerary.days?.map((day) => (
                  <button
                    key={day.dayNumber}
                    onClick={() => setActiveDay(day.dayNumber)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeDay === day.dayNumber
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Day {day.dayNumber}
                  </button>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <MapView
                  markers={filteredMarkers}
                  height="500px"
                  onMarkerClick={(marker) =>
                    console.log("Marker clicked:", marker)
                  }
                />
              </div>

              {filteredMarkers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredMarkers.map((marker) => (
                    <div
                      key={marker.id}
                      className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-white p-3 hover:shadow-sm transition-shadow cursor-pointer"
                    >
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-white ${
                          marker.type === "attraction"
                            ? "bg-red-500"
                            : marker.type === "restaurant"
                            ? "bg-orange-500"
                            : "bg-blue-500"
                        }`}
                      >
                        {marker.type === "attraction"
                          ? "📍"
                          : marker.type === "restaurant"
                          ? "🍜"
                          : "🏨"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {marker.title}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {marker.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "budget" &&
            (itinerary.budget ? (
              <BudgetCard budget={itinerary.budget} />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
                <Wallet className="mb-2 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">暂无预算信息</p>
              </div>
            ))}

          {activeTab === "flights" && (
            <FlightSearchPanel
              destination={itinerary.destination}
              startDate={itinerary.startDate}
              endDate={itinerary.endDate}
              onSelect={(flight) => console.log("Selected flight:", flight)}
            />
          )}

          {activeTab === "hotels" && (
            <HotelSearchPanel
              destination={itinerary.destination}
              checkIn={itinerary.startDate}
              checkOut={itinerary.endDate}
              onSelect={(hotel) => console.log("Selected hotel:", hotel)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
