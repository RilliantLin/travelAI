'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flight, FlightSearchParams } from '@/types/flight';
import { searchFlights } from '@/lib/api/flight';
import { FlightList } from '@/components/flight/FlightCard';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface FlightFilterProps {
  onFilterChange: (params: Partial<FlightSearchParams>) => void;
}

export function FlightFilter({ onFilterChange }: FlightFilterProps) {
  const [filters, setFilters] = useState({
    directOnly: false,
    maxStops: 2,
    minPrice: '',
    maxPrice: '',
    class: 'economy' as const,
    sortBy: 'price' as const,
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange({
      directOnly: newFilters.directOnly,
      maxStops: newFilters.maxStops,
      minPrice: newFilters.minPrice ? parseInt(newFilters.minPrice) : undefined,
      maxPrice: newFilters.maxPrice ? parseInt(newFilters.maxPrice) : undefined,
      class: newFilters.class,
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
          <label className="text-sm text-gray-600 mb-2 block">舱位等级</label>
          <div className="flex gap-2">
            {[
              { value: 'economy', label: '经济舱' },
              { value: 'premium_economy', label: '超经' },
              { value: 'business', label: '商务舱' },
              { value: 'first', label: '头等舱' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={filters.class === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('class', option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">中转次数</label>
          <div className="flex gap-2">
            <Button
              variant={filters.directOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('directOnly', !filters.directOnly)}
            >
              直飞
            </Button>
            <Button
              variant={!filters.directOnly && filters.maxStops === 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => { handleFilterChange('directOnly', false); handleFilterChange('maxStops', 1); }}
            >
              1次中转
            </Button>
            <Button
              variant={!filters.directOnly && filters.maxStops === 2 ? 'default' : 'outline'}
              size="sm"
              onClick={() => { handleFilterChange('directOnly', false); handleFilterChange('maxStops', 2); }}
            >
              2次中转
            </Button>
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
          <label className="text-sm text-gray-600 mb-2 block">排序方式</label>
          <div className="flex gap-2">
            {[
              { value: 'price', label: '价格' },
              { value: 'duration', label: '时长' },
              { value: 'departure', label: '起飞时间' },
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

interface FlightSearchPanelProps {
  origin?: string;
  destination?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  onSelect?: (flight: Flight) => void;
}

export function FlightSearchPanel({
  origin = '',
  destination = '',
  date = '',
  startDate,
  endDate,
  onSelect,
}: FlightSearchPanelProps) {
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    origin,
    destination,
    departureDate: date || startDate || '',
  });
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
      return;
    }

    setLoading(true);
    try {
      const result = await searchFlights(searchParams);
      setFlights(result.flights);
      setSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: Partial<FlightSearchParams>) => {
    setSearchParams((prev) => ({ ...prev, ...filters }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">出发城市</label>
            <input
              type="text"
              value={searchParams.origin}
              onChange={(e) => setSearchParams((p) => ({ ...p, origin: e.target.value }))}
              placeholder="如：北京"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">到达城市</label>
            <input
              type="text"
              value={searchParams.destination}
              onChange={(e) => setSearchParams((p) => ({ ...p, destination: e.target.value }))}
              placeholder="如：上海"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">出发日期</label>
            <input
              type="date"
              value={searchParams.departureDate}
              onChange={(e) => setSearchParams((p) => ({ ...p, departureDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} className="w-full" disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? '搜索中...' : '搜索航班'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FlightFilter onFilterChange={handleFilterChange} />
        </div>
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12 text-gray-500">搜索中...</div>
          ) : searched ? (
            <FlightList flights={flights} onSelect={onSelect} showDetails />
          ) : (
            <div className="text-center py-12 text-gray-500">
              请输入出发城市、到达城市和日期搜索航班
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
