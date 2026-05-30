import { Itinerary } from "@/types/itinerary";
import { streamSse } from "./client";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type PlanBridgeEvent =
  | {
      type: "text";
      content: string;
    }
  | {
      type: "action";
      action?: string;
      payload?: unknown;
    }
  | {
      type: "itinerary_snapshot";
      data?: Itinerary;
    }
  | {
      type: "tool_result";
      name: string;
      data?: unknown;
    };

export interface PlanBridgeRequest {
  message: string;
  history?: ChatMessage[];
  itineraryContext?: string;
  itineraryId?: string;
  userId?: string;
}

export async function sendPlanBridgeMessage(
  request: PlanBridgeRequest,
  handlers: {
    onChunk?: (chunk: string) => void;
    onDone?: (fullMessage: string) => void;
    onAction?: (event: PlanBridgeEvent) => void;
  } = {}
): Promise<void> {
  let fullMessage = "";

  await streamSse<PlanBridgeEvent>("/agent/plan/stream", request, {
    onEvent(event) {
      if (event.type === "text" && event.content) {
        fullMessage += event.content;
        handlers.onChunk?.(event.content);
        return;
      }

      handlers.onAction?.(event);
    },
    onDone() {
      handlers.onDone?.(fullMessage);
    },
  });
}
