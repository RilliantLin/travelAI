import axios from 'axios';
import redis from '../../config/redis';
import { config } from '../../config';
import {
  Hotel,
  HotelSearchResult,
  HotelSearchParams,
  HotelDetail,
  HotelPriceComparison,
  RoomType,
} from '../../types/hotel';

const AMAP_API_URL = 'https://restapi.amap.com/v3';

interface AMapPOIResponse {
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
    };
    indoor_data: {
      cpinfo: string;
    };
  }>;
  count: string;
}

const HOTEL_AMENITIES = [
  '免费WiFi',
  '停车场',
  '游泳池',
  '健身房',
  '餐厅',
  '会议室',
  'SPA',
  '洗衣服务',
  '接机服务',
  '行李寄存',
  '24小时前台',
  '无障碍设施',
];

const HOTEL_CHAINS = [
  '希尔顿',
  '万豪',
  '洲际',
  '凯悦',
  '香格里拉',
  '喜来登',
  '威斯汀',
  '丽思卡尔顿',
  '如家',
  '汉庭',
  '锦江之星',
  '7天',
  '全季',
  '亚朵',
];

export class HotelApi {
  private amapApiKey: string;

  constructor() {
    this.amapApiKey = config.apis.amap.apiKey || '';
  }

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

  private parseStarRating(typecode: string): number {
    if (typecode.startsWith('10')) return 5;
    if (typecode.startsWith('11')) return 4;
    if (typecode.startsWith('12')) return 3;
    if (typecode.startsWith('13')) return 2;
    return 3;
  }

  private generateRoomTypes(basePrice: number): RoomType[] {
    const roomTypes: RoomType[] = [
      {
        id: 'standard',
        name: '标准间',
        maxOccupancy: 2,
        bedType: '大床',
        bedCount: 1,
        price: {
          amount: basePrice,
          currency: 'CNY',
          perNight: true,
        },
        amenities: ['免费WiFi', '空调', '电视'],
        available: true,
        roomsLeft: Math.floor(Math.random() * 10) + 1,
      },
      {
        id: 'deluxe',
        name: '豪华间',
        maxOccupancy: 2,
        bedType: '大床',
        bedCount: 1,
        size: 35,
        sizeUnit: '㎡',
        price: {
          amount: Math.round(basePrice * 1.3),
          currency: 'CNY',
          perNight: true,
        },
        amenities: ['免费WiFi', '空调', '电视', '迷你吧', '浴缸'],
        available: true,
        roomsLeft: Math.floor(Math.random() * 8) + 1,
      },
      {
        id: 'suite',
        name: '套房',
        maxOccupancy: 4,
        bedType: '大床',
        bedCount: 1,
        size: 55,
        sizeUnit: '㎡',
        price: {
          amount: Math.round(basePrice * 2),
          currency: 'CNY',
          perNight: true,
        },
        amenities: ['免费WiFi', '空调', '电视', '迷你吧', '浴缸', '客厅', '厨房'],
        available: Math.random() > 0.3,
        roomsLeft: Math.floor(Math.random() * 5) + 1,
      },
    ];

    return roomTypes;
  }

  private transformPOIToHotel(poi: any, distance?: number): Hotel {
    const [lng, lat] = poi.location ? poi.location.split(',').map(parseFloat) : [0, 0];
    const starRating = this.parseStarRating(poi.typecode || '120000');
    const rating = parseFloat(poi.biz_ext?.rating || poi.rating || '4.0');
    const cost = parseInt(poi.biz_ext?.cost || poi.cost || '300');

    return {
      id: poi.id,
      name: poi.name,
      location: {
        lat,
        lng,
        address: poi.address || '',
        city: poi.cityname || '',
        province: poi.pname || '',
      },
      rating: {
        score: rating || 4.0,
        count: Math.floor(Math.random() * 1000) + 100,
      },
      starRating,
      price: {
        amount: cost,
        currency: 'CNY',
        perNight: true,
      },
      images: poi.photos?.map((p: any) => ({ url: p.url })) || [],
      contact: poi.tel ? { phone: poi.tel } : undefined,
      amenities: HOTEL_AMENITIES.slice(0, Math.floor(Math.random() * 6) + 3),
      checkInTime: '14:00',
      checkOutTime: '12:00',
      distance,
      popularity: Math.floor(Math.random() * 100),
    };
  }

  async searchHotels(params: HotelSearchParams): Promise<HotelSearchResult> {
    const cacheKey = `hotels:search:${JSON.stringify(params)}`;
    const cached = await this.getCachedData<HotelSearchResult>(cacheKey);
    if (cached) return cached;

    try {
      let location = params.location;
      if (params.lat && params.lng) {
        location = `${params.lng},${params.lat}`;
      }

      const response = await axios.get<AMapPOIResponse>(`${AMAP_API_URL}/place/around`, {
        params: {
          keywords: '酒店|宾馆|旅馆',
          location,
          key: this.amapApiKey,
          radius: params.radius || 10000,
          offset: params.pageSize || 20,
          page: params.page || 1,
          extensions: 'all',
          types: '10|11|12|13',
        },
      });

      if (response.data.status !== '1') {
        return { hotels: [], total: 0, hasMore: false };
      }

      let hotels = response.data.pois.map((poi) => this.transformPOIToHotel(poi));

      if (params.minPrice !== undefined) {
        hotels = hotels.filter((h) => h.price && h.price.amount >= params.minPrice!);
      }

      if (params.maxPrice !== undefined) {
        hotels = hotels.filter((h) => h.price && h.price.amount <= params.maxPrice!);
      }

      if (params.starRatings && params.starRatings.length > 0) {
        hotels = hotels.filter((h) => params.starRatings!.includes(h.starRating));
      }

      if (params.minRating !== undefined) {
        hotels = hotels.filter((h) => h.rating && h.rating.score >= params.minRating!);
      }

      if (params.sortBy) {
        hotels.sort((a, b) => {
          let comparison = 0;
          switch (params.sortBy) {
            case 'price':
              comparison = (a.price?.amount || 0) - (b.price?.amount || 0);
              break;
            case 'rating':
              comparison = (b.rating?.score || 0) - (a.rating?.score || 0);
              break;
            case 'distance':
              comparison = (a.distance || 0) - (b.distance || 0);
              break;
            case 'star':
              comparison = b.starRating - a.starRating;
              break;
            case 'popularity':
              comparison = (b.popularity || 0) - (a.popularity || 0);
              break;
          }
          return params.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      const result: HotelSearchResult = {
        hotels,
        total: parseInt(response.data.count) || hotels.length,
        hasMore: hotels.length === (params.pageSize || 20),
        minPrice: hotels.length > 0 ? Math.min(...hotels.map((h) => h.price?.amount || 0)) : undefined,
        maxPrice: hotels.length > 0 ? Math.max(...hotels.map((h) => h.price?.amount || 0)) : undefined,
      };

      await this.setCachedData(cacheKey, result, 3600);
      return result;
    } catch (error) {
      console.error('Search hotels error:', error);
      return { hotels: [], total: 0, hasMore: false };
    }
  }

  async getHotelDetail(id: string): Promise<HotelDetail | null> {
    const cacheKey = `hotels:detail:${id}`;
    const cached = await this.getCachedData<HotelDetail>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${AMAP_API_URL}/place/detail`, {
        params: {
          id,
          key: this.amapApiKey,
          extensions: 'all',
        },
      });

      if (response.data.status !== '1' || !response.data.pois?.length) {
        return null;
      }

      const poi = response.data.pois[0];
      const hotel = this.transformPOIToHotel(poi);

      const detail: HotelDetail = {
        ...hotel,
        roomTypes: this.generateRoomTypes(hotel.price?.amount || 300),
        facilities: [
          { category: '客房设施', items: ['空调', '电视', '电话', '迷你吧'] },
          { category: '公共设施', items: ['停车场', '电梯', '无障碍设施'] },
          { category: '服务', items: ['前台服务', '行李寄存', '叫醒服务'] },
        ],
        policies: [
          { type: '入住', description: '入住时间：14:00后' },
          { type: '退房', description: '退房时间：12:00前' },
          { type: '取消', description: '入住前1天可免费取消' },
        ],
        transportation: [
          { type: 'metro', name: '地铁站', distance: 500, description: '步行约8分钟' },
          { type: 'bus', name: '公交站', distance: 200, description: '步行约3分钟' },
        ],
      };

      await this.setCachedData(cacheKey, detail, 86400);
      return detail;
    } catch (error) {
      console.error('Get hotel detail error:', error);
      return null;
    }
  }

  async getPriceComparison(hotelId: string): Promise<HotelPriceComparison | null> {
    const cacheKey = `hotels:compare:${hotelId}`;
    const cached = await this.getCachedData<HotelPriceComparison>(cacheKey);
    if (cached) return cached;

    return null;
  }
}

export const hotelApi = new HotelApi();
