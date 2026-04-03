export interface Hotel {
  id: string;
  name: string;
  location: HotelLocation;
  rating?: Rating;
  starRating: number;
  price?: HotelPrice;
  images?: Image[];
  contact?: Contact;
  description?: string;
  amenities?: string[];
  roomTypes?: RoomType[];
  checkInTime?: string;
  checkOutTime?: string;
  distance?: number;
  popularity?: number;
}

export interface HotelLocation {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  province?: string;
}

export interface Rating {
  score: number;
  count: number;
}

export interface Image {
  url: string;
}

export interface Contact {
  phone?: string;
  email?: string;
  website?: string;
}

export interface HotelPrice {
  amount: number;
  currency: string;
  perNight: boolean;
  originalPrice?: number;
  discount?: number;
  taxes?: number;
  fees?: number;
}

export interface RoomType {
  id: string;
  name: string;
  description?: string;
  maxOccupancy: number;
  bedType: string;
  bedCount: number;
  size?: number;
  sizeUnit?: string;
  price: HotelPrice;
  amenities?: string[];
  images?: Image[];
  available: boolean;
  roomsLeft?: number;
}

export interface HotelSearchResult {
  hotels: Hotel[];
  total: number;
  hasMore: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface HotelSearchParams {
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  checkIn: string;
  checkOut: string;
  guests?: number;
  rooms?: number;
  adults?: number;
  children?: number;
  minPrice?: number;
  maxPrice?: number;
  starRatings?: number[];
  minRating?: number;
  amenities?: string[];
  sortBy?: 'price' | 'rating' | 'distance' | 'popularity' | 'star';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface HotelDetail extends Hotel {
  facilities?: HotelFacility[];
  policies?: HotelPolicy[];
  reviews?: HotelReview[];
  nearbyAttractions?: NearbyPlace[];
  nearbyRestaurants?: NearbyPlace[];
  transportation?: TransportationInfo[];
}

export interface HotelFacility {
  category: string;
  items: string[];
}

export interface HotelPolicy {
  type: string;
  description: string;
}

export interface HotelReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  stayDate: string;
  roomType?: string;
  createdAt: string;
}

export interface NearbyPlace {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'transport';
  distance: number;
  duration?: number;
}

export interface TransportationInfo {
  type: 'metro' | 'bus' | 'airport_shuttle' | 'taxi';
  name: string;
  distance: number;
  description?: string;
}
