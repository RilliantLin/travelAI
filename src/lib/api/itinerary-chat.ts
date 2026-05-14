import type { ChatMessage } from "@/lib/api/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function getItineraryChatMessages(
  itineraryId: string
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_BASE_URL}/itineraries/${itineraryId}/chat-messages`
  );
  const data = await response.json();

  if (!response.ok || !data.success) {
    return [];
  }

  return data.data || [];
}

export async function saveItineraryChatMessages(
  itineraryId: string,
  messages: ChatMessage[]
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/itineraries/${itineraryId}/chat-messages`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "保存聊天记录失败");
  }
}
