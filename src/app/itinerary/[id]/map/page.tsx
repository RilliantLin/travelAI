'use client';

import React, { useState, useEffect, use } from 'react';
import { MapView } from '@/components/map';
import { MarkerData } from '@/types/map';
import { ArrowLeft, MapPin, Navigation, Layers } from 'lucide-react';
import Link from 'next/link';

interface MapPageProps {
  params: Promise<{ id: string }>;
}

export default function ItineraryMapPage({ params }: MapPageProps) {
  const { id } = use(params);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [itinerary, setItinerary] = useState<any>(null);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/itineraries/${id}`);
        if (response.ok) {
          const data = await response.json();
          setItinerary(data.data);
          
          const allMarkers: MarkerData[] = [];
          
          data.data.days?.forEach((day: any, dayIndex: number) => {
            day.activities?.forEach((activity: any, actIndex: number) => {
              if (activity.location?.lat && activity.location?.lng) {
                allMarkers.push({
                  id: `day${dayIndex + 1}-act${actIndex}`,
                  position: [activity.location.lng, activity.location.lat],
                  type: activity.type === 'restaurant' ? 'restaurant' : 
                        activity.type === 'hotel' ? 'hotel' : 'attraction',
                  title: activity.name,
                  description: `Day ${dayIndex + 1} - ${activity.startTime || ''}`,
                  data: { dayNumber: dayIndex + 1, ...activity },
                });
              }
            });
          });
          
          setMarkers(allMarkers);
        }
      } catch (error) {
        console.error('Failed to fetch itinerary:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItinerary();
    }
  }, [id]);

  const filteredMarkers = selectedDay
    ? markers.filter((m) => (m.data as any)?.dayNumber === selectedDay)
    : markers;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/itinerary/${id}`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回行程</span>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                {itinerary?.title || '行程地图'} - 地图全览
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4" />
              <span>{itinerary?.destination}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedDay(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedDay === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              全部日程
            </button>
            {itinerary?.days?.map((day: any, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedDay(index + 1)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedDay === index + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Day {index + 1} - {day.date}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <MapView
            markers={filteredMarkers}
            height="calc(100vh - 200px)"
            onMarkerClick={(marker) => {
              console.log('Marker clicked:', marker);
            }}
          />
        </div>

        {filteredMarkers.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">
              {selectedDay ? `Day ${selectedDay} 景点列表` : '全部景点'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      marker.type === 'attraction'
                        ? 'bg-red-500'
                        : marker.type === 'restaurant'
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`}
                  >
                    {marker.type === 'attraction'
                      ? '📍'
                      : marker.type === 'restaurant'
                      ? '🍜'
                      : '🏨'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{marker.title}</p>
                    <p className="text-sm text-gray-500">{marker.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
