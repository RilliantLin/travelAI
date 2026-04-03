import { Restaurant, RestaurantRecommendation, RestaurantFilter } from '../../types/restaurant';
import { UserPreference } from '@prisma/client';

export class RestaurantScorer {
  calculateScore(
    restaurant: Restaurant,
    preferences?: UserPreference | null,
    filters?: RestaurantFilter,
    mealType?: string
  ): number {
    let score = 0;
    const weights = {
      rating: 0.3,
      price: 0.25,
      distance: 0.25,
      cuisine: 0.2,
    };

    if (restaurant.rating?.score) {
      score += (restaurant.rating.score / 5) * weights.rating * 100;
    }

    if (preferences?.budgetMax && restaurant.avgCost) {
      const avgCostPerMeal = preferences.budgetMax / 3;
      const priceFit = restaurant.avgCost <= avgCostPerMeal ? 1 : 0.5;
      score += priceFit * weights.price * 100;
    } else {
      score += weights.price * 100;
    }

    if (restaurant.distance !== undefined) {
      const distanceScore = Math.max(0, 1 - restaurant.distance / 5000);
      score += distanceScore * weights.distance * 100;
    } else {
      score += weights.distance * 100;
    }

    if (preferences?.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
      const matchedCuisine = restaurant.cuisine?.some((c: string) =>
        preferences.dietaryRestrictions!.includes(c)
      );
      if (matchedCuisine) {
        score += weights.cuisine * 100;
      } else {
        score += weights.cuisine * 50;
      }
    } else {
      score += weights.cuisine * 100;
    }

    return Math.round(score * 100) / 100;
  }

  filterRestaurants(
    restaurants: Restaurant[],
    filters?: RestaurantFilter
  ): Restaurant[] {
    if (!filters) return restaurants;

    return restaurants.filter(restaurant => {
      if (filters.cuisines && filters.cuisines.length > 0) {
        if (!restaurant.cuisine?.some((c: string) => filters.cuisines!.includes(c))) {
          return false;
        }
      }

      if (filters.priceRange && restaurant.avgCost) {
        if (
          restaurant.avgCost < filters.priceRange[0] ||
          restaurant.avgCost > filters.priceRange[1]
        ) {
          return false;
        }
      }

      if (filters.ratingMin && restaurant.rating?.score) {
        if (restaurant.rating.score < filters.ratingMin) {
          return false;
        }
      }

      if (filters.distanceMax && restaurant.distance !== undefined) {
        if (restaurant.distance > filters.distanceMax) {
          return false;
        }
      }

      return true;
    });
  }

  recommend(
    restaurants: Restaurant[],
    preferences?: UserPreference | null,
    filters?: RestaurantFilter,
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    limit: number = 10
  ): RestaurantRecommendation[] {
    const filtered = this.filterRestaurants(restaurants, filters);

    const scored = filtered.map(restaurant => {
      const score = this.calculateScore(restaurant, preferences, filters, mealType);
      const matchLevel: 'high' | 'medium' | 'low' = score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';
      const reasons = this.generateReasons(restaurant, preferences, score, mealType);

      return {
        restaurant,
        score,
        reasons,
        matchLevel,
        mealType,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  }

  private generateReasons(
    restaurant: Restaurant,
    preferences?: UserPreference | null,
    score?: number,
    mealType?: string
  ): string[] {
    const reasons: string[] = [];

    if (restaurant.rating?.score && restaurant.rating.score >= 4.5) {
      reasons.push(`高评分餐厅（${restaurant.rating.score}分）`);
    }

    if (preferences?.budgetMax && restaurant.avgCost) {
      const avgCostPerMeal = preferences.budgetMax / 3;
      if (restaurant.avgCost <= avgCostPerMeal) {
        reasons.push(`人均¥${restaurant.avgCost}，符合预算`);
      }
    }

    if (restaurant.distance !== undefined && restaurant.distance < 1000) {
      reasons.push('距离很近');
    }

    if (restaurant.cuisine && restaurant.cuisine.length > 0) {
      reasons.push(`菜系：${restaurant.cuisine.slice(0, 2).join('、')}`);
    }

    if (mealType) {
      const mealNames: Record<string, string> = {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        snack: '小吃',
      };
      reasons.push(`适合${mealNames[mealType]}`);
    }

    if (reasons.length === 0) {
      reasons.push('综合推荐');
    }

    return reasons;
  }
}

export const restaurantScorer = new RestaurantScorer();
