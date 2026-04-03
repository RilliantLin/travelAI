import { Location } from '../../types/common';
import { calculateDistance, calculateDistanceMatrix } from '../utils/distance';

export interface OptimizationResult {
  originalOrder: number[];
  optimizedOrder: number[];
  originalDistance: number;
  optimizedDistance: number;
  savedDistance: number;
  savedPercentage: number;
}

export class RouteOptimizer {
  optimize(locations: Location[]): OptimizationResult {
    if (locations.length <= 2) {
      return {
        originalOrder: locations.map((_, i) => i),
        optimizedOrder: locations.map((_, i) => i),
        originalDistance: 0,
        optimizedDistance: 0,
        savedDistance: 0,
        savedPercentage: 0,
      };
    }

    const originalOrder = locations.map((_, i) => i);
    const originalDistance = this.calculateTotalDistance(locations);

    const optimizedOrder = this.nearestNeighbor(locations);
    const optimizedLocations = optimizedOrder.map(i => locations[i]);
    const optimizedDistance = this.calculateTotalDistance(optimizedLocations);

    const savedDistance = originalDistance - optimizedDistance;
    const savedPercentage = (savedDistance / originalDistance) * 100;

    return {
      originalOrder,
      optimizedOrder,
      originalDistance,
      optimizedDistance,
      savedDistance,
      savedPercentage: Math.round(savedPercentage * 100) / 100,
    };
  }

  private nearestNeighbor(locations: Location[]): number[] {
    const n = locations.length;
    const visited = new Array(n).fill(false);
    const path: number[] = [0];
    visited[0] = true;

    for (let i = 1; i < n; i++) {
      const current = path[path.length - 1];
      let nearestDist = Infinity;
      let nearestIdx = -1;

      for (let j = 0; j < n; j++) {
        if (!visited[j]) {
          const dist = calculateDistance(
            locations[current].lat,
            locations[current].lng,
            locations[j].lat,
            locations[j].lng
          );
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIdx = j;
          }
        }
      }

      if (nearestIdx !== -1) {
        path.push(nearestIdx);
        visited[nearestIdx] = true;
      }
    }

    return path;
  }

  twoOpt(locations: Location[], maxIterations: number = 100): number[] {
    let bestPath = locations.map((_, i) => i);
    let bestDistance = this.calculateTotalDistance(locations);
    let improved = true;
    let iterations = 0;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 1; i < locations.length - 2; i++) {
        for (let j = i + 1; j < locations.length; j++) {
          const newPath = this.twoOptSwap(bestPath, i, j);
          const newDistance = this.calculateTotalDistanceByOrder(locations, newPath);

          if (newDistance < bestDistance) {
            bestPath = newPath;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }

    return bestPath;
  }

  private twoOptSwap(path: number[], i: number, j: number): number[] {
    const newPath = path.slice(0, i);
    const reversed = path.slice(i, j + 1).reverse();
    return newPath.concat(reversed, path.slice(j + 1));
  }

  private calculateTotalDistance(locations: Location[]): number {
    let total = 0;
    for (let i = 0; i < locations.length - 1; i++) {
      total += calculateDistance(
        locations[i].lat,
        locations[i].lng,
        locations[i + 1].lat,
        locations[i + 1].lng
      );
    }
    return total;
  }

  private calculateTotalDistanceByOrder(locations: Location[], order: number[]): number {
    let total = 0;
    for (let i = 0; i < order.length - 1; i++) {
      const from = locations[order[i]];
      const to = locations[order[i + 1]];
      total += calculateDistance(from.lat, from.lng, to.lat, to.lng);
    }
    return total;
  }

  optimizeWithConstraints(
    locations: Location[],
    constraints: {
      mustVisit?: number[];
      timeWindows?: Array<{ start: number; end: number }>;
      priorities?: number[];
    }
  ): OptimizationResult {
    const basicResult = this.optimize(locations);

    if (constraints.mustVisit && constraints.mustVisit.length > 0) {
      const mustVisitSet = new Set(constraints.mustVisit);
      const optimized = basicResult.optimizedOrder.filter(i => !mustVisitSet.has(i));
      const mustVisitOrdered = constraints.mustVisit.sort((a, b) => {
        const priorityA = constraints.priorities?.[a] || 0;
        const priorityB = constraints.priorities?.[b] || 0;
        return priorityB - priorityA;
      });

      basicResult.optimizedOrder = [...mustVisitOrdered, ...optimized];
      basicResult.optimizedDistance = this.calculateTotalDistanceByOrder(
        locations,
        basicResult.optimizedOrder
      );
      basicResult.savedDistance = basicResult.originalDistance - basicResult.optimizedDistance;
      basicResult.savedPercentage =
        Math.round((basicResult.savedDistance / basicResult.originalDistance) * 10000) / 100;
    }

    return basicResult;
  }
}

export const routeOptimizer = new RouteOptimizer();
