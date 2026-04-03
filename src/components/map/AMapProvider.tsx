'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { MapConfig, MapOptions, MapContextValue, MarkerData, PolylineData, MapBounds } from '@/types/map';

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

const MapContext = createContext<MapContextValue | null>(null);

export function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within an AMapProvider');
  }
  return context;
}

interface AMapProviderProps {
  config: MapConfig;
  securityJsCode?: string;
  children: React.ReactNode;
}

export function AMapProvider({ config, securityJsCode, children }: AMapProviderProps) {
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const markersRef = useRef(new globalThis.Map<string, any>());
  const polylinesRef = useRef(new globalThis.Map<string, any>());
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (securityJsCode) {
      window._AMapSecurityConfig = {
        securityJsCode: securityJsCode,
      };
    }

    AMapLoader.load({
      key: config.apiKey,
      version: config.version || '2.0',
      plugins: config.plugins || ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geolocation', 'AMap.Marker', 'AMap.Polyline'],
    })
      .then((AMap) => {
        setIsLoaded(true);
        window.AMap = AMap;
      })
      .catch((e) => {
        setError(new Error(`Failed to load AMap: ${e.message}`));
      });

    return () => {
      mapRef.current?.destroy();
      markersRef.current.clear();
      polylinesRef.current.clear();
    };
  }, [config.apiKey, config.version, config.plugins, securityJsCode]);

  const setCenter = useCallback((lnglat: [number, number]) => {
    if (mapRef.current) {
      mapRef.current.setCenter(lnglat);
    }
  }, []);

  const setZoom = useCallback((zoom: number) => {
    if (mapRef.current) {
      mapRef.current.setZoom(zoom);
    }
  }, []);

  const setBounds = useCallback((bounds: MapBounds) => {
    if (mapRef.current && window.AMap) {
      const newBounds = new window.AMap.Bounds(
        bounds.southWest,
        bounds.northEast
      );
      mapRef.current.setBounds(newBounds);
    }
  }, []);

  const addMarker = useCallback((markerData: MarkerData) => {
    if (!mapRef.current || !window.AMap) return;

    const existingMarker = markersRef.current.get(markerData.id);
    if (existingMarker) {
      existingMarker.setMap(null);
    }

    const marker = new window.AMap.Marker({
      position: markerData.position,
      title: markerData.title,
      extData: markerData.data,
    });

    marker.setMap(mapRef.current);
    markersRef.current.set(markerData.id, marker);
  }, []);

  const removeMarker = useCallback((id: string) => {
    const marker = markersRef.current.get(id);
    if (marker) {
      marker.setMap(null);
      markersRef.current.delete(id);
    }
  }, []);

  const addPolyline = useCallback((polylineData: PolylineData) => {
    if (!mapRef.current || !window.AMap) return;

    const existingPolyline = polylinesRef.current.get(polylineData.id);
    if (existingPolyline) {
      existingPolyline.setMap(null);
    }

    const polyline = new window.AMap.Polyline({
      path: polylineData.path,
      strokeColor: polylineData.color || '#2563EB',
      strokeWeight: polylineData.weight || 4,
      strokeOpacity: polylineData.opacity || 0.8,
      strokeStyle: polylineData.style || 'solid',
    });

    polyline.setMap(mapRef.current);
    polylinesRef.current.set(polylineData.id, polyline);
  }, []);

  const removePolyline = useCallback((id: string) => {
    const polyline = polylinesRef.current.get(id);
    if (polyline) {
      polyline.setMap(null);
      polylinesRef.current.delete(id);
    }
  }, []);

  const clearAll = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current.clear();
  }, []);

  const fitView = useCallback((markers?: MarkerData[]) => {
    if (!mapRef.current) return;

    if (markers && markers.length > 0) {
      const markerObjects = markers
        .map((m) => markersRef.current.get(m.id))
        .filter(Boolean);
      if (markerObjects.length > 0) {
        mapRef.current.setFitView(markerObjects);
      }
    } else {
      mapRef.current.setFitView();
    }
  }, []);

  const initMap = useCallback((container: HTMLElement, options?: MapOptions) => {
    if (!window.AMap) return null;

    const mapInstance = new window.AMap.Map(container, {
      zoom: options?.zoom ?? 11,
      center: options?.center,
      viewMode: options?.viewMode ?? '2D',
      pitch: options?.pitch,
      rotation: options?.rotation,
      mapStyle: options?.mapStyle,
      features: options?.features,
    });

    mapRef.current = mapInstance;
    setMap(mapInstance);

    return mapInstance;
  }, []);

  const value: MapContextValue = {
    map,
    isLoaded,
    error,
    setCenter,
    setZoom,
    setBounds,
    addMarker,
    removeMarker,
    addPolyline,
    removePolyline,
    clearAll,
    fitView,
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

interface MapProps {
  options?: MapOptions;
  className?: string;
  style?: React.CSSProperties;
  onMapReady?: (map: any) => void;
  onClick?: (lnglat: [number, number]) => void;
  onZoomChange?: (zoom: number) => void;
}

export function Map({ options, className, style, onMapReady, onClick, onZoomChange }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoaded, error, map } = useMapContext();
  const initRef = useRef(false);

  useEffect(() => {
    if (isLoaded && containerRef.current && !initRef.current) {
      initRef.current = true;
      const mapInstance = new window.AMap.Map(containerRef.current, {
        zoom: options?.zoom ?? 11,
        center: options?.center,
        viewMode: options?.viewMode ?? '2D',
        pitch: options?.pitch,
        rotation: options?.rotation,
        mapStyle: options?.mapStyle,
        features: options?.features,
      });

      if (onClick) {
        mapInstance.on('click', (e: any) => {
          onClick([e.lnglat.lng, e.lnglat.lat]);
        });
      }

      if (onZoomChange) {
        mapInstance.on('zoomchange', () => {
          onZoomChange(mapInstance.getZoom());
        });
      }

      onMapReady?.(mapInstance);
    }
  }, [isLoaded, options, onMapReady, onClick, onZoomChange]);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-red-50 text-red-600 rounded-lg p-4" style={style}>
        地图加载失败: {error.message}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-50 text-gray-500 rounded-lg" style={style}>
        地图加载中...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}
