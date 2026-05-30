import { budgetCalculator } from "../lib/budget/calculator";
import { BudgetSummary } from "../types/budget";
import { ItineraryCreateInput, ItineraryUpdateInput } from "../contracts/itinerary.contract";

const zeroBudget: BudgetSummary = {
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
  total: 0,
  currency: "CNY",
};

function dayCount(startDate?: string, endDate?: string, daysLength?: number): number {
  if (startDate && endDate) {
    const start = Date.parse(startDate);
    const end = Date.parse(endDate);
    if (Number.isFinite(start) && Number.isFinite(end)) {
      return Math.max(1, Math.round((end - start) / 86400000) + 1);
    }
  }
  return Math.max(1, daysLength ?? 1);
}

export function estimateItineraryBudget(
  input: Pick<ItineraryCreateInput | ItineraryUpdateInput, "days" | "budget" | "totalBudget" | "destination" | "startDate" | "endDate">
): BudgetSummary {
  const explicitTotal =
    input.totalBudget ??
    input.budget?.total ??
    input.budget?.totalBudget ??
    input.budget?.totalEstimated;

  const summary: BudgetSummary = {
    ...zeroBudget,
    transportation: input.budget?.transportation ?? 0,
    accommodation: input.budget?.accommodation ?? 0,
    food: input.budget?.food ?? 0,
    attractions: input.budget?.attractions ?? 0,
    shopping: input.budget?.shopping ?? 0,
    entertainment: input.budget?.entertainment ?? 0,
    insurance: input.budget?.insurance ?? 0,
    visa: input.budget?.visa ?? 0,
    communication: input.budget?.communication ?? 0,
    miscellaneous: input.budget?.miscellaneous ?? 0,
    currency: input.budget?.currency ?? "CNY",
  };

  for (const day of input.days ?? []) {
    for (const activity of day.activities ?? []) {
      summary.attractions += activity.estimatedCost ?? 0;
    }
    for (const meal of day.meals ?? []) {
      summary.food += meal.estimatedCost ?? 0;
    }
    if (day.accommodation) {
      summary.accommodation += day.accommodation.estimatedCost ?? 0;
    }
  }

  summary.total =
    explicitTotal ??
    summary.transportation +
      summary.accommodation +
      summary.food +
      summary.attractions +
      summary.shopping +
      summary.entertainment +
      summary.insurance +
      summary.visa +
      summary.communication +
      summary.miscellaneous;

  return summary;
}

export function estimateTemplateBudget(input: {
  destination: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  travelerCount?: number;
  travelStyle?: "budget" | "moderate" | "luxury";
}): BudgetSummary {
  return budgetCalculator.estimateDailyBudget(
    input.destination,
    dayCount(input.startDate, input.endDate, input.days),
    input.travelerCount ?? 1,
    input.travelStyle ?? "moderate"
  );
}

