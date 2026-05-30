import prisma from "../config/database";
import type { PreferenceInput } from "../services/preference.service";

export function getPreferenceRecord(userId: string) {
  return prisma.userPreference.findUnique({
    where: { userId },
  });
}

export function upsertPreferenceRecord(userId: string, data: PreferenceInput) {
  return prisma.userPreference.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });
}

export async function deletePreferenceRecord(userId: string): Promise<void> {
  await prisma.userPreference.delete({
    where: { userId },
  });
}
