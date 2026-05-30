import { z } from "zod";
import {
  itineraryCreateSchema,
  itineraryUpdateSchema,
  ItineraryCreateInput,
  ItineraryUpdateInput,
} from "../contracts/itinerary.contract";
import { AppError } from "../contracts/errors";

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
  warnings: string[];
}

function formatZodError(error: z.ZodError): ValidationResult {
  return {
    valid: false,
    errors: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
    warnings: [],
  };
}

export function validateItineraryCreate(input: unknown): ItineraryCreateInput {
  try {
    return itineraryCreateSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(
        "VALIDATION_ERROR",
        "行程数据验证失败",
        5,
        400,
        formatZodError(error)
      );
    }
    throw error;
  }
}

export function validateItineraryUpdate(input: unknown): ItineraryUpdateInput {
  try {
    return itineraryUpdateSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(
        "VALIDATION_ERROR",
        "行程数据验证失败",
        5,
        400,
        formatZodError(error)
      );
    }
    throw error;
  }
}

export function validatePlanData(input: unknown): ValidationResult {
  const result = itineraryCreateSchema.safeParse(input);

  if (!result.success) {
    return formatZodError(result.error);
  }

  const warnings: string[] = [];
  if (result.data.days.length === 0) {
    warnings.push("未提供 days，将创建空白每日行程");
  }

  for (const day of result.data.days) {
    if (day.activities.length === 0 && day.meals.length === 0 && !day.accommodation) {
      warnings.push(`第 ${day.dayNumber ?? "?"} 天没有具体安排`);
    }
  }

  return {
    valid: true,
    errors: [],
    warnings,
  };
}

