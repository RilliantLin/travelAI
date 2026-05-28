import { z } from "zod";
import prisma from "../config/database";
import { CACHE_KEYS, CACHE_TTL, deleteCache, getCached, setCache } from "../config/redis";

export const preferenceSchema = z.object({
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  currency: z.string().default("CNY"),
  travelerCount: z.number().int().min(1).max(20).default(1),
  travelStyle: z.enum(["relaxed", "moderate", "intensive"]).optional(),
  dietaryRestrictions: z.array(z.string()).default([]),
  preferredActivities: z.array(z.string()).default([]),
  transportPreference: z.enum(["plane", "train", "car", "bus"]).optional(),
  accommodationType: z.enum(["hotel", "hostel", "apartment", "resort"]).optional(),
  accessibilityNeeds: z.boolean().default(false),
});

export type PreferenceInput = z.infer<typeof preferenceSchema>;

function getPreferenceCacheKey(userId: string): string {
  return `${CACHE_KEYS.USER_PREFERENCES}:${userId}`;
}

export async function getPreferenceByUserId(userId: string) {
  const cacheKey = getPreferenceCacheKey(userId);
  const cachedPreference = await getCached(cacheKey);

  if (cachedPreference) {
    return cachedPreference;
  }

  const preference = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (preference) {
    await setCache(cacheKey, preference, CACHE_TTL.USER_PREFERENCES);
  }

  return preference;
}

export async function upsertPreference(userId: string, input: unknown) {
  const validatedData = preferenceSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  const preference = await prisma.userPreference.upsert({
    where: { userId },
    update: validatedData,
    create: {
      userId,
      ...validatedData,
    },
  });

  await setCache(getPreferenceCacheKey(userId), preference, CACHE_TTL.USER_PREFERENCES);

  return preference;
}

export async function deletePreferenceByUserId(userId: string): Promise<boolean> {
  const preference = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (!preference) {
    return false;
  }

  await prisma.userPreference.delete({
    where: { userId },
  });

  await deleteCache(getPreferenceCacheKey(userId));

  return true;
}

export async function getPreferenceForRecommendation(userId: string) {
  const preference = await prisma.userPreference.findUnique({
    where: { userId },
  });

  if (!preference) {
    return null;
  }

  return {
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
}
