import { create } from "zustand";
import type { ChatMessage } from "@/lib/api/chat";

const STORAGE_KEY = "travel-chat-history";
const DEMO_USER_ID = "demo-user-001";

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
  } catch {
    /* ignore */
  }
}

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  linkedItineraryId: string | null;
  userId: string;
  initialized: boolean;

  initialize: () => void;
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

  initialize: () => {
    if (get().initialized) return;
    const saved = loadHistory();
    set({ messages: saved, initialized: true });
  },

  addUserMessage: (content) => {
    const userMessage: ChatMessage = { role: "user", content };
    const updated = [...get().messages, userMessage];
    set({ messages: updated });
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
    saveHistory(finalMessages);
  },

  setStreaming: (streaming) =>
    set({ isStreaming: streaming, ...(streaming ? { streamingContent: "" } : {}) }),

  setLinkedItineraryId: (id) => set({ linkedItineraryId: id }),

  clearChat: () => {
    set({ messages: [], streamingContent: "", linkedItineraryId: null });
    localStorage.removeItem(STORAGE_KEY);
  },
}));
