import {
  AccommodationPlan,
  Activity,
  DayPlan,
  Itinerary,
  MealPlan,
} from "../types/itinerary";
import { timeToMinutes } from "./utils/time";

export function transformItinerary(raw: any): Itinerary {
  const days: DayPlan[] = (raw.days || []).map((day: any) => {
    const activities: Activity[] = (day.activities || []).map((act: any) => {
      const startMin = act.startTime ? timeToMinutes(act.startTime) : 0;
      const endMin = act.endTime ? timeToMinutes(act.endTime) : startMin + 120;

      return {
        id: act.id,
        type: act.category || "attraction",
        name: act.name,
        location: {
          lat: act.latitude ?? 0,
          lng: act.longitude ?? 0,
          address:
            typeof act.location === "string"
              ? act.location
              : act.location?.address || "",
        },
        description: act.description ?? undefined,
        startTime: act.startTime ?? "",
        endTime: act.endTime ?? "",
        duration: endMin - startMin || 120,
        estimatedCost: act.estimatedCost ?? 0,
        bookingRequired: false,
        rating: act.rating ?? undefined,
        imageUrl: act.imageUrl ?? undefined,
      } as Activity;
    });

    const meals: MealPlan[] = (day.meals || []).map((meal: any) => ({
      id: meal.id,
      type: meal.type || "lunch",
      name: meal.name,
      location: {
        lat: meal.latitude ?? 0,
        lng: meal.longitude ?? 0,
        address:
          typeof meal.location === "string"
            ? meal.location
            : meal.location?.address || "",
      },
      time: meal.time ?? "",
      duration: 60,
      estimatedCost: meal.estimatedCost ?? 0,
    } as MealPlan));

    let accommodation: AccommodationPlan | undefined;
    if (day.accommodation) {
      const acc = Array.isArray(day.accommodation)
        ? day.accommodation[0]
        : day.accommodation;
      if (acc) {
        accommodation = {
          id: acc.id,
          name: acc.name,
          location: {
            lat: acc.latitude ?? 0,
            lng: acc.longitude ?? 0,
            address:
              typeof acc.location === "string"
                ? acc.location
                : acc.location?.address || "",
          },
          type: acc.type || "酒店",
          checkIn: acc.checkIn ?? "14:00",
          checkOut: acc.checkOut ?? "12:00",
          estimatedCost: acc.estimatedCost ?? 0,
          rating: acc.rating ?? undefined,
        } as AccommodationPlan;
      }
    }

    return {
      dayNumber: day.dayNumber,
      date:
        day.date instanceof Date
          ? day.date.toISOString().split("T")[0]
          : String(day.date).split("T")[0],
      activities,
      meals,
      accommodation,
      summary: day.summary ?? undefined,
    } as DayPlan;
  });

  return {
    id: raw.id,
    userId: raw.userId,
    title: raw.title,
    destination: raw.destination,
    startDate:
      raw.startDate instanceof Date
        ? raw.startDate.toISOString().split("T")[0]
        : String(raw.startDate).split("T")[0],
    endDate:
      raw.endDate instanceof Date
        ? raw.endDate.toISOString().split("T")[0]
        : String(raw.endDate).split("T")[0],
    totalDays: days.length || 1,
    days,
    budget: raw.totalBudget
      ? {
          totalBudget: raw.totalBudget,
          totalEstimated: raw.totalBudget,
          total: raw.totalBudget,
          transportation: 0,
          accommodation: 0,
          food: 0,
          attractions: 0,
          shopping: 0,
          entertainment: 0,
          insurance: 0,
          visa: 0,
          communication: 0,
          miscellaneous: 0,
          currency: "CNY",
        }
      : undefined,
    status: raw.status || "draft",
    description: raw.description ?? undefined,
    createdAt:
      raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : String(raw.createdAt),
    updatedAt:
      raw.updatedAt instanceof Date
        ? raw.updatedAt.toISOString()
        : String(raw.updatedAt),
  };
}
