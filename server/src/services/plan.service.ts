import { ChatMessage } from "../agent";
import { PlanAgent, SSEEvent } from "../agent/plan-agent";
import { getItineraryById } from "./itinerary.service";

export interface PlanStreamParams {
  message: string;
  history?: ChatMessage[];
  itineraryContext?: string;
  itineraryId?: string;
  userId?: string;
}

export interface PlanChatResult {
  text: string;
  events: SSEEvent[];
  itinerary: SSEEvent["data"] | null;
}

export async function createPlanStream(
  params: PlanStreamParams
): Promise<AsyncGenerator<SSEEvent, void, unknown>> {
  const existingItinerary =
    typeof params.itineraryId === "string" &&
    params.itineraryId &&
    params.itineraryId !== "new"
      ? await getItineraryById(params.itineraryId)
      : null;

  const planAgent = new PlanAgent();
  return planAgent.planStream(
    params.message,
    params.history ?? [],
    params.itineraryContext,
    existingItinerary,
    params.userId ?? "demo-user-001"
  );
}

export async function runPlanChat(params: PlanStreamParams): Promise<PlanChatResult> {
  const stream = await createPlanStream(params);
  const events: SSEEvent[] = [];
  let text = "";
  let itinerary: SSEEvent["data"] | null = null;

  for await (const event of stream) {
    events.push(event);
    if (event.type === "text" && event.content) {
      text += event.content;
    }
    if (event.type === "itinerary_snapshot" && event.data) {
      itinerary = event.data;
    }
  }

  return { text, events, itinerary };
}
