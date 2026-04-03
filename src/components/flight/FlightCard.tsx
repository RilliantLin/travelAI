'use client';

import React from 'react';
import { Flight } from '@/types/flight';
import { Button } from '@/components/ui/button';
import { Plane, Clock, Luggage, Wifi, Coffee, ArrowRight } from 'lucide-react';

interface FlightCardProps {
  flight: Flight;
  onSelect?: (flight: Flight) => void;
  showDetails?: boolean;
}

export function FlightCard({ flight, onSelect, showDetails = false }: FlightCardProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatPrice = (price: Flight['price']) => {
    return `¥${price.amount.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {flight.airline.logo ? (
            <img src={flight.airline.logo} alt={flight.airline.name} className="w-8 h-8 rounded" />
          ) : (
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <Plane className="w-4 h-4 text-blue-600" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{flight.airline.name}</p>
            <p className="text-sm text-gray-500">{flight.flightNumber}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-blue-600">{formatPrice(flight.price)}</p>
          {flight.price.originalPrice && flight.price.originalPrice > flight.price.amount && (
            <p className="text-sm text-gray-400 line-through">
              ¥{flight.price.originalPrice.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{flight.departure.time}</p>
          <p className="text-sm text-gray-500">{flight.departure.airport.code}</p>
          {flight.departure.terminal && (
            <p className="text-xs text-gray-400">{flight.departure.terminal}</p>
          )}
        </div>

        <div className="flex-1 mx-4">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-1">
            <span>{formatDuration(flight.duration)}</span>
            {flight.stops > 0 && (
              <span className="text-orange-500">{flight.stops}次中转</span>
            )}
          </div>
          <div className="relative">
            <div className="h-0.5 bg-gray-200 w-full"></div>
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Plane className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{flight.arrival.time}</p>
          <p className="text-sm text-gray-500">{flight.arrival.airport.code}</p>
          {flight.arrival.terminal && (
            <p className="text-xs text-gray-400">{flight.arrival.terminal}</p>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 py-3 border-t border-b border-gray-100">
          {flight.meal && (
            <div className="flex items-center gap-1">
              <Coffee className="w-4 h-4" />
              <span>含餐</span>
            </div>
          )}
          {flight.wifi && (
            <div className="flex items-center gap-1">
              <Wifi className="w-4 h-4" />
              <span>WiFi</span>
            </div>
          )}
          {flight.baggage && (
            <div className="flex items-center gap-1">
              <Luggage className="w-4 h-4" />
              <span>托运{flight.baggage.checked.weight}kg</span>
            </div>
          )}
          {flight.seatsAvailable && flight.seatsAvailable < 10 && (
            <span className="text-orange-500">仅剩{flight.seatsAvailable}座</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {flight.class === 'economy' && '经济舱'}
          {flight.class === 'premium_economy' && '超级经济舱'}
          {flight.class === 'business' && '商务舱'}
          {flight.class === 'first' && '头等舱'}
        </div>
        <Button onClick={() => onSelect?.(flight)} size="sm">
          选择航班
        </Button>
      </div>
    </div>
  );
}

interface FlightListProps {
  flights: Flight[];
  onSelect?: (flight: Flight) => void;
  showDetails?: boolean;
}

export function FlightList({ flights, onSelect, showDetails = false }: FlightListProps) {
  if (flights.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Plane className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>暂无符合条件的航班</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {flights.map((flight) => (
        <FlightCard
          key={flight.id}
          flight={flight}
          onSelect={onSelect}
          showDetails={showDetails}
        />
      ))}
    </div>
  );
}
