import axios from 'axios';
import redis from '../../config/redis';
import { config } from '../../config';

const AMAP_API_URL = 'https://restapi.amap.com/v3';

function debugLog(...args: unknown[]): void {
  if (process.env.TRAVEL_CLI === "true") return;
  console.log(...args);
}

interface AMapGeocodeResponse {
  status: string;
  geocodes: Array<{
    formatted_address: string;
    province: string;
    city: string;
    district: string;
    location: string;
    level: string;
  }>;
}

interface AMapPOISearchResponse {
  status: string;
  pois: Array<{
    id: string;
    name: string;
    type: string;
    typecode: string;
    address: string;
    location: string;
    pname: string;
    cityname: string;
    adname: string;
    tel: string;
    photos: Array<{ url: string }>;
    rating: string;
    cost: string;
  }>;
  count: string;
}

interface AMapPOIDetailResponse {
  status: string;
  pois: Array<{
    id: string;
    name: string;
    type: string;
    typecode: string;
    address: string;
    location: string;
    pname: string;
    cityname: string;
    adname: string;
    tel: string;
    photos: Array<{ url: string }>;
    rating: string;
    cost: string;
    biz_ext: {
      rating: string;
      cost: string;
      meal_sign: string;
    };
    indoor_map: string;
    indoor_data: {
      cpinfo: string;
    };
  }>;
}

interface AMapRouteResponse {
  status: string;
  route: {
    paths: Array<{
      distance: string;
      duration: string;
      steps: Array<{
        instruction: string;
        road: string;
        distance: string;
        duration: string;
        polyline: string;
      }>;
    }>;
  };
}

export class AMapApi {
  private async getCachedData(key: string): Promise<string | null> {
    try {
      if (!redis) return null;
      return await redis.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  private async setCachedData(key: string, value: string, ttl: number = 86400): Promise<void> {
    try {
      if (!redis) return;
      await redis.setex(key, ttl, value);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    const cacheKey = `geocode:${address}`;
    const cached = await this.getCachedData(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await axios.get<AMapGeocodeResponse>(`${AMAP_API_URL}/geocode/geo`, {
        params: {
          address,
          key: config.apis.amap.apiKey,
        },
      });

      if (response.data.status !== '1' || !response.data.geocodes?.length) {
        return null;
      }

      const [lng, lat] = response.data.geocodes[0].location.split(',').map(parseFloat);
      const result = { lat, lng };

      await this.setCachedData(cacheKey, JSON.stringify(result), 604800);
      return result;
    } catch (error) {
      console.error('Geocode error:', error);
      return null;
    }
  }

  async searchPOI(
    keywords: string,
    location: string,
    types?: string,
    radius?: number,
    page: number = 1,
    pageSize: number = 20,
    city?: string
  ): Promise<AMapPOISearchResponse | null> {
    const cacheKey = `poi:search:${keywords}:${location}:${types}:${radius}:${page}:${pageSize}:${city}`;
    const cached = await this.getCachedData(cacheKey);

    if (cached) {
      debugLog('[AMAP API] Returning cached result for key:', cacheKey);
      return JSON.parse(cached);
    }

    try {
      const params: Record<string, any> = {
        keywords,
        key: config.apis.amap.apiKey,
        offset: pageSize,
        page,
        extensions: 'all',
      };

      if (types) params.types = types;

      const useAroundSearch = location && location.trim() !== '';

      if (useAroundSearch) {
        params.location = location;
        if (radius) params.radius = radius;
      } else if (city) {
        params.city = city;
        params.citylimit = true;
      }

      const endpoint = useAroundSearch ? 'place/around' : 'place/text';
      debugLog(`[AMAP API] Searching POI via /${endpoint} with params:`, params);

      const response = await axios.get<AMapPOISearchResponse>(
        `${AMAP_API_URL}/${endpoint}`,
        { params }
      );

      debugLog('[AMAP API] Response status:', response.data.status, 'count:', response.data.count, 'pois length:', response.data.pois?.length);

      if (response.data.status !== '1') {
        console.error('[AMAP API] Search failed:', response.data);
        return null;
      }

      await this.setCachedData(cacheKey, JSON.stringify(response.data), 86400);
      return response.data;
    } catch (error) {
      console.error('Search POI error:', error);
      return null;
    }
  }

  async getPOIDetail(id: string): Promise<AMapPOIDetailResponse | null> {
    const cacheKey = `poi:detail:${id}`;
    const cached = await this.getCachedData(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await axios.get<AMapPOIDetailResponse>(`${AMAP_API_URL}/place/detail`, {
        params: {
          id,
          key: config.apis.amap.apiKey,
          extensions: 'all',
        },
      });

      if (response.data.status !== '1') {
        return null;
      }

      await this.setCachedData(cacheKey, JSON.stringify(response.data), 604800);
      return response.data;
    } catch (error) {
      console.error('Get POI detail error:', error);
      return null;
    }
  }

  async getRoute(
    origin: string,
    destination: string,
    mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
  ): Promise<AMapRouteResponse | null> {
    const cacheKey = `route:${mode}:${origin}:${destination}`;
    const cached = await this.getCachedData(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const endpoint = mode === 'transit' ? 'transit/integrated' : mode;
      const response = await axios.get<AMapRouteResponse>(
        `${AMAP_API_URL}/direction/${endpoint}`,
        {
          params: {
            origin,
            destination,
            key: config.apis.amap.apiKey,
            extensions: 'all',
          },
        }
      );

      if (response.data.status !== '1') {
        return null;
      }

      await this.setCachedData(cacheKey, JSON.stringify(response.data), 86400);
      return response.data;
    } catch (error) {
      console.error('Get route error:', error);
      return null;
    }
  }

  async getDistance(
    origins: string,
    destination: string,
    type: '0' | '1' | '3' = '0'
  ): Promise<{ distance: number; duration: number }[] | null> {
    try {
      const response = await axios.get(`${AMAP_API_URL}/distance`, {
        params: {
          origins,
          destination,
          type,
          key: config.apis.amap.apiKey,
        },
      });

      if (response.data.status !== '1') {
        return null;
      }

      return response.data.results.map((r: any) => ({
        distance: parseInt(r.distance),
        duration: parseInt(r.duration),
      }));
    } catch (error) {
      console.error('Get distance error:', error);
      return null;
    }
  }
}

export const amapApi = new AMapApi();
