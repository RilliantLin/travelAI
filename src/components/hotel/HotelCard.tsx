'use client';

import React from 'react';
import { Hotel } from '@/types/hotel';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Wifi, Car, Coffee, Dumbbell } from 'lucide-react';

interface HotelCardProps {
  hotel: Hotel;
  onSelect?: (hotel: Hotel) => void;
  showRating?: boolean;
}

const amenityIcons: Record<string, React.ReactNode> = {
  '免费WiFi': <Wifi className="w-4 h-4" />,
  '停车场': <Car className="w-4 h-4" />,
  '餐厅': <Coffee className="w-4 h-4" />,
  '健身房': <Dumbbell className="w-4 h-4" />,
};

export function HotelCard({ hotel, onSelect, showRating = true }: HotelCardProps) {
  const formatPrice = (price: Hotel['price']) => {
    if (!price) return '价格待定';
    return `¥${price.amount.toLocaleString()}`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const mainImage = hotel.images?.[0]?.url || '/placeholder-hotel.jpg';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <img
          src={mainImage}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        {hotel.price?.discount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded">
            -{hotel.price.discount}%
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{hotel.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {renderStars(hotel.starRating)}
              {showRating && hotel.rating && (
                <span className="text-sm text-gray-500">
                  {hotel.rating.score}分 ({hotel.rating.count}条评价)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{hotel.location.address || hotel.location.city}</span>
          {hotel.distance && (
            <span className="ml-2 text-blue-600">
              {hotel.distance < 1000 ? `${hotel.distance}m` : `${(hotel.distance / 1000).toFixed(1)}km`}
            </span>
          )}
        </div>

        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="flex items-center gap-3 mb-4 text-gray-500">
            {hotel.amenities.slice(0, 4).map((amenity, index) => (
              <div key={index} className="flex items-center gap-1 text-xs">
                {amenityIcons[amenity] || <span>•</span>}
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-blue-600">{formatPrice(hotel.price)}</span>
            {hotel.price?.perNight && (
              <span className="text-sm text-gray-500">/晚</span>
            )}
          </div>
          <Button onClick={() => onSelect?.(hotel)} size="sm">
            查看详情
          </Button>
        </div>
      </div>
    </div>
  );
}

interface HotelListProps {
  hotels: Hotel[];
  onSelect?: (hotel: Hotel) => void;
  showRating?: boolean;
}

export function HotelList({ hotels, onSelect, showRating = true }: HotelListProps) {
  if (hotels.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>暂无符合条件的酒店</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hotels.map((hotel) => (
        <HotelCard
          key={hotel.id}
          hotel={hotel}
          onSelect={onSelect}
          showRating={showRating}
        />
      ))}
    </div>
  );
}
