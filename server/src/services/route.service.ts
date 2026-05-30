import { routeOptimizer } from "../lib/optimization/route-optimizer";
import { Location } from "../types/common";

export function optimizeLocationOrder(locations: Location[]) {
  return routeOptimizer.optimize(locations);
}

export function optimizePlanOrder(input: unknown) {
  const data = input as {
    locations?: Location[];
    days?: Array<{ activities?: Array<{ location?: Location }> }>;
  };

  const locations =
    data.locations ??
    data.days?.flatMap((day) =>
      (day.activities ?? [])
        .map((activity) => activity.location)
        .filter((location): location is Location => Boolean(location))
    ) ??
    [];

  return optimizeLocationOrder(locations);
}

