import { Hotel, HotelSearchResult, HotelSearchParams, HotelDetail } from '@/types/hotel';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function searchHotels(params: HotelSearchParams): Promise<HotelSearchResult> {
  const queryParams = new URLSearchParams();
  
  if (params.location) queryParams.append('location', params.location);
  if (params.lat) queryParams.append('lat', params.lat.toString());
  if (params.lng) queryParams.append('lng', params.lng.toString());
  if (params.radius) queryParams.append('radius', params.radius.toString());
  
  queryParams.append('checkIn', params.checkIn);
  queryParams.append('checkOut', params.checkOut);
  
  if (params.guests) queryParams.append('guests', params.guests.toString());
  if (params.rooms) queryParams.append('rooms', params.rooms.toString());
  if (params.adults) queryParams.append('adults', params.adults.toString());
  if (params.children) queryParams.append('children', params.children.toString());
  if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params.starRatings) queryParams.append('starRatings', params.starRatings.join(','));
  if (params.minRating) queryParams.append('minRating', params.minRating.toString());
  if (params.amenities) queryParams.append('amenities', params.amenities.join(','));
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

  const response = await fetch(`${API_BASE_URL}/hotels/search?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to search hotels');
  }
  
  const data = await response.json();
  return data.data;
}

export async function getHotelDetail(id: string): Promise<HotelDetail | null> {
  const response = await fetch(`${API_BASE_URL}/hotels/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to get hotel detail');
  }
  
  const data = await response.json();
  return data.data;
}
