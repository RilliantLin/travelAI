import { z } from "zod";
import { ChatMessage } from "../contracts/events";
import {
  findChatMessages,
  replaceChatMessages,
} from "../repositories/itinerary-chat.repository";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export const saveChatMessagesSchema = z.object({
  messages: z.array(chatMessageSchema).max(50),
});

export async function getItineraryChatMessages(itineraryId: string) {
  return findChatMessages(itineraryId);
}

export async function saveItineraryChatMessages(
  itineraryId: string,
  input: unknown
): Promise<ChatMessage[]> {
  const { messages } = saveChatMessagesSchema.parse(input);
  const trimmedMessages = messages.slice(-50);
  await replaceChatMessages(itineraryId, trimmedMessages);
  return trimmedMessages;
}

