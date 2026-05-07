const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}


export interface SSEAction {
  type: "action" | "itinerary_snapshot";
  action?: string;
  data?: any;
  payload?: any;
}

export async function sendPlanStreamMessage(
  message: string,
  history: ChatMessage[] = [],
  itineraryContext?: string,
  itineraryId?: string,
  onChunk: (chunk: string) => void = () => {},
  onDone: (fullMessage: string) => void = () => {},
  onAction: (action: SSEAction) => void = () => {},
  onError: (error: Error) => void = () => {},
  userId?: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/plan/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history,
        itineraryContext,
        itineraryId,
        userId,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "流式请求失败");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法读取响应流");

    const decoder = new TextDecoder();
    let fullMessage = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          onDone(fullMessage);
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "text" && parsed.content) {
            fullMessage += parsed.content;
            onChunk(parsed.content);
          } else if (parsed.type === "action") {
            onAction(parsed);
          } else if (parsed.type === "itinerary_snapshot") {
            onAction(parsed);
          } else if (parsed.content) {
            fullMessage += parsed.content;
            onChunk(parsed.content);
          }
        } catch {
          // skip invalid JSON
        }
      }
    }

    if (buffer.trim()) {
      const remaining = buffer.trim();
      if (remaining.startsWith("data: ")) {
        const data = remaining.slice(6).trim();
        if (data === "[DONE]") {
          onDone(fullMessage);
          return;
        }
      }
    }

    onDone(fullMessage);
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}
