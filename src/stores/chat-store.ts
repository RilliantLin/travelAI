import { create } from "zustand";
import type { ChatMessage } from "@/lib/api/chat";
import {
  getItineraryChatMessages,
  saveItineraryChatMessages,
} from "@/lib/api/itinerary-chat";

const DEMO_USER_ID = "demo-user-001";

function persistHistory(itineraryId: string | null, messages: ChatMessage[]) {
  if (!itineraryId) return;
  saveItineraryChatMessages(itineraryId, messages.slice(-50)).catch((error) => {
    console.error("保存聊天记录失败:", error);
  });
}

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  linkedItineraryId: string | null;
  userId: string;
  initialized: boolean;

  initialize: (itineraryId?: string | null) => Promise<void>;
  addUserMessage: (content: string) => ChatMessage[];
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  finalizeAssistantMessage: (fullMessage: string) => void;
  setStreaming: (streaming: boolean) => void;
  setLinkedItineraryId: (id: string | null) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: "",
  linkedItineraryId: null,
  userId: DEMO_USER_ID,
  initialized: false,

  initialize: async (itineraryId = null) => {
    const current = get();
    if (current.initialized && current.linkedItineraryId === itineraryId) return;

    set({
      messages: [],
      linkedItineraryId: itineraryId,
      initialized: true,
      isStreaming: false,
      streamingContent: "",
    });

    if (!itineraryId) return;

    try {
      const saved = await getItineraryChatMessages(itineraryId);
      if (get().linkedItineraryId === itineraryId) {
        set({ messages: saved });
      }
    } catch (error) {
      console.error("读取聊天记录失败:", error);
    }
  },

  addUserMessage: (content) => {
    const userMessage: ChatMessage = { role: "user", content };
    const updated = [...get().messages, userMessage];
    set({ messages: updated });
    persistHistory(get().linkedItineraryId, updated);
    return updated;
  },

  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((s) => ({ streamingContent: s.streamingContent + chunk })),

  finalizeAssistantMessage: (fullMessage) => {
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: fullMessage,
    };
    const finalMessages = [...get().messages, assistantMessage];
    set({
      messages: finalMessages,
      isStreaming: false,
      streamingContent: "",
    });
    persistHistory(get().linkedItineraryId, finalMessages);
  },

  setStreaming: (streaming) =>
    set({ isStreaming: streaming, ...(streaming ? { streamingContent: "" } : {}) }),

  setLinkedItineraryId: (id) => {
    const { linkedItineraryId, messages } = get();
    set({ linkedItineraryId: id });

    if (id && id !== linkedItineraryId && messages.length > 0) {
      persistHistory(id, messages);
    }
  },

  clearChat: () => {
    persistHistory(get().linkedItineraryId, []);
    set({ messages: [], streamingContent: "", linkedItineraryId: null });
  },
}));
