"use client";

import { useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { QuickActions } from "@/components/chat/QuickActions";
import { useChatStore } from "@/stores/chat-store";
import { useItineraryStore } from "@/stores/itinerary-store";
import { sendPlanStreamMessage } from "@/lib/api/chat";
import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatPanel() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    messages,
    isStreaming,
    streamingContent,
    initialize,
    addUserMessage,
    setStreaming,
    appendStreamingContent,
    finalizeAssistantMessage,
    setLinkedItineraryId,
    clearChat,
    linkedItineraryId,
    initialized,
    userId,
  } = useChatStore();

  const { itinerary, setItinerary, setLoading, applySnapshot } =
    useItineraryStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const buildItineraryContext = useCallback((): string | undefined => {
    if (!itinerary) return undefined;
    const daysSummary = itinerary.days
      .map((day) => {
        const acts = day.activities.map((a) => {
          let info = a.name;
          if (a.startTime && a.endTime) info += `(${a.startTime}-${a.endTime})`;
          return info;
        }).join("、");
        const acc = day.accommodation ? `住宿:${day.accommodation.name}` : "";
        const parts = [acts || "暂无安排", acc].filter(Boolean).join("；");
        return `第${day.dayNumber}天(${day.date}): ${parts}`;
      })
      .join("\n");
    const budgetInfo = itinerary.budget
      ? `\n预算: ¥${itinerary.budget.totalBudget || itinerary.budget.totalEstimated}`
      : "";
    return `当前行程：${itinerary.title}（${itinerary.startDate} ~ ${itinerary.endDate}，共${itinerary.totalDays}天）${budgetInfo}\n${daysSummary}`;
  }, [itinerary]);

  const handleSend = useCallback(
    async (content: string) => {
      const currentMessages = addUserMessage(content);
      setStreaming(true);

      const itineraryContext = buildItineraryContext();

      await sendPlanStreamMessage(
        content,
        currentMessages.slice(0, -1),
        itineraryContext,
        linkedItineraryId || undefined,
        (chunk) => {
          appendStreamingContent(chunk);
        },
        (fullMessage) => {
          finalizeAssistantMessage(fullMessage);
        },
        (action) => {
          if (action.type === "itinerary_snapshot" && action.data) {
            applySnapshot(action.data);
            const newId = action.data.id as string | undefined;
            if (newId && newId !== linkedItineraryId) {
              setLinkedItineraryId(newId);
              // 拿到真实 DB ID 后更新浏览器 URL（不刷新页面）
              router.replace(`/plan/${newId}`);
            }
          }
          if (action.type === "action" && action.action === "set_loading") {
            setLoading(true);
          }
          if (action.type === "action" && action.action === "loading_done") {
            setLoading(false);
          }
        },
        (error) => {
          finalizeAssistantMessage(
            `抱歉，这次请求没有成功：${error.message || "请稍后再试"}`
          );
          setStreaming(false);
          setLoading(false);
        },
        userId
      );
    },
    [
      addUserMessage,
      setStreaming,
      buildItineraryContext,
      linkedItineraryId,
      appendStreamingContent,
      finalizeAssistantMessage,
      applySnapshot,
      setLinkedItineraryId,
      setLoading,
      userId,
      router,
    ]
  );

  const handleClear = useCallback(() => {
    clearChat();
    setItinerary(null);
  }, [clearChat, setItinerary]);

  const allMessages = isStreaming
    ? [...messages, { role: "assistant" as const, content: streamingContent }]
    : messages;

  const showQuickActions = messages.length === 0 && !isStreaming;

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">AI 助手</h2>
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

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {allMessages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-gray-900">
              开始规划你的旅行
            </h3>
            <p className="max-w-[200px] text-xs text-gray-500">
              告诉我目的地和天数，我会生成详细行程
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
  );
}
