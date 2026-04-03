export interface Location {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

export type ActivityType = "attraction" | "restaurant" | "hotel" | "transport" | "other";

export interface WeatherInfo {
  date: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalEstimated: number;
  breakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  currency: string;
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
  attraction?: {
    id: string;
    name: string;
    rating?: number;
    imageUrl?: string;
  };
  rating?: number;
  imageUrl?: string;
}

export interface MealPlan {
  id: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  restaurant?: {
    id: string;
    name: string;
    rating?: number;
    cuisine?: string;
  };
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
  status: "draft" | "confirmed" | "completed" | "cancelled";
  description?: string;
  coverImage?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
