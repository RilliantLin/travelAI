import prisma from "../config/database";
import { getCached, setCache, CACHE_KEYS, CACHE_TTL } from "../config/redis";

export interface UserPreferenceForRecommendation {
  budgetRange: {
    min: number;
    max: number;
    currency: string;
  };
  travelerCount: number;
  travelStyle: string;
  dietaryRestrictions: string[];
  preferredActivities: string[];
  transportPreference: string;
  accommodationType: string;
  accessibilityNeeds: boolean;
}

export async function getUserPreferenceForRecommendation(
  userId: string
): Promise<UserPreferenceForRecommendation | null> {
  const cacheKey = `${CACHE_KEYS.USER_PREFERENCES}:${userId}:recommendation`;
  const cached = await getCached<UserPreferenceForRecommendation>(cacheKey);

  if (cached) {
    return cached;
  }

  const preference = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (!preference) {
    return null;
  }

  const result: UserPreferenceForRecommendation = {
    budgetRange: {
      min: preference.budgetMin ?? 0,
      max: preference.budgetMax ?? Infinity,
      currency: preference.currency,
    },
    travelerCount: preference.travelerCount,
    travelStyle: preference.travelStyle ?? "moderate",
    dietaryRestrictions: preference.dietaryRestrictions,
    preferredActivities: preference.preferredActivities,
    transportPreference: preference.transportPreference ?? "plane",
    accommodationType: preference.accommodationType ?? "hotel",
    accessibilityNeeds: preference.accessibilityNeeds,
  };

  await setCache(cacheKey, result, CACHE_TTL.USER_PREFERENCES);

  return result;
}

export interface AttractionRecommendation {
  id: string;
  name: string;
  location: string;
  category: string;
  estimatedCost: number;
  rating: number;
  duration: number;
  matchScore: number;
  matchReasons: string[];
}

export function calculateAttractionMatchScore(
  attraction: {
    category?: string;
    estimatedCost?: number;
    rating?: number;
  },
  preference: UserPreferenceForRecommendation
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (
    attraction.estimatedCost &&
    attraction.estimatedCost <= preference.budgetRange.max &&
    attraction.estimatedCost >= preference.budgetRange.min
  ) {
    score += 30;
    reasons.push("符合预算范围");
  }

  if (
    attraction.category &&
    preference.preferredActivities.some((activity) =>
      attraction.category?.toLowerCase().includes(activity.toLowerCase())
    )
  ) {
    score += 40;
    reasons.push("符合偏好活动类型");
  }

  if (attraction.rating && attraction.rating >= 4.5) {
    score += 20;
    reasons.push("高评分景点");
  }

  if (preference.accessibilityNeeds) {
    score += 10;
    reasons.push("考虑无障碍需求");
  }

  return { score, reasons };
}

export interface RestaurantRecommendation {
  id: string;
  name: string;
  location: string;
  cuisine: string;
  priceLevel: number;
  rating: number;
  matchScore: number;
  matchReasons: string[];
}

export function calculateRestaurantMatchScore(
  restaurant: {
    cuisine?: string;
    priceLevel?: number;
    rating?: number;
  },
  preference: UserPreferenceForRecommendation
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (
    restaurant.priceLevel &&
    restaurant.priceLevel <= Math.floor(preference.budgetRange.max / preference.travelerCount / 100)
  ) {
    score += 30;
    reasons.push("符合预算价位");
  }

  if (
    restaurant.cuisine &&
    !preference.dietaryRestrictions.some((restriction) =>
      restaurant.cuisine?.toLowerCase().includes(restriction.toLowerCase())
    )
  ) {
    score += 40;
    reasons.push("符合饮食偏好");
  }

  if (restaurant.rating && restaurant.rating >= 4.0) {
    score += 20;
    reasons.push("高评分餐厅");
  }

  return { score, reasons };
}

export interface HotelRecommendation {
  id: string;
  name: string;
  location: string;
  type: string;
  pricePerNight: number;
  rating: number;
  amenities: string[];
  matchScore: number;
  matchReasons: string[];
}

export function calculateHotelMatchScore(
  hotel: {
    type?: string;
    pricePerNight?: number;
    rating?: number;
    amenities?: string[];
  },
  preference: UserPreferenceForRecommendation
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (
    hotel.pricePerNight &&
    hotel.pricePerNight <= preference.budgetRange.max / preference.travelerCount / 3
  ) {
    score += 30;
    reasons.push("符合预算价位");
  }

  if (hotel.type && hotel.type === preference.accommodationType) {
    score += 40;
    reasons.push("符合住宿偏好");
  }

  if (hotel.rating && hotel.rating >= 4.0) {
    score += 20;
    reasons.push("高评分酒店");
  }

  if (preference.accessibilityNeeds && hotel.amenities?.includes("无障碍设施")) {
    score += 10;
    reasons.push("提供无障碍设施");
  }

  return { score, reasons };
}

export function generateBudgetBreakdown(
  preference: UserPreferenceForRecommendation,
  days: number
): {
  transportation: number;
  accommodation: number;
  food: number;
  attractions: number;
  miscellaneous: number;
  total: number;
} {
  const totalBudget = preference.budgetRange.max;
  const travelerCount = preference.travelerCount;

  const transportationRatio = preference.transportPreference === "plane" ? 0.35 : 0.2;
  const accommodationRatio = preference.accommodationType === "resort" ? 0.35 : 0.25;
  const foodRatio = 0.2;
  const attractionsRatio = 0.15;
  const miscellaneousRatio = 0.05;

  const transportation = totalBudget * transportationRatio;
  const accommodation = (totalBudget * accommodationRatio * days) / travelerCount;
  const food = totalBudget * foodRatio * days;
  const attractions = totalBudget * attractionsRatio;
  const miscellaneous = totalBudget * miscellaneousRatio;

  return {
    transportation: Math.round(transportation),
    accommodation: Math.round(accommodation),
    food: Math.round(food),
    attractions: Math.round(attractions),
    miscellaneous: Math.round(miscellaneous),
    total: Math.round(transportation + accommodation + food + attractions + miscellaneous),
  };
}

export function suggestItineraryPace(
  preference: UserPreferenceForRecommendation,
  days: number
): {
  activitiesPerDay: number;
  restTimeRatio: number;
  suggestion: string;
} {
  switch (preference.travelStyle) {
    case "relaxed":
      return {
        activitiesPerDay: 2,
        restTimeRatio: 0.4,
        suggestion: "建议每天安排2个主要活动，预留充足的休息和自由时间",
      };
    case "intensive":
      return {
        activitiesPerDay: 5,
        restTimeRatio: 0.15,
        suggestion: "可以安排紧凑的行程，每天5个活动，充分体验目的地",
      };
    case "moderate":
    default:
      return {
        activitiesPerDay: 3,
        restTimeRatio: 0.25,
        suggestion: "建议每天安排3个活动，劳逸结合，张弛有度",
      };
  }
}
