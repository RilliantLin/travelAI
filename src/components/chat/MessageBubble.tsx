"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import type { ChatMessage } from "@/lib/api/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white border border-gray-200 text-gray-800 shadow-sm"
        )}
      >
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && (
            <span className="inline-block ml-1 animate-pulse">▊</span>
          )}
        </div>
      </div>
    </div>
  );
}
