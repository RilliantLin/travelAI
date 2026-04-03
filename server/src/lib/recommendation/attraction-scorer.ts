import { Attraction, AttractionRecommendation, AttractionFilter } from '../../types/attraction';
import { UserPreference } from '@prisma/client';

export class AttractionScorer {
  calculateScore(
    attraction: Attraction,
    preferences?: UserPreference | null,
    filters?: AttractionFilter
  ): number {
    let score = 0;
    const weights = {
      rating: 0.3,
      price: 0.2,
      distance: 0.2,
      preference: 0.3,
    };

    if (attraction.rating?.score) {
      score += (attraction.rating.score / 5) * weights.rating * 100;
    }

    if (preferences?.budgetMax && attraction.price?.amount) {
      const budgetFit = attraction.price.amount <= preferences.budgetMax ? 1 : 0.5;
      score += budgetFit * weights.price * 100;
    } else {
      score += weights.price * 100;
    }

    if (attraction.distance !== undefined) {
      const distanceScore = Math.max(0, 1 - attraction.distance / 10000);
      score += distanceScore * weights.distance * 100;
    } else {
      score += weights.distance * 100;
    }

    if (preferences?.preferredActivities && preferences.preferredActivities.length > 0) {
      const matchedTags = attraction.tags?.filter((tag: string) =>
        preferences.preferredActivities!.includes(tag)
      ).length || 0;
      const preferenceScore = matchedTags / preferences.preferredActivities.length;
      score += preferenceScore * weights.preference * 100;
    } else {
      score += weights.preference * 100;
    }

    return Math.round(score * 100) / 100;
  }

  filterAttractions(
    attractions: Attraction[],
    filters?: AttractionFilter
  ): Attraction[] {
    if (!filters) return attractions;

    return attractions.filter(attraction => {
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(attraction.category)) {
          return false;
        }
      }

      if (filters.priceRange && attraction.price?.amount) {
        if (
          attraction.price.amount < filters.priceRange[0] ||
          attraction.price.amount > filters.priceRange[1]
        ) {
          return false;
        }
      }

      if (filters.ratingMin && attraction.rating?.score) {
        if (attraction.rating.score < filters.ratingMin) {
          return false;
        }
      }

      if (filters.distanceMax && attraction.distance !== undefined) {
        if (attraction.distance > filters.distanceMax) {
          return false;
        }
      }

      if (filters.durationRange && attraction.duration) {
        if (
          attraction.duration < filters.durationRange[0] ||
          attraction.duration > filters.durationRange[1]
        ) {
          return false;
        }
      }

      return true;
    });
  }

  recommend(
    attractions: Attraction[],
    preferences?: UserPreference | null,
    filters?: AttractionFilter,
    limit: number = 10
  ): AttractionRecommendation[] {
    const filtered = this.filterAttractions(attractions, filters);

    const scored = filtered.map(attraction => {
      const score = this.calculateScore(attraction, preferences, filters);
      const matchLevel: 'high' | 'medium' | 'low' = score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';
      const reasons = this.generateReasons(attraction, preferences, score);

      return {
        attraction,
        score,
        reasons,
        matchLevel,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit);
  }

  private generateReasons(
    attraction: Attraction,
    preferences?: UserPreference | null,
    score?: number
  ): string[] {
    const reasons: string[] = [];

    if (attraction.rating?.score && attraction.rating.score >= 4.5) {
      reasons.push(`高评分景点（${attraction.rating.score}分）`);
    }

    if (preferences?.budgetMax && attraction.price?.amount) {
      if (attraction.price.amount <= preferences.budgetMax) {
        reasons.push(`符合预算（¥${attraction.price.amount}）`);
      }
    }

    if (attraction.distance !== undefined && attraction.distance < 2000) {
      reasons.push('距离较近');
    }

    if (preferences?.preferredActivities && attraction.tags) {
      const matchedTags = attraction.tags.filter((tag: string) =>
        preferences.preferredActivities!.includes(tag)
      );
      if (matchedTags.length > 0) {
        reasons.push(`符合兴趣：${matchedTags.join('、')}`);
      }
    }

    if (reasons.length === 0) {
      reasons.push('综合推荐');
    }

    return reasons;
  }
}

export const attractionScorer = new AttractionScorer();
