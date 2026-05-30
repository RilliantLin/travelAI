import { AppError } from "../contracts/errors";
import {
  ItineraryCreateInput,
  ItineraryDayInput,
  ItineraryUpdateInput,
} from "../contracts/itinerary.contract";
import {
  createItineraryRecord,
  deleteItineraryRecord,
  findItineraries,
  findItineraryById,
  updateItineraryRecord,
} from "../repositories/itinerary.repository";
import { transformItinerary } from "../lib/itinerary-transform";
import { Itinerary, ItineraryUpdateParams } from "../types/itinerary";
import {
  validateItineraryCreate,
  validateItineraryUpdate,
} from "./validation.service";
import { estimateItineraryBudget } from "./budget.service";

function dateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, offset: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function dayCount(startDate: string, endDate: string): number {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

function normalizeCreateDays(input: ItineraryCreateInput): ItineraryDayInput[] {
  const start = new Date(input.startDate);
  const totalDays = dayCount(input.startDate, input.endDate);
  const existing = new Map<number, ItineraryDayInput>();

  for (const [index, day] of input.days.entries()) {
    existing.set(day.dayNumber ?? index + 1, {
      ...day,
      dayNumber: day.dayNumber ?? index + 1,
      date: day.date ?? dateOnly(addDays(start, index)),
    });
  }

  return Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    return (
      existing.get(dayNumber) ?? {
        dayNumber,
        date: dateOnly(addDays(start, index)),
        activities: [],
        meals: [],
        summary: `第 ${dayNumber} 天`,
      }
    );
  });
}

function resolveTotalBudget(input: Pick<ItineraryCreateInput | ItineraryUpdateInput, "budget" | "totalBudget" | "days" | "destination" | "startDate" | "endDate">): number | undefined {
  const estimated = estimateItineraryBudget(input);
  return estimated.total || undefined;
}

export async function createItinerary(input: unknown): Promise<Itinerary> {
  const data = validateItineraryCreate(input);
  const normalizedData: ItineraryCreateInput = {
    ...data,
    title: data.title ?? `${data.destination}行程`,
    days: normalizeCreateDays(data),
  };

  const saved = await createItineraryRecord(
    normalizedData,
    resolveTotalBudget(normalizedData)
  );

  if (!saved) {
    throw new AppError("COMMAND_ERROR", "创建行程失败");
  }

  return transformItinerary(saved);
}

export async function getItineraryById(id: string): Promise<Itinerary | null> {
  const itinerary = await findItineraryById(id);
  return itinerary ? transformItinerary(itinerary) : null;
}

export async function requireItineraryById(id: string): Promise<Itinerary> {
  const itinerary = await getItineraryById(id);
  if (!itinerary) {
    throw new AppError("ITINERARY_NOT_FOUND", "行程不存在", 2, 404);
  }
  return itinerary;
}

export async function listItineraries(userId?: string): Promise<Itinerary[]> {
  const itineraries = await findItineraries(userId);
  return itineraries.map(transformItinerary);
}

export async function updateItinerary(
  id: string,
  input: unknown
): Promise<Itinerary> {
  const data = validateItineraryUpdate(input);
  const existing = await requireItineraryById(id);

  if (data.endDate && !data.startDate && Date.parse(data.endDate) < Date.parse(existing.startDate)) {
    throw new AppError("VALIDATION_ERROR", "endDate 不能早于 startDate", 5, 400);
  }

  if (data.startDate && !data.endDate && Date.parse(existing.endDate) < Date.parse(data.startDate)) {
    throw new AppError("VALIDATION_ERROR", "endDate 不能早于 startDate", 5, 400);
  }

  const totalBudget =
    data.totalBudget !== undefined
      ? data.totalBudget
      : data.budget || data.days
        ? resolveTotalBudget({
            ...data,
            destination: data.destination ?? existing.destination,
            startDate: data.startDate ?? existing.startDate,
            endDate: data.endDate ?? existing.endDate,
          })
        : undefined;

  const saved = await updateItineraryRecord(id, data, totalBudget);

  if (!saved) {
    throw new AppError("ITINERARY_NOT_FOUND", "行程不存在", 2, 404);
  }

  return transformItinerary(saved);
}

export async function updateItineraryMeta(
  id: string,
  data: Pick<ItineraryUpdateParams, "title" | "description" | "status">
): Promise<Itinerary> {
  return updateItinerary(id, data);
}

export async function deleteItineraryById(id: string): Promise<void> {
  await requireItineraryById(id);
  await deleteItineraryRecord(id);
}

