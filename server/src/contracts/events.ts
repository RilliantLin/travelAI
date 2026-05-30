import { Itinerary } from "../types/itinerary";

export type PlanEvent =
  | { type: "text"; content: string }
  | { type: "action"; action: "set_loading" | "loading_done" | string }
  | { type: "itinerary_snapshot"; data: Itinerary }
  | { type: "tool_result"; name: string; data: unknown }
  | { type: "done" };

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

