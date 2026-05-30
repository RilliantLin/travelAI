import { PlanEvent, ChatMessage } from "../contracts/events";
import { AppError } from "../contracts/errors";
import { Itinerary } from "../types/itinerary";
import { estimateItineraryBudget } from "./budget.service";
import { runCodexPlanningBridge } from "./codex-planner.service";
import { optimizePlanOrder } from "./route.service";
import { validatePlanData, ValidationResult } from "./validation.service";

export interface PlanStreamParams {
  message: string;
  history?: ChatMessage[];
  itineraryContext?: string;
  itineraryId?: string;
  userId?: string;
}

export interface PlanChatResult {
  text: string;
  events: PlanEvent[];
  itinerary: Itinerary | null;
}

export function validatePlan(input: unknown): ValidationResult {
  return validatePlanData(input);
}

export function estimatePlanBudget(input: unknown) {
  return estimateItineraryBudget(input as Parameters<typeof estimateItineraryBudget>[0]);
}

export function optimizePlan(input: unknown) {
  return optimizePlanOrder(input);
}

export async function* createPlanStream(
  params: PlanStreamParams
): AsyncGenerator<PlanEvent, void, unknown> {
  for await (const event of runCodexPlanningBridge(params)) {
    yield event;
  }
  yield { type: "done" };
}

export async function runPlanChat(params: PlanStreamParams): Promise<PlanChatResult> {
  const events: PlanEvent[] = [];
  let text = "";
  let itinerary: Itinerary | null = null;

  for await (const event of createPlanStream(params)) {
    events.push(event);
    if (event.type === "text") {
      text += event.content;
    }
    if (event.type === "itinerary_snapshot") {
      itinerary = event.data;
    }
  }

  return {
    text,
    events,
    itinerary,
  };
}

export function rejectDeprecatedPlanGeneration(): never {
  throw new AppError(
    "COMMAND_ERROR",
    "plan chat 已废弃：后端不再执行 LLM 推理，请使用 map/plan/itinerary CLI 工具组合生成行程",
    1,
    410
  );
}
