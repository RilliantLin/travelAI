import prisma from "../config/database";
import { itineraryAgent } from "../agent/itinerary-agent";
import { transformItinerary } from "../lib/itinerary-transform";
import {
  Itinerary,
  ItineraryCreateParams,
  ItineraryUpdateParams,
} from "../types/itinerary";

const itineraryInclude = {
  days: {
    include: {
      activities: true,
      meals: true,
      accommodation: true,
    },
    orderBy: { dayNumber: "asc" as const },
  },
  flights: true,
  hotels: true,
};

export async function createGeneratedItinerary(
  params: ItineraryCreateParams
): Promise<Itinerary> {
  const itinerary = await itineraryAgent.generateItinerary(params);

  const savedItinerary = await prisma.itinerary.create({
    data: {
      userId: itinerary.userId,
      title: itinerary.title,
      destination: itinerary.destination,
      startDate: new Date(itinerary.startDate),
      endDate: new Date(itinerary.endDate),
      description: itinerary.description,
      totalBudget: itinerary.budget?.total,
      status: itinerary.status,
    },
  });

  for (const dayPlan of itinerary.days) {
    const savedDay = await prisma.itineraryDay.create({
      data: {
        itineraryId: savedItinerary.id,
        dayNumber: dayPlan.dayNumber,
        date: new Date(dayPlan.date),
        summary: dayPlan.summary,
      },
    });

    for (const activity of dayPlan.activities) {
      await prisma.activity.create({
        data: {
          itineraryDayId: savedDay.id,
          name: activity.name,
          description: activity.description,
          location: activity.location.address,
          latitude: activity.location.lat,
          longitude: activity.location.lng,
          startTime: activity.startTime,
          endTime: activity.endTime,
          estimatedCost: activity.estimatedCost,
          category: activity.type,
          rating: activity.rating,
          imageUrl: activity.imageUrl,
        },
      });
    }

    for (const meal of dayPlan.meals) {
      await prisma.meal.create({
        data: {
          itineraryDayId: savedDay.id,
          name: meal.name,
          type: meal.type,
          location: meal.location.address,
          latitude: meal.location.lat,
          longitude: meal.location.lng,
          estimatedCost: meal.estimatedCost,
        },
      });
    }
  }

  return {
    ...itinerary,
    id: savedItinerary.id,
    createdAt: savedItinerary.createdAt.toISOString(),
    updatedAt: savedItinerary.updatedAt.toISOString(),
  };
}

export async function getItineraryById(id: string): Promise<Itinerary | null> {
  const itinerary = await prisma.itinerary.findUnique({
    where: { id },
    include: itineraryInclude,
  });

  return itinerary ? transformItinerary(itinerary) : null;
}

export async function listItineraries(userId?: string): Promise<Itinerary[]> {
  const itineraries = await prisma.itinerary.findMany({
    where: userId ? { userId } : {},
    include: {
      days: {
        include: {
          activities: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return itineraries.map(transformItinerary);
}

export async function updateItineraryMeta(
  id: string,
  data: Pick<ItineraryUpdateParams, "title" | "description" | "status">
) {
  return prisma.itinerary.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      updatedAt: new Date(),
    },
  });
}

export async function deleteItineraryById(id: string): Promise<void> {
  await prisma.itinerary.delete({
    where: { id },
  });
}
