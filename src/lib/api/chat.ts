const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentResponse {
  message: string;
  intent?: {
    intent: string;
    confidence: number;
    entities: Record<string, unknown>;
  };
  suggestions?: string[];
}

export async function sendMessage(
  message: string,
  history: ChatMessage[] = []
): Promise<AgentResponse> {
  const response = await fetch(`${API_BASE_URL}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "发送消息失败");
  }

  const data = await response.json();
  return data.data;
}

export async function sendStreamMessage(
  message: string,
  history: ChatMessage[] = [],
  onChunk: (chunk: string) => void,
  onDone: (fullMessage: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "流式请求失败");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("无法读取响应流");

    const decoder = new TextDecoder();
    let fullMessage = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            onDone(fullMessage);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullMessage += parsed.content;
              onChunk(parsed.content);
            }
          } catch {
            // skip invalid JSON
          }
        }
      }
    }

    onDone(fullMessage);
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function detectIntent(message: string): Promise<{
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
}> {
  const response = await fetch(`${API_BASE_URL}/agent/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("意图识别失败");
  }

  const data = await response.json();
  return data.data;
}
