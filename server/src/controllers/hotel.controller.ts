import { Request, Response } from 'express';
import { hotelApi } from '../lib/api/hotel';
import { HotelSearchParams } from '../types/hotel';

export const searchHotels = async (req: Request, res: Response) => {
  try {
    const {
      location,
      lat,
      lng,
      radius,
      checkIn,
      checkOut,
      guests,
      rooms,
      adults,
      children,
      minPrice,
      maxPrice,
      starRatings,
      minRating,
      amenities,
      sortBy,
      sortOrder,
      page,
      pageSize,
    } = req.query;

    if (!location && (!lat || !lng)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: location or lat/lng',
      });
    }

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: checkIn, checkOut',
      });
    }

    const params: HotelSearchParams = {
      location: location as string,
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
      radius: radius ? parseInt(radius as string) : 10000,
      checkIn: checkIn as string,
      checkOut: checkOut as string,
      guests: guests ? parseInt(guests as string) : undefined,
      rooms: rooms ? parseInt(rooms as string) : undefined,
      adults: adults ? parseInt(adults as string) : undefined,
      children: children ? parseInt(children as string) : undefined,
      minPrice: minPrice ? parseInt(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      starRatings: starRatings ? (starRatings as string).split(',').map(Number) : undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      amenities: amenities ? (amenities as string).split(',') : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20,
    };

    const result = await hotelApi.searchHotels(params);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Search hotels error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search hotels',
    });
  }
};

export const getHotelDetail = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const hotel = await hotelApi.getHotelDetail(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
      });
    }

    res.json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error('Get hotel detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get hotel detail',
    });
  }
};

export const getHotelPriceComparison = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const comparison = await hotelApi.getPriceComparison(id);

    if (!comparison) {
      return res.status(404).json({
        success: false,
        error: 'Price comparison not found',
      });
    }

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Get price comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get price comparison',
    });
  }
};
