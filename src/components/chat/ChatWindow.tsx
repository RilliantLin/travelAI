"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble, ChatInput, QuickActions, ItineraryPreviewCard } from ".";
import { sendStreamMessage, detectIntent } from "@/lib/api/chat";
import { createItinerary } from "@/lib/api/itinerary";
import type { ChatMessage } from "@/lib/api/chat";
import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "travel-chat-history";

const DEMO_USER_ID = "demo-user-001";

interface ItineraryCardData {
  destination: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  itineraryId?: string;
}

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
  }
}

function extractItineraryInfo(
  userMessage: string,
  assistantMessage: string
): Partial<ItineraryCardData> | null {
  const combined = `${userMessage} ${assistantMessage}`.toLowerCase();

  const cityMatch = combined.match(/(?:去|到|前往|目的地|游玩)[\s]*([\u4e00-\u9fa5]{2,10})(?:\s|的|玩|旅|游|天|日|$)/);
  const daysMatch = combined.match(/(\d+)\s*(?:天|日|晚)/);
  const dateMatch = combined.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/g);

  const destination = cityMatch?.[1];
  const totalDays = daysMatch ? parseInt(daysMatch[1], 10) : undefined;

  if (!destination && !totalDays) return null;

  return {
    destination: destination || "旅行目的地",
    totalDays: totalDays || 3,
    startDate: dateMatch?.[0],
    endDate: dateMatch?.[1],
  };
}

function generateDemoDates(totalDays: number = 3): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), endDate: fmt(end) };
}

interface ChatWindowProps {
  className?: string;
}

export function ChatWindow({ className }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [itineraryCards, setItineraryCards] = useState<Map<number, ItineraryCardData>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const saved = loadHistory();
      if (saved.length > 0) {
        setMessages(saved);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, itineraryCards]);

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      setIsStreaming(true);
      setStreamingContent("");

      const assistantIndex = updatedMessages.length;

      await sendStreamMessage(
        content,
        messages,
        (chunk) => {
          setStreamingContent((prev) => prev + chunk);
        },
        async (fullMessage) => {
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: fullMessage,
          };
          const finalMessages = [...updatedMessages, assistantMessage];
          setMessages(finalMessages);
          saveHistory(finalMessages);
          setIsStreaming(false);
          setStreamingContent("");

          try {
            const intentResult = await detectIntent(content);
            if (intentResult.intent === "plan_itinerary") {
              const info = extractItineraryInfo(content, fullMessage);
              if (info) {
                const dates = info.startDate && info.endDate
                  ? { startDate: info.startDate, endDate: info.endDate }
                  : generateDemoDates(info.totalDays);

                let itineraryId: string | undefined;

                try {
                  const itinerary = await createItinerary({
                    destination: info.destination || "旅行目的地",
                    startDate: dates.startDate,
                    endDate: dates.endDate,
                    userId: DEMO_USER_ID,
                    title: `${info.destination || ""}行程规划`,
                    description: fullMessage.slice(0, 200),
                  });
                  itineraryId = itinerary.id;
                } catch {
                  itineraryId = undefined;
                }

                setItineraryCards((prev) => {
                  const next = new Map(prev);
                  next.set(assistantIndex, {
                    destination: info.destination || "旅行目的地",
                    startDate: dates.startDate,
                    endDate: dates.endDate,
                    totalDays: info.totalDays || 3,
                    itineraryId,
                  });
                  return next;
                });
              }
            }
          } catch {
          }
        },
        () => {
          setIsStreaming(false);
          setStreamingContent("");
        }
      );
    },
    [messages]
  );

  const handleClear = useCallback(() => {
    setMessages([]);
    setItineraryCards(new Map());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const allMessages = isStreaming
    ? [...messages, { role: "assistant" as const, content: streamingContent }]
    : messages;

  const showQuickActions = messages.length === 0 && !isStreaming;

  return (
    <div className={className}>
      <div className="flex h-[calc(100vh-4rem)] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">AI 旅游助手</h2>
              <p className="text-xs text-gray-500">智能规划您的旅行</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-gray-500 hover:text-red-600"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              清空
            </Button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {allMessages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-gray-900">
                欢迎使用旅游规划助手
              </h3>
              <p className="max-w-xs text-sm text-gray-500">
                告诉我你想去哪里、玩几天，我会为你定制专属旅行方案
              </p>
            </div>
          )}

          {allMessages.map((msg, i) => (
            <div key={i}>
              <MessageBubble
                message={msg}
                isStreaming={
                  isStreaming && i === allMessages.length - 1 && msg.role === "assistant"
                }
              />
              {msg.role === "assistant" && itineraryCards.has(i) && (
                <ItineraryPreviewCard {...itineraryCards.get(i)!} />
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {showQuickActions && <QuickActions onSelect={handleSend} />}

        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
