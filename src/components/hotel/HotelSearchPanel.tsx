'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Hotel, HotelSearchParams } from '@/types/hotel';
import { searchHotels } from '@/lib/api/hotel';
import { HotelList } from '@/components/hotel/HotelCard';
import { Search, Filter, Star, DollarSign } from 'lucide-react';

interface HotelFilterProps {
  onFilterChange: (params: Partial<HotelSearchParams>) => void;
}

export function HotelFilter({ onFilterChange }: HotelFilterProps) {
  const [filters, setFilters] = useState({
    starRatings: [] as number[],
    minPrice: '',
    maxPrice: '',
    minRating: '',
    sortBy: 'rating' as const,
  });

  const handleStarToggle = (star: number) => {
    const newStars = filters.starRatings.includes(star)
      ? filters.starRatings.filter((s) => s !== star)
      : [...filters.starRatings, star];
    
    setFilters({ ...filters, starRatings: newStars });
    onFilterChange({ starRatings: newStars.length > 0 ? newStars : undefined });
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange({
      minPrice: newFilters.minPrice ? parseInt(newFilters.minPrice) : undefined,
      maxPrice: newFilters.maxPrice ? parseInt(newFilters.maxPrice) : undefined,
      minRating: newFilters.minRating ? parseFloat(newFilters.minRating) : undefined,
      sortBy: newFilters.sortBy,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-900">筛选</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-600 mb-2 block">酒店星级</label>
          <div className="flex gap-2">
            {[5, 4, 3, 2].map((star) => (
              <Button
                key={star}
                variant={filters.starRatings.includes(star) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStarToggle(star)}
              >
                {star}星级
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">价格区间</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="最低价"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="最高价"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">最低评分</label>
          <div className="flex gap-2">
            {[4.5, 4.0, 3.5, 3.0].map((rating) => (
              <Button
                key={rating}
                variant={filters.minRating === rating.toString() ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('minRating', rating.toString())}
              >
                {rating}+
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">排序方式</label>
          <div className="flex gap-2">
            {[
              { value: 'rating', label: '评分' },
              { value: 'price', label: '价格' },
              { value: 'distance', label: '距离' },
              { value: 'star', label: '星级' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={filters.sortBy === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('sortBy', option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface HotelSearchPanelProps {
  location?: string;
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  onHotelSelect?: (hotel: Hotel) => void;
  onSelect?: (hotel: Hotel) => void;
}

export function HotelSearchPanel({
  location = '',
  destination = '',
  checkIn = '',
  checkOut = '',
  onHotelSelect,
  onSelect,
}: HotelSearchPanelProps) {
  const [searchParams, setSearchParams] = useState<HotelSearchParams>({
    location: location || destination,
    checkIn,
    checkOut,
  });
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchParams.location || !searchParams.checkIn || !searchParams.checkOut) {
      return;
    }

    setLoading(true);
    try {
      const result = await searchHotels(searchParams);
      setHotels(result.hotels);
      setSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: Partial<HotelSearchParams>) => {
    setSearchParams((prev) => ({ ...prev, ...filters }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">目的地</label>
            <input
              type="text"
              value={searchParams.location}
              onChange={(e) => setSearchParams((p) => ({ ...p, location: e.target.value }))}
              placeholder="如：北京"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">入住日期</label>
            <input
              type="date"
              value={searchParams.checkIn}
              onChange={(e) => setSearchParams((p) => ({ ...p, checkIn: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">退房日期</label>
            <input
              type="date"
              value={searchParams.checkOut}
              onChange={(e) => setSearchParams((p) => ({ ...p, checkOut: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} className="w-full" disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? '搜索中...' : '搜索酒店'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <HotelFilter onFilterChange={handleFilterChange} />
        </div>
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12 text-gray-500">搜索中...</div>
          ) : searched ? (
            <HotelList hotels={hotels} onSelect={onSelect || onHotelSelect} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              请输入目的地、入住和退房日期搜索酒店
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
