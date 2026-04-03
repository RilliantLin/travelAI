"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble, ChatInput, QuickActions } from ".";
import { sendStreamMessage } from "@/lib/api/chat";
import type { ChatMessage } from "@/lib/api/chat";
import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "travel-chat-history";

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
    // ignore
  }
}

interface ChatWindowProps {
  className?: string;
}

export function ChatWindow({ className }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
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
  }, [messages, streamingContent]);

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      setIsStreaming(true);
      setStreamingContent("");

      await sendStreamMessage(
        content,
        messages,
        (chunk) => {
          setStreamingContent((prev) => prev + chunk);
        },
        (fullMessage) => {
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: fullMessage,
          };
          const finalMessages = [...updatedMessages, assistantMessage];
          setMessages(finalMessages);
          saveHistory(finalMessages);
          setIsStreaming(false);
          setStreamingContent("");
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
            <MessageBubble
              key={i}
              message={msg}
              isStreaming={
                isStreaming && i === allMessages.length - 1 && msg.role === "assistant"
              }
            />
          ))}

          <div ref={messagesEndRef} />
        </div>

        {showQuickActions && <QuickActions onSelect={handleSend} />}

        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
