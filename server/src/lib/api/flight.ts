import axios from 'axios';
import redis from '../../config/redis';
import { config } from '../../config';
import {
  Flight,
  FlightSearchResult,
  FlightSearchParams,
  FlightDetail,
  FlightPriceComparison,
  Airline,
  Airport,
} from '../../types/flight';

const FLIGHT_API_URL = 'https://api.aviationstack.com/v1';

interface AviationStackResponse {
  pagination: {
    count: number;
    total: number;
  };
  data: any[];
}

const AIRLINES_CACHE: Record<string, Airline> = {
  CA: { code: 'CA', name: '中国国际航空', logo: '', alliance: 'Star Alliance' },
  MU: { code: 'MU', name: '中国东方航空', logo: '', alliance: 'SkyTeam' },
  CZ: { code: 'CZ', name: '中国南方航空', logo: '', alliance: 'SkyTeam' },
  HU: { code: 'HU', name: '海南航空', logo: '', alliance: '' },
  FM: { code: 'FM', name: '上海航空', logo: '', alliance: 'SkyTeam' },
  ZH: { code: 'ZH', name: '深圳航空', logo: '', alliance: 'Star Alliance' },
  MF: { code: 'MF', name: '厦门航空', logo: '', alliance: 'SkyTeam' },
  SC: { code: 'SC', name: '山东航空', logo: '', alliance: '' },
  '3U': { code: '3U', name: '四川航空', logo: '', alliance: '' },
  KN: { code: 'KN', name: '中国联合航空', logo: '', alliance: '' },
};

const AIRPORTS_CACHE: Record<string, Airport> = {
  PEK: { code: 'PEK', name: '北京首都国际机场', city: '北京' },
  PKX: { code: 'PKX', name: '北京大兴国际机场', city: '北京' },
  SHA: { code: 'SHA', name: '上海虹桥国际机场', city: '上海' },
  PVG: { code: 'PVG', name: '上海浦东国际机场', city: '上海' },
  CAN: { code: 'CAN', name: '广州白云国际机场', city: '广州' },
  SZX: { code: 'SZX', name: '深圳宝安国际机场', city: '深圳' },
  CTU: { code: 'CTU', name: '成都双流国际机场', city: '成都' },
  CKG: { code: 'CKG', name: '重庆江北国际机场', city: '重庆' },
  HGH: { code: 'HGH', name: '杭州萧山国际机场', city: '杭州' },
  XIY: { code: 'XIY', name: '西安咸阳国际机场', city: '西安' },
  KMG: { code: 'KMG', name: '昆明长水国际机场', city: '昆明' },
  NKG: { code: 'NKG', name: '南京禄口国际机场', city: '南京' },
  WUH: { code: 'WUH', name: '武汉天河国际机场', city: '武汉' },
  CSX: { code: 'CSX', name: '长沙黄花国际机场', city: '长沙' },
  TA0: { code: 'TAO', name: '青岛胶东国际机场', city: '青岛' },
};

export class FlightApi {
  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      if (!redis) return null;
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  private async setCachedData<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      if (!redis) return;
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  private getAirline(code: string): Airline {
    return AIRLINES_CACHE[code] || { code, name: code, logo: '', alliance: '' };
  }

  private getAirport(code: string): Airport {
    return AIRPORTS_CACHE[code] || { code, name: code, city: code };
  }

  private generateMockFlights(params: FlightSearchParams): Flight[] {
    const flights: Flight[] = [];
    const originAirport = this.getAirport(params.origin);
    const destAirport = this.getAirport(params.destination);
    const basePrice = 500 + Math.random() * 1000;

    const airlines = Object.keys(AIRLINES_CACHE);
    const numFlights = Math.floor(Math.random() * 10) + 5;

    for (let i = 0; i < numFlights; i++) {
      const airline = this.getAirline(airlines[Math.floor(Math.random() * airlines.length)]);
      const departureHour = 6 + Math.floor(Math.random() * 14);
      const duration = 60 + Math.floor(Math.random() * 180);
      const price = Math.round(basePrice + (Math.random() - 0.5) * 500);

      flights.push({
        id: `FL${Date.now()}${i}`,
        flightNumber: `${airline.code}${1000 + Math.floor(Math.random() * 9000)}`,
        airline,
        departure: {
          airport: originAirport,
          time: `${departureHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          terminal: `T${Math.floor(Math.random() * 3) + 1}`,
        },
        arrival: {
          airport: destAirport,
          time: `${((departureHour + Math.floor(duration / 60)) % 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          terminal: `T${Math.floor(Math.random() * 3) + 1}`,
        },
        duration: duration,
        price: {
          amount: price,
          currency: 'CNY',
          taxIncluded: true,
        },
        seatsAvailable: Math.floor(Math.random() * 50) + 1,
        class: params.class || 'economy',
        stops: Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0,
        meal: Math.random() > 0.3,
        wifi: Math.random() > 0.5,
      });
    }

    return flights.sort((a, b) => a.price.amount - b.price.amount);
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
    const cacheKey = `flights:search:${JSON.stringify(params)}`;
    const cached = await this.getCachedData<FlightSearchResult>(cacheKey);
    if (cached) return cached;

    try {
      const flights = this.generateMockFlights(params);

      let filteredFlights = flights;

      if (params.directOnly) {
        filteredFlights = filteredFlights.filter((f) => f.stops === 0);
      }

      if (params.maxStops !== undefined) {
        filteredFlights = filteredFlights.filter((f) => f.stops <= params.maxStops!);
      }

      if (params.minPrice !== undefined) {
        filteredFlights = filteredFlights.filter((f) => f.price.amount >= params.minPrice!);
      }

      if (params.maxPrice !== undefined) {
        filteredFlights = filteredFlights.filter((f) => f.price.amount <= params.maxPrice!);
      }

      if (params.preferredAirlines && params.preferredAirlines.length > 0) {
        filteredFlights = filteredFlights.filter((f) =>
          params.preferredAirlines!.includes(f.airline.code)
        );
      }

      if (params.sortBy) {
        filteredFlights.sort((a, b) => {
          let comparison = 0;
          switch (params.sortBy) {
            case 'price':
              comparison = a.price.amount - b.price.amount;
              break;
            case 'duration':
              comparison = a.duration - b.duration;
              break;
            case 'departure':
              comparison = a.departure.time.localeCompare(b.departure.time);
              break;
            case 'arrival':
              comparison = a.arrival.time.localeCompare(b.arrival.time);
              break;
          }
          return params.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const paginatedFlights = filteredFlights.slice(startIndex, startIndex + pageSize);

      const result: FlightSearchResult = {
        flights: paginatedFlights,
        total: filteredFlights.length,
        hasMore: startIndex + pageSize < filteredFlights.length,
        cheapestPrice: filteredFlights[0]?.price.amount,
        fastestDuration: Math.min(...filteredFlights.map((f) => f.duration)),
      };

      await this.setCachedData(cacheKey, result, 1800);
      return result;
    } catch (error) {
      console.error('Search flights error:', error);
      throw error;
    }
  }

  async getFlightDetail(id: string): Promise<FlightDetail | null> {
    const cacheKey = `flights:detail:${id}`;
    const cached = await this.getCachedData<FlightDetail>(cacheKey);
    if (cached) return cached;

    return null;
  }

  async getPriceComparison(flightId: string): Promise<FlightPriceComparison | null> {
    const cacheKey = `flights:compare:${flightId}`;
    const cached = await this.getCachedData<FlightPriceComparison>(cacheKey);
    if (cached) return cached;

    return null;
  }

  async getAirlines(): Promise<Airline[]> {
    return Object.values(AIRLINES_CACHE);
  }

  async getAirports(): Promise<Airport[]> {
    return Object.values(AIRPORTS_CACHE);
  }
}

export const flightApi = new FlightApi();
