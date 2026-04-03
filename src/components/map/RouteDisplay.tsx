'use client';

import React from 'react';
import { useMapContext } from './AMapProvider';
import { PolylineData, RouteData } from '@/types/map';

interface PolylineProps {
  data: PolylineData;
  onClick?: (data: PolylineData) => void;
}

export function Polyline({ data, onClick }: PolylineProps) {
  const { map, isLoaded } = useMapContext();
  const polylineRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!map || !isLoaded || !window.AMap) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    polylineRef.current = new window.AMap.Polyline({
      path: data.path,
      strokeColor: data.color || '#2563EB',
      strokeWeight: data.weight || 4,
      strokeOpacity: data.opacity ?? 0.8,
      strokeStyle: data.style || 'solid',
      lineJoin: 'round',
      lineCap: 'round',
    });

    if (onClick) {
      polylineRef.current.on('click', () => {
        onClick(data);
      });
    }

    polylineRef.current.setMap(map);

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, isLoaded, data, onClick]);

  return null;
}

interface RouteDisplayProps {
  route: RouteData;
  showSteps?: boolean;
  onStepClick?: (stepIndex: number) => void;
}

export function RouteDisplay({ route, showSteps = false, onStepClick }: RouteDisplayProps) {
  const { map, isLoaded, addPolyline, addMarker } = useMapContext();

  React.useEffect(() => {
    if (!map || !isLoaded) return;

    if (route.polyline) {
      addPolyline(route.polyline);
    }

    addMarker({
      id: `${route.id}-origin`,
      position: route.origin,
      type: 'start',
      title: '起点',
    });

    addMarker({
      id: `${route.id}-destination`,
      position: route.destination,
      type: 'end',
      title: '终点',
    });

    if (route.waypoints) {
      route.waypoints.forEach((wp, index) => {
        addMarker({
          id: `${route.id}-waypoint-${index}`,
          position: wp,
          type: 'waypoint',
          title: `途经点 ${index + 1}`,
        });
      });
    }
  }, [map, isLoaded, route, addPolyline, addMarker]);

  if (!showSteps || !route.steps) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-h-64 overflow-y-auto">
      <h4 className="font-medium text-gray-900 mb-2">路线详情</h4>
      <ul className="space-y-2">
        {route.steps.map((step, index) => (
          <li
            key={index}
            className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded"
            onClick={() => onStepClick?.(index)}
          >
            <span className="font-medium text-gray-900">{index + 1}.</span> {step.instruction}
            <span className="text-gray-400 ml-2">
              {step.distance}m · {Math.ceil(step.duration / 60)}分钟
            </span>
          </li>
        ))}
      </ul>
      {route.distance && route.duration && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
          总距离: {(route.distance / 1000).toFixed(1)}km · 
          总时间: {Math.ceil(route.duration / 60)}分钟
        </div>
      )}
    </div>
  );
}
