import type { ChatMessage } from "@/lib/api/plan-bridge";
import { apiRequest, jsonBody } from "./client";

export async function getItineraryChatMessages(
  itineraryId: string
): Promise<ChatMessage[]> {
  try {
    return await apiRequest<ChatMessage[]>(
      `/itineraries/${itineraryId}/chat-messages`
    );
  } catch {
    return [];
  }
}

export async function saveItineraryChatMessages(
  itineraryId: string,
  messages: ChatMessage[]
): Promise<void> {
  await apiRequest(`/itineraries/${itineraryId}/chat-messages`, {
    method: "PUT",
    body: jsonBody({ messages }),
    unwrap: false,
  });
}
