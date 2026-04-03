'use client';

import React from 'react';
import { useMapContext } from './AMapProvider';
import { MarkerData } from '@/types/map';

interface MarkerProps {
  data: MarkerData;
  onClick?: (data: MarkerData) => void;
  renderContent?: (data: MarkerData) => React.ReactNode;
}

const markerColors: Record<string, string> = {
  attraction: '#EF4444',
  restaurant: '#F59E0B',
  hotel: '#2563EB',
  start: '#10B981',
  end: '#EF4444',
  waypoint: '#64748B',
};

const markerIcons: Record<string, string> = {
  attraction: '📍',
  restaurant: '🍜',
  hotel: '🏨',
  start: '🚩',
  end: '🏁',
  waypoint: '📍',
};

export function Marker({ data, onClick, renderContent }: MarkerProps) {
  const { map, isLoaded } = useMapContext();
  const markerRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!map || !isLoaded || !window.AMap) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const color = data.color || markerColors[data.type] || '#2563EB';
    const icon = data.icon || markerIcons[data.type] || '📍';

    const content = renderContent ? renderContent(data) : `
      <div style="
        background: ${color};
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${icon} ${data.title}
      </div>
    `;

    markerRef.current = new window.AMap.Marker({
      position: data.position,
      content: content,
      offset: new window.AMap.Pixel(-15, -15),
      extData: data,
    });

    if (onClick) {
      markerRef.current.on('click', () => {
        onClick(data);
      });
    }

    markerRef.current.setMap(map);

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, isLoaded, data, onClick, renderContent]);

  return null;
}

interface MarkerListProps {
  markers: MarkerData[];
  onMarkerClick?: (data: MarkerData) => void;
  renderMarkerContent?: (data: MarkerData) => React.ReactNode;
}

export function MarkerList({ markers, onMarkerClick, renderMarkerContent }: MarkerListProps) {
  return (
    <>
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          data={marker}
          onClick={onMarkerClick}
          renderContent={renderMarkerContent}
        />
      ))}
    </>
  );
}
