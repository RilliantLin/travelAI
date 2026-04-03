import { Location, Rating, OpeningHours, Image, Price, Contact } from './common';

export interface Restaurant {
  id: string;
  name: string;
  location: Location;
  description?: string;
  rating?: Rating;
  priceLevel?: string;
  avgCost?: number;
  cuisine?: string[];
  openingHours?: OpeningHours[];
  images?: Image[];
  contact?: Contact;
  tags?: string[];
  distance?: number;
  specialties?: string[];
  atmosphere?: string[];
  reservation?: boolean;
  delivery?: boolean;
}

export interface RestaurantSearchResult {
  restaurants: Restaurant[];
  total: number;
  hasMore: boolean;
}

export interface RestaurantQueryParams {
  location: string;
  radius?: number;
  cuisine?: string;
  keywords?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'rating' | 'distance' | 'avgCost' | 'popularity';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface RestaurantDetail extends Restaurant {
  menu?: MenuItem[];
  reviews?: RestaurantReview[];
  nearbyAttractions?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  recommended: boolean;
}

export interface RestaurantReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  dishes?: string[];
  createdAt: string;
}

export interface CuisineType {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

export interface RestaurantFilter {
  cuisines?: string[];
  priceRange?: [number, number];
  ratingMin?: number;
  distanceMax?: number;
  atmosphere?: string[];
  facilities?: string[];
}

export interface RestaurantRecommendation {
  restaurant: Restaurant;
  score: number;
  reasons: string[];
  matchLevel: 'high' | 'medium' | 'low';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}
