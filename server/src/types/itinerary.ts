import { Location, ActivityType, TimeSlot } from './common';
import { WeatherInfo } from './weather';
import { Attraction } from './attraction';
import { Restaurant } from './restaurant';
import { BudgetSummary } from './budget';

export interface Itinerary {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  days: DayPlan[];
  budget?: BudgetSummary;
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  description?: string;
  coverImage?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DayPlan {
  dayNumber: number;
  date: string;
  activities: Activity[];
  meals: MealPlan[];
  accommodation?: AccommodationPlan;
  weather?: WeatherInfo;
  tips?: string;
  summary?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  location: Location;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  estimatedCost?: number;
  bookingRequired: boolean;
  bookingUrl?: string;
  notes?: string;
  attraction?: Attraction;
  rating?: number;
  imageUrl?: string;
}

export interface MealPlan {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  restaurant?: Restaurant;
  name: string;
  location: Location;
  time: string;
  duration: number;
  estimatedCost: number;
  cuisine?: string;
  notes?: string;
}

export interface AccommodationPlan {
  id: string;
  name: string;
  location: Location;
  type: string;
  checkIn: string;
  checkOut: string;
  estimatedCost: number;
  rating?: number;
  amenities?: string[];
  notes?: string;
}

export interface ItineraryCreateParams {
  destination: string;
  startDate: string;
  endDate: string;
  userId: string;
  title?: string;
  description?: string;
  preferences?: ItineraryPreferences;
}

export interface ItineraryPreferences {
  budgetMin?: number;
  budgetMax?: number;
  travelStyle?: 'relaxed' | 'moderate' | 'intensive';
  activitiesPerDay?: number;
  interests?: string[];
  dietaryRestrictions?: string[];
  preferredActivities?: string[];
  avoidActivities?: string[];
  wakeUpTime?: string;
  sleepTime?: string;
}

export interface ItineraryUpdateParams {
  title?: string;
  description?: string;
  days?: DayPlan[];
  status?: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  tags?: string[];
}

export interface ItineraryQueryParams {
  userId?: string;
  status?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'startDate' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ItinerarySearchResult {
  itineraries: Itinerary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ItineraryExport {
  format: 'pdf' | 'image' | 'json';
  includeMap?: boolean;
  includeBudget?: boolean;
  includeWeather?: boolean;
}

export interface ItineraryShare {
  itineraryId: string;
  shareUrl: string;
  expiresAt?: string;
  password?: string;
  viewCount?: number;
}
