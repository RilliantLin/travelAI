'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AMapProvider, useMapContext } from '@/components/map/AMapProvider';
import { Map } from '@/components/map/AMapProvider';
import { MarkerList } from '@/components/map/Marker';
import { MarkerData, RouteData } from '@/types/map';
import { MapPin, Navigation, Layers, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapViewProps {
  markers?: MarkerData[];
  routes?: RouteData[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showControls?: boolean;
  onMarkerClick?: (marker: MarkerData) => void;
}

const AMAP_API_KEY = process.env.NEXT_PUBLIC_AMAP_KEY || '';
const AMAP_SECURITY_CODE = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE || '';

/** 在 AMapProvider 内部响应式地同步地图中心和视野 */
function MapController({ center, markers }: { center: [number, number]; markers: MarkerData[] }) {
  const { map, setCenter } = useMapContext();
  const prevMarkersKey = useRef<string>('');

  useEffect(() => {
    if (!map || !center) return;
    if (center[0] === 0 && center[1] === 0) return;
    setCenter(center);
  }, [center, map, setCenter]);

  useEffect(() => {
    if (!map || markers.length === 0) return;
    const key = markers.map((m) => m.id).join(',');
    if (key === prevMarkersKey.current) return;
    prevMarkersKey.current = key;
    // 稍作延迟确保 Marker 组件已将标记添加到地图上
    setTimeout(() => {
      try {
        map.setFitView(null, false, [60, 60, 60, 60]);
      } catch {
        // setFitView 失败时静默降级（标记尚未就绪）
      }
    }, 300);
  }, [markers, map]);

  return null;
}

export function MapView({
  markers = [],
  routes = [],
  center = [116.397428, 39.90923],
  zoom = 11,
  height = '400px',
  showControls = true,
  onMarkerClick,
}: MapViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [mapStyle, setMapStyle] = useState<'normal' | 'satellite' | 'dark'>('normal');

  const mapStyleValue = {
    normal: 'amap://styles/normal',
    satellite: 'amap://styles/satellite',
    dark: 'amap://styles/dark',
  }[mapStyle];

  return (
    <AMapProvider
      config={{ apiKey: AMAP_API_KEY }}
      securityJsCode={AMAP_SECURITY_CODE}
    >
      <MapController center={center} markers={markers} />
      <div className={`overflow-hidden border border-gray-200 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-white' : 'relative rounded-xl'}`} style={{ height: isFullscreen ? '100vh' : height }}>
        <Map
          options={{
            zoom: currentZoom,
            center,
            mapStyle: mapStyleValue,
          }}
          className="w-full"
          style={{ height: isFullscreen ? '100%' : height }}
          onZoomChange={setCurrentZoom}
        />

        {markers.length > 0 && (
          <MarkerList markers={markers} onMarkerClick={onMarkerClick} />
        )}

        {showControls && (
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-[9999]">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-white shadow-md"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentZoom((z) => Math.min(z + 1, 18))}
              className="bg-white shadow-md"
            >
              +
            </Button>
            
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentZoom((z) => Math.max(z - 1, 3))}
              className="bg-white shadow-md"
            >
              -
            </Button>
            
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMapStyle((s) => s === 'normal' ? 'satellite' : s === 'satellite' ? 'dark' : 'normal')}
              className="bg-white shadow-md"
            >
              <Layers className="w-4 h-4" />
            </Button>
          </div>
        )}

        {markers.length > 0 && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>景点</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>餐厅</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>酒店</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AMapProvider>
  );
}

interface ItineraryMapViewProps {
  itineraryId: string;
  dayNumber?: number;
}

export function ItineraryMapView({ itineraryId, dayNumber }: ItineraryMapViewProps) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItineraryData = async () => {
      try {
        setLoading(true);
        
      } catch (error) {
        console.error('Failed to fetch itinerary data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (itineraryId) {
      fetchItineraryData();
    }
  }, [itineraryId, dayNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-xl" style={{ height: '400px' }}>
        <div className="text-gray-500">加载地图中...</div>
      </div>
    );
  }

  return (
    <MapView
      markers={markers}
      routes={routes}
      height="500px"
    />
  );
}
