import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import {
  ItineraryCreateInput,
  ItineraryDayInput,
  ItineraryUpdateInput,
} from "../contracts/itinerary.contract";

export const itineraryInclude = {
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

type Tx = Prisma.TransactionClient;

function toDate(value: string): Date {
  return new Date(value);
}

function locationAddress(location: { address?: string; name?: string } | undefined): string | undefined {
  if (!location) return undefined;
  return location.address || location.name;
}

function dateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, offset: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function normalizeDays(
  days: ItineraryDayInput[] | undefined,
  startDate?: string
): ItineraryDayInput[] {
  const baseDate = startDate ? new Date(startDate) : new Date();

  return (days ?? []).map((day, index) => ({
    ...day,
    dayNumber: day.dayNumber ?? index + 1,
    date: day.date ?? dateOnly(addDays(baseDate, index)),
  }));
}

async function createDays(
  tx: Tx,
  itineraryId: string,
  days: ItineraryDayInput[],
  startDate?: string
) {
  const normalizedDays = normalizeDays(days, startDate);

  for (const [index, day] of normalizedDays.entries()) {
    const savedDay = await tx.itineraryDay.create({
      data: {
        itineraryId,
        dayNumber: day.dayNumber ?? index + 1,
        date: toDate(day.date ?? dateOnly(addDays(new Date(), index))),
        summary: day.summary,
      },
    });

    for (const activity of day.activities) {
      await tx.activity.create({
        data: {
          itineraryDayId: savedDay.id,
          name: activity.name,
          description: activity.description,
          location: locationAddress(activity.location),
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

    for (const meal of day.meals) {
      await tx.meal.create({
        data: {
          itineraryDayId: savedDay.id,
          name: meal.name,
          type: meal.type,
          location: locationAddress(meal.location),
          latitude: meal.location.lat,
          longitude: meal.location.lng,
          estimatedCost: meal.estimatedCost,
          cuisine: meal.cuisine,
          rating: meal.rating,
          imageUrl: meal.imageUrl,
        },
      });
    }

    if (day.accommodation) {
      await tx.accommodation.create({
        data: {
          itineraryDayId: savedDay.id,
          name: day.accommodation.name,
          type: day.accommodation.type,
          location: locationAddress(day.accommodation.location),
          latitude: day.accommodation.location.lat,
          longitude: day.accommodation.location.lng,
          checkIn: day.accommodation.checkIn,
          checkOut: day.accommodation.checkOut,
          estimatedCost: day.accommodation.estimatedCost,
          rating: day.accommodation.rating,
          imageUrl: day.accommodation.imageUrl,
          amenities: day.accommodation.amenities ?? [],
        },
      });
    }
  }
}

export function findItineraryById(id: string) {
  return prisma.itinerary.findUnique({
    where: { id },
    include: itineraryInclude,
  });
}

export function findItineraries(userId?: string) {
  return prisma.itinerary.findMany({
    where: userId ? { userId } : {},
    include: itineraryInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function createItineraryRecord(
  input: ItineraryCreateInput,
  totalBudget: number | undefined
) {
  const createdId = await prisma.$transaction(async (tx) => {
    const savedItinerary = await tx.itinerary.create({
      data: {
        userId: input.userId,
        title: input.title ?? `${input.destination}行程`,
        destination: input.destination,
        startDate: toDate(input.startDate),
        endDate: toDate(input.endDate),
        description: input.description,
        totalBudget,
        status: input.status,
      },
    });

    await createDays(tx, savedItinerary.id, input.days, input.startDate);
    return savedItinerary.id;
  });

  return findItineraryById(createdId);
}

export async function updateItineraryRecord(
  id: string,
  input: ItineraryUpdateInput,
  totalBudget: number | null | undefined
) {
  const updatedId = await prisma.$transaction(async (tx) => {
    await tx.itinerary.update({
      where: { id },
      data: {
        userId: input.userId,
        title: input.title,
        destination: input.destination,
        startDate: input.startDate ? toDate(input.startDate) : undefined,
        endDate: input.endDate ? toDate(input.endDate) : undefined,
        description: input.description,
        totalBudget,
        status: input.status,
        updatedAt: new Date(),
      },
    });

    if (input.days) {
      await tx.itineraryDay.deleteMany({ where: { itineraryId: id } });
      await createDays(tx, id, input.days, input.startDate);
    }

    return id;
  });

  return findItineraryById(updatedId);
}

export function deleteItineraryRecord(id: string) {
  return prisma.itinerary.delete({
    where: { id },
  });
}
