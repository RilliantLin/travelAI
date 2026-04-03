import { Request, Response } from 'express';
import { amapApi } from '../lib/api/amap';
import { Attraction, AttractionSearchResult } from '../types/attraction';

const ATTRACTION_TYPES = '110000|110100|110200|110300';

export const searchAttractions = async (req: Request, res: Response) => {
  try {
    const location = typeof req.query.location === 'string' ? req.query.location : '';
    const keywords = typeof req.query.keywords === 'string' ? req.query.keywords : '景点';
    const radius = typeof req.query.radius === 'string' ? req.query.radius : undefined;
    const page = typeof req.query.page === 'string' ? req.query.page : '1';
    const pageSize = typeof req.query.pageSize === 'string' ? req.query.pageSize : '20';

    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location is required',
      });
    }

    const result = await amapApi.searchPOI(
      keywords,
      location,
      ATTRACTION_TYPES,
      radius ? parseInt(radius, 10) : undefined,
      parseInt(page, 10),
      parseInt(pageSize, 10)
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Attractions not found',
      });
    }

    const attractions: Attraction[] = result.pois.map(poi => ({
      id: poi.id,
      name: poi.name,
      location: {
        lat: parseFloat(poi.location.split(',')[1]),
        lng: parseFloat(poi.location.split(',')[0]),
        address: poi.address || `${poi.pname}${poi.cityname}${poi.adname}`,
        city: poi.cityname,
        province: poi.pname,
      },
      category: poi.type,
      rating: poi.rating ? {
        score: parseFloat(poi.rating),
        count: 0,
      } : undefined,
      images: poi.photos?.map(p => ({ url: p.url })) || [],
      distance: undefined,
    }));

    const searchResult: AttractionSearchResult = {
      attractions,
      total: parseInt(result.count, 10),
      hasMore: result.pois.length === parseInt(pageSize as string, 10),
    };

    res.json({
      success: true,
      data: searchResult,
    });
  } catch (error) {
    console.error('Search attractions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search attractions',
    });
  }
};

export const getAttractionDetail = async (req: Request, res: Response) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : '';

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Attraction ID is required',
      });
    }

    const result = await amapApi.getPOIDetail(id);

    if (!result || !result.pois?.length) {
      return res.status(404).json({
        success: false,
        error: 'Attraction not found',
      });
    }

    const poi = result.pois[0];
    const attraction: Attraction = {
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
      category: poi.type,
      rating: poi.biz_ext?.rating ? {
        score: parseFloat(poi.biz_ext.rating),
        count: 0,
      } : undefined,
      price: poi.biz_ext?.cost ? {
        amount: parseFloat(poi.biz_ext.cost),
        currency: 'CNY',
      } : undefined,
      images: poi.photos?.map((p: any) => ({ url: p.url })) || [],
      contact: poi.tel ? {
        phone: poi.tel,
      } : undefined,
    };

    res.json({
      success: true,
      data: attraction,
    });
  } catch (error) {
    console.error('Get attraction detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get attraction detail',
    });
  }
};

export const getAttractionsByLocation = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = '5000', page = '1', pageSize = '20' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const location = `${lng},${lat}`;
    
    const result = await amapApi.searchPOI(
      '景点',
      location,
      ATTRACTION_TYPES,
      parseInt(radius as string, 10),
      parseInt(page as string, 10),
      parseInt(pageSize as string, 10)
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Attractions not found',
      });
    }

    const attractions: Attraction[] = result.pois.map(poi => ({
      id: poi.id,
      name: poi.name,
      location: {
        lat: parseFloat(poi.location.split(',')[1]),
        lng: parseFloat(poi.location.split(',')[0]),
        address: poi.address || `${poi.pname}${poi.cityname}${poi.adname}`,
        city: poi.cityname,
        province: poi.pname,
      },
      category: poi.type,
      rating: poi.rating ? {
        score: parseFloat(poi.rating),
        count: 0,
      } : undefined,
      images: poi.photos?.map((p: any) => ({ url: p.url })) || [],
    }));

    res.json({
      success: true,
      data: attractions,
      total: parseInt(result.count, 10),
    });
  } catch (error) {
    console.error('Get attractions by location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get attractions',
    });
  }
};
