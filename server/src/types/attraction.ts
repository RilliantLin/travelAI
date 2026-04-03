import { Location, Rating, OpeningHours, Image, Price, Contact } from './common';

export interface Attraction {
  id: string;
  name: string;
  location: Location;
  description?: string;
  rating?: Rating;
  price?: Price;
  openingHours?: OpeningHours[];
  images?: Image[];
  contact?: Contact;
  category: string;
  tags?: string[];
  duration?: number;
  bestTimeToVisit?: string;
  tips?: string[];
  facilities?: string[];
  popularity?: number;
  distance?: number;
}

export interface AttractionSearchResult {
  attractions: Attraction[];
  total: number;
  hasMore: boolean;
}

export interface AttractionQueryParams {
  location: string;
  radius?: number;
  category?: string;
  keywords?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'rating' | 'distance' | 'popularity' | 'price';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

export interface AttractionDetail extends Attraction {
  reviews?: AttractionReview[];
  nearbyRestaurants?: string[];
  nearbyHotels?: string[];
  transportInfo?: TransportInfo;
}

export interface AttractionReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export interface TransportInfo {
  metro?: string[];
  bus?: string[];
  parking?: boolean;
  parkingFee?: string;
}

export interface AttractionCategory {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

export interface AttractionFilter {
  categories?: string[];
  priceRange?: [number, number];
  ratingMin?: number;
  distanceMax?: number;
  durationRange?: [number, number];
  facilities?: string[];
}

export interface AttractionRecommendation {
  attraction: Attraction;
  score: number;
  reasons: string[];
  matchLevel: 'high' | 'medium' | 'low';
}
