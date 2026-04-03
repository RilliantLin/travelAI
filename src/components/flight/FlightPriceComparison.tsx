'use client';

import React from 'react';
import { Flight } from '@/types/flight';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';

interface FlightPriceComparisonProps {
  flightId: string;
  currentPrice: number;
  prices?: {
    source: string;
    price: number;
    url?: string;
    lastUpdated: string;
  }[];
  priceHistory?: {
    date: string;
    price: number;
  }[];
}

export function FlightPriceComparison({
  flightId,
  currentPrice,
  prices = [],
  priceHistory = [],
}: FlightPriceComparisonProps) {
  const mockPrices = prices.length > 0 ? prices : [
    { source: '携程', price: currentPrice + 50, lastUpdated: new Date().toISOString() },
    { source: '去哪儿', price: currentPrice - 30, lastUpdated: new Date().toISOString() },
    { source: '飞猪', price: currentPrice + 20, lastUpdated: new Date().toISOString() },
    { source: '同程', price: currentPrice, lastUpdated: new Date().toISOString() },
  ];

  const mockHistory = priceHistory.length > 0 ? priceHistory : generateMockHistory(currentPrice);

  const minPrice = Math.min(...mockPrices.map((p) => p.price));
  const maxPrice = Math.max(...mockPrices.map((p) => p.price));
  const priceRange = maxPrice - minPrice;

  const trend = mockHistory.length >= 2
    ? mockHistory[mockHistory.length - 1].price > mockHistory[mockHistory.length - 2].price
      ? 'up'
      : mockHistory[mockHistory.length - 1].price < mockHistory[mockHistory.length - 2].price
      ? 'down'
      : 'stable'
    : 'stable';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">价格对比</h3>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-500">价格趋势</span>
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
          {trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
        </div>
        <div className="h-24 flex items-end gap-1">
          {mockHistory.slice(-14).map((item, index) => {
            const height = ((item.price - minPrice + 50) / (maxPrice - minPrice + 100)) * 100;
            return (
              <div
                key={index}
                className="flex-1 bg-blue-100 rounded-t"
                style={{ height: `${height}%` }}
                title={`¥${item.price}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{mockHistory[0]?.date}</span>
          <span>{mockHistory[mockHistory.length - 1]?.date}</span>
        </div>
      </div>

      <div className="space-y-3">
        {mockPrices.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg ${
              item.price === minPrice ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-900">{item.source}</span>
              {item.price === minPrice && (
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                  最低价
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-bold ${
                  item.price === minPrice ? 'text-green-600' : 'text-gray-900'
                }`}
              >
                ¥{item.price.toLocaleString()}
              </span>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        价格更新时间: {new Date().toLocaleString()}
      </p>
    </div>
  );
}

function generateMockHistory(basePrice: number) {
  const history = [];
  const today = new Date();
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(basePrice + (Math.random() - 0.5) * 100),
    });
  }
  
  return history;
}
