import { Request, Response } from 'express';
import { amapApi } from '../lib/api/amap';
import { Restaurant, RestaurantSearchResult } from '../types/restaurant';

const RESTAURANT_TYPES = '050000|050100|050200|050300|050400|050500';

export const searchRestaurants = async (req: Request, res: Response) => {
  try {
    const location = typeof req.query.location === 'string' ? req.query.location : '';
    const keywords = typeof req.query.keywords === 'string' ? req.query.keywords : '';
    const radius = typeof req.query.radius === 'string' ? req.query.radius : undefined;
    const cuisine = typeof req.query.cuisine === 'string' ? req.query.cuisine : undefined;
    const page = typeof req.query.page === 'string' ? req.query.page : '1';
    const pageSize = typeof req.query.pageSize === 'string' ? req.query.pageSize : '20';

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location is required',
      });
    }

    const searchKeywords = cuisine || keywords || '餐厅';

    const result = await amapApi.searchPOI(
      searchKeywords,
      location,
      RESTAURANT_TYPES,
      radius ? parseInt(radius, 10) : undefined,
      parseInt(page, 10),
      parseInt(pageSize, 10)
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Restaurants not found',
      });
    }

    const restaurants: Restaurant[] = result.pois.map(poi => ({
      id: poi.id,
      name: poi.name,
      location: {
        lat: parseFloat(poi.location.split(',')[1]),
        lng: parseFloat(poi.location.split(',')[0]),
        address: poi.address || `${poi.pname}${poi.cityname}${poi.adname}`,
        city: poi.cityname,
        province: poi.pname,
      },
      rating: poi.rating ? {
        score: parseFloat(poi.rating),
        count: 0,
      } : undefined,
      avgCost: poi.cost ? parseFloat(poi.cost) : undefined,
      priceLevel: poi.cost ? getPriceLevel(parseFloat(poi.cost)) : undefined,
      images: poi.photos?.map((p: any) => ({ url: p.url })) || [],
      distance: undefined,
    }));

    const searchResult: RestaurantSearchResult = {
      restaurants,
      total: parseInt(result.count, 10),
      hasMore: result.pois.length === parseInt(pageSize as string, 10),
    };

    res.json({
      success: true,
      data: searchResult,
    });
  } catch (error) {
    console.error('Search restaurants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search restaurants',
    });
  }
};

export const getRestaurantDetail = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant ID is required',
      });
    }

    const result = await amapApi.getPOIDetail(id);

    if (!result || !result.pois?.length) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    const poi = result.pois[0];
    const restaurant: Restaurant = {
      id: poi.id,
      name: poi.name,
      location: {
        lat: parseFloat(poi.location.split(',')[1]),
        lng: parseFloat(poi.location.split(',')[0]),
        address: poi.address || `${poi.pname}${poi.cityname}${poi.adname}`,
        city: poi.cityname,
        province: poi.pname,
      },
      description: poi.biz_ext?.meal_sign,
      rating: poi.biz_ext?.rating ? {
        score: parseFloat(poi.biz_ext.rating),
        count: 0,
      } : undefined,
      avgCost: poi.biz_ext?.cost ? parseFloat(poi.biz_ext.cost) : undefined,
      priceLevel: poi.biz_ext?.cost ? getPriceLevel(parseFloat(poi.biz_ext.cost)) : undefined,
      images: poi.photos?.map((p: any) => ({ url: p.url })) || [],
      contact: poi.tel ? {
        phone: poi.tel,
      } : undefined,
    };

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    console.error('Get restaurant detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurant detail',
    });
  }
};

export const getRestaurantsByLocation = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = '3000', page = '1', pageSize = '20' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const location = `${lng},${lat}`;
    
    const result = await amapApi.searchPOI(
      '餐厅',
      location,
      RESTAURANT_TYPES,
      parseInt(radius as string, 10),
      parseInt(page as string, 10),
      parseInt(pageSize as string, 10)
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Restaurants not found',
      });
    }

    const restaurants: Restaurant[] = result.pois.map(poi => ({
      id: poi.id,
      name: poi.name,
      location: {
        lat: parseFloat(poi.location.split(',')[1]),
        lng: parseFloat(poi.location.split(',')[0]),
        address: poi.address || `${poi.pname}${poi.cityname}${poi.adname}`,
        city: poi.cityname,
        province: poi.pname,
      },
      rating: poi.rating ? {
        score: parseFloat(poi.rating),
        count: 0,
      } : undefined,
      avgCost: poi.cost ? parseFloat(poi.cost) : undefined,
      images: poi.photos?.map((p: any) => ({ url: p.url })) || [],
    }));

    res.json({
      success: true,
      data: restaurants,
      total: parseInt(result.count, 10),
    });
  } catch (error) {
    console.error('Get restaurants by location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get restaurants',
    });
  }
};

function getPriceLevel(avgCost: number): string {
  if (avgCost < 50) return '¥';
  if (avgCost < 100) return '¥¥';
  if (avgCost < 200) return '¥¥¥';
  return '¥¥¥¥';
}
