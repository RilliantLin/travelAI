import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { PrismaClient } from "@prisma/client";
import { getStreamingChatModel, getChatModel } from "./llm";
import { getToolCallFormat } from "./tools";
import { itineraryAgent } from "./itinerary-agent";
import { formatDate, getDaysBetween, minutesToTime, timeToMinutes } from "../lib/utils/time";
import { ChatMessage } from "./index";
import {
  Itinerary,
  DayPlan,
  Activity,
  AccommodationPlan,
} from "../types/itinerary";

const prisma = new PrismaClient();

const PLAN_SYSTEM_PROMPT = `你是一个专业的旅游规划助手，名叫"小旅"。你同时具备自然语言对话能力和行程操作能力。

你的核心职责：
1. 与用户自然对话，了解旅行需求
2. 通过工具调用来创建、修改行程
3. 每次修改后向用户解释做了什么变更

对话要求：
- 友好、专业、简洁
- 使用中文回答
- 先用自然语言回复用户，再附上工具调用（如需要）
- 不确定时主动询问细节

当前日期：${new Date().toLocaleDateString("zh-CN")}

${getToolCallFormat()}`;

interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

const KNOWN_TOOLS = new Set([
  "generate_itinerary",
  "add_activity",
  "remove_activity",
  "replace_activity",
  "modify_activity",
  "set_transport",
  "set_accommodation",
  "reorder_day",
]);

/** From first `{`, return a balanced JSON substring or null (supports nested objects). */
function extractBalancedJsonObject(s: string, openBraceIndex: number): string | null {
  if (s[openBraceIndex] !== "{") return null;
  let depth = 0;
  for (let j = openBraceIndex; j < s.length; j++) {
    const c = s[j];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return s.slice(openBraceIndex, j + 1);
    }
  }
  return null;
}

function parseToolCalls(text: string): { cleanText: string; toolCalls: ToolCall[] } {
  const toolCalls: ToolCall[] = [];
  let cleanText = text;

  // Format 1: <tool_call>...</tool_call> (properly closed)
  const closedTagRegex = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
  let match;
  while ((match = closedTagRegex.exec(text)) !== null) {
    const parsed = tryParseToolCall(match[1].trim());
    if (parsed) toolCalls.push(parsed);
  }
  cleanText = cleanText.replace(closedTagRegex, "").trim();

  // Format 2: <tool_call>... (unclosed — LLM sometimes omits closing tag)
  if (toolCalls.length === 0) {
    const unclosedTagRegex = /<tool_call>\s*([\s\S]+)$/g;
    while ((match = unclosedTagRegex.exec(cleanText)) !== null) {
      const parsed = tryParseToolCall(match[1].trim());
      if (parsed) toolCalls.push(parsed);
    }
    if (toolCalls.length > 0) {
      cleanText = cleanText.replace(unclosedTagRegex, "").trim();
    }
  }

  // Format 3a: tool_name + whitespace + {json} (same line or only spaces/newlines before `{` — common LLM drift)
  if (toolCalls.length === 0) {
    const sameLineHead = new RegExp(
      `(?:^|\\n)\\s*(${[...KNOWN_TOOLS].join("|")})\\s*(?=\\{)`,
      "g"
    );
    const sameLineMatches: {
      start: number;
      end: number;
      name: string;
      arguments: Record<string, any>;
    }[] = [];
    let sm: RegExpExecArray | null;
    while ((sm = sameLineHead.exec(cleanText)) !== null) {
      const braceAt = sm.index + sm[0].length;
      const jsonSlice = extractBalancedJsonObject(cleanText, braceAt);
      if (!jsonSlice) continue;
      try {
        sameLineMatches.push({
          start: sm.index,
          end: braceAt + jsonSlice.length,
          name: sm[1],
          arguments: JSON.parse(jsonSlice),
        });
      } catch (e) {
        console.error("Failed to parse same-line tool JSON:", sm[1], e);
      }
    }
    if (sameLineMatches.length > 0) {
      for (const row of sameLineMatches) {
        toolCalls.push({ name: row.name, arguments: row.arguments });
      }
      sameLineMatches.sort((a, b) => b.start - a.start);
      let ct = cleanText;
      for (const row of sameLineMatches) {
        ct = ct.slice(0, row.start) + ct.slice(row.end);
      }
      cleanText = ct.trim();
    }
  }

  // Format 3 (fallback): tool_name\n{...JSON args...} without any tags
  if (toolCalls.length === 0) {
    const bareRegex = new RegExp(
      `(?:^|\\n)(${[...KNOWN_TOOLS].join("|")})\\s*\\n\\s*(\\{[\\s\\S]*?\\})(?=\\n|$)`,
      "g"
    );
    while ((match = bareRegex.exec(cleanText)) !== null) {
      const toolName = match[1];
      try {
        const args = JSON.parse(match[2].trim());
        toolCalls.push({ name: toolName, arguments: args });
      } catch (e) {
        console.error("Failed to parse bare tool call:", toolName, e);
      }
    }
    if (toolCalls.length > 0) {
      cleanText = cleanText.replace(bareRegex, "").trim();
    }
  }

  return { cleanText, toolCalls };
}

function tryParseToolCall(inner: string): ToolCall | null {
  // Try standard JSON: {"name":"...","arguments":{...}}
  try {
    const parsed = JSON.parse(inner);
    if (parsed.name && parsed.arguments) return parsed;
  } catch {}

  // Try: tool_name\n{...args...} inside <tool_call> tags
  const lines = inner.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2 && KNOWN_TOOLS.has(lines[0])) {
    try {
      const args = JSON.parse(lines.slice(1).join(""));
      return { name: lines[0], arguments: args };
    } catch {}
  }

  return null;
}

function convertToLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
  return messages.map((msg) => {
    if (msg.role === "user") return new HumanMessage(msg.content);
    if (msg.role === "assistant") return new AIMessage(msg.content);
    return new SystemMessage(msg.content);
  });
}

export interface SSEEvent {
  type: "text" | "action" | "itinerary_snapshot";
  content?: string;
  action?: string;
  payload?: any;
  data?: Itinerary;
}

export class PlanAgent {
  private currentItinerary: Itinerary | null = null;

  /** Upsert 行程到数据库，返回真实的数据库 ID */
  private async persistItinerary(userId: string): Promise<string> {
    const it = this.currentItinerary!;
    const isTemp = it.id.startsWith("plan-");

    // 确保 demo 用户存在
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: `${userId}@demo.local`,
        name: "演示用户",
      },
      update: {},
    });

    const totalBudget = it.budget?.total ?? null;

    // 核心 upsert：创建或更新行程顶层记录
    let itineraryDbId: string;
    if (isTemp) {
      const created = await prisma.itinerary.create({
        data: {
          userId,
          title: it.title,
          destination: it.destination,
          startDate: new Date(it.startDate),
          endDate: new Date(it.endDate),
          description: it.description ?? null,
          totalBudget,
          status: it.status ?? "draft",
        },
      });
      itineraryDbId = created.id;
    } else {
      await prisma.itinerary.update({
        where: { id: it.id },
        data: {
          title: it.title,
          destination: it.destination,
          startDate: new Date(it.startDate),
          endDate: new Date(it.endDate),
          description: it.description ?? null,
          totalBudget,
          status: it.status ?? "draft",
          updatedAt: new Date(),
        },
      });
      itineraryDbId = it.id;
      // 清空旧天计划，稍后重建
      await prisma.itineraryDay.deleteMany({ where: { itineraryId: itineraryDbId } });
    }

    // 重建每天的计划
    for (const day of it.days) {
      const savedDay = await prisma.itineraryDay.create({
        data: {
          itineraryId: itineraryDbId,
          dayNumber: day.dayNumber,
          date: new Date(day.date),
          summary: day.summary ?? null,
        },
      });

      for (const act of day.activities) {
        await prisma.activity.create({
          data: {
            itineraryDayId: savedDay.id,
            name: act.name,
            description: act.description ?? null,
            location: act.location?.address ?? null,
            latitude: act.location?.lat ?? null,
            longitude: act.location?.lng ?? null,
            startTime: act.startTime ?? null,
            endTime: act.endTime ?? null,
            estimatedCost: act.estimatedCost ?? null,
            category: act.type ?? null,
            rating: act.rating ?? null,
            imageUrl: act.imageUrl ?? null,
          },
        });
      }

      for (const meal of day.meals ?? []) {
        await prisma.meal.create({
          data: {
            itineraryDayId: savedDay.id,
            name: meal.name,
            type: meal.type,
            location: meal.location?.address ?? null,
            latitude: meal.location?.lat ?? null,
            longitude: meal.location?.lng ?? null,
            estimatedCost: meal.estimatedCost ?? null,
          },
        });
      }

      if (day.accommodation) {
        const acc = day.accommodation;
        await prisma.accommodation.create({
          data: {
            itineraryDayId: savedDay.id,
            name: acc.name,
            type: acc.type ?? null,
            location: acc.location?.address ?? null,
            latitude: acc.location?.lat ?? null,
            longitude: acc.location?.lng ?? null,
            checkIn: acc.checkIn ?? null,
            checkOut: acc.checkOut ?? null,
            estimatedCost: acc.estimatedCost ?? null,
            rating: acc.rating ?? null,
          },
        });
      }
    }

    return itineraryDbId;
  }

  async *planStream(
    userInput: string,
    conversationHistory: ChatMessage[] = [],
    itineraryContext?: string,
    existingItinerary?: Itinerary | null,
    userId: string = "demo-user-001"
  ): AsyncGenerator<SSEEvent, void, unknown> {
    if (existingItinerary) {
      this.currentItinerary = existingItinerary;
    }

    const systemPrompt = itineraryContext
      ? `${PLAN_SYSTEM_PROMPT}\n\n--- 当前行程状态 ---\n${itineraryContext}`
      : PLAN_SYSTEM_PROMPT;

    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      ...convertToLangChainMessages(conversationHistory),
      new HumanMessage(userInput),
    ];

    const model = getChatModel();
    let fullResponse = "";

    try {
      const response = await model.invoke(messages);
      fullResponse =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
    } catch (error) {
      console.error("LLM invoke error:", error);
      yield { type: "text", content: "抱歉，AI 服务暂时不可用，请稍后再试。" };
      return;
    }

    const { cleanText, toolCalls } = parseToolCalls(fullResponse);

    if (cleanText) {
      const chunks = splitIntoChunks(cleanText, 20);
      for (const chunk of chunks) {
        yield { type: "text", content: chunk };
      }
    }

    if (toolCalls.length > 0) {
      yield {
        type: "action",
        action: "set_loading",
        payload: { message: "正在处理行程变更..." },
      };

      for (const toolCall of toolCalls) {
        try {
          await this.executeToolCall(toolCall);
        } catch (error) {
          console.error(`Tool call ${toolCall.name} failed:`, error);
        }
      }

      if (this.currentItinerary) {
        try {
          const dbId = await this.persistItinerary(userId);
          this.currentItinerary.id = dbId;
          this.currentItinerary.updatedAt = new Date().toISOString();
        } catch (err) {
          console.error("Failed to persist itinerary to DB:", err);
        }

        yield {
          type: "itinerary_snapshot",
          data: this.currentItinerary,
        };
      }

      yield {
        type: "action",
        action: "loading_done",
      };

      // 若 LLM 没有生成自然语言文本（仅输出工具调用），补充一条兜底回复
      if (!cleanText) {
        const fallback = buildFallbackMessage(toolCalls);
        const chunks = splitIntoChunks(fallback, 20);
        for (const chunk of chunks) {
          yield { type: "text", content: chunk };
        }
      }
    }
  }

  private async executeToolCall(toolCall: ToolCall): Promise<void> {
    const { name, arguments: args } = toolCall;

    switch (name) {
      case "generate_itinerary":
        await this.handleGenerateItinerary(args);
        break;
      case "add_activity":
        this.handleAddActivity(args);
        break;
      case "remove_activity":
        this.handleRemoveActivity(args);
        break;
      case "replace_activity":
        this.handleReplaceActivity(args);
        break;
      case "modify_activity":
        this.handleModifyActivity(args);
        break;
      case "set_transport":
        this.handleSetTransport(args);
        break;
      case "set_accommodation":
        this.handleSetAccommodation(args);
        break;
      case "reorder_day":
        this.handleReorderDay(args);
        break;
      default:
        console.warn("Unknown tool:", name);
    }
  }

  private async handleGenerateItinerary(args: Record<string, any>): Promise<void> {
    const { destination, days, startDate, travelStyle } = args;

    const start =
      startDate || formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const endDateObj = new Date(start);
    endDateObj.setDate(endDateObj.getDate() + (days - 1));
    const end = formatDate(endDateObj);

    try {
      const itinerary = await itineraryAgent.generateItinerary({
        destination,
        startDate: start,
        endDate: end,
        userId: "demo-user-001",
        title: `${destination}${days}日游`,
        preferences: travelStyle ? { travelStyle } : undefined,
      });

      itinerary.id = `plan-${Date.now()}`;
      this.currentItinerary = itinerary;
    } catch (error) {
      console.error("Generate itinerary error:", error);
      this.currentItinerary = this.createFallbackItinerary(
        destination,
        days,
        start,
        end
      );
    }
  }

  private createFallbackItinerary(
    destination: string,
    days: number,
    startDate: string,
    endDate: string
  ): Itinerary {
    const dayPlans: DayPlan[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dayPlans.push({
        dayNumber: i + 1,
        date: formatDate(d),
        activities: [],
        meals: [],
        summary: `第${i + 1}天行程`,
      });
    }

    return {
      id: `plan-${Date.now()}`,
      userId: "demo-user-001",
      title: `${destination}${days}日游`,
      destination,
      startDate,
      endDate,
      totalDays: days,
      days: dayPlans,
      status: "draft",
      description: `${destination}${days}天旅行计划`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private handleAddActivity(args: Record<string, any>): void {
    if (!this.currentItinerary) return;
    const { dayIndex, name, type, duration, description, estimatedCost } = args;

    const day = this.currentItinerary.days[dayIndex];
    if (!day) return;

    const lastActivity = day.activities[day.activities.length - 1];
    const startMinutes = lastActivity
      ? timeToMinutes(lastActivity.endTime) + 30
      : timeToMinutes("09:00");

    const newActivity: Activity = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: type || "attraction",
      name,
      location: { lat: 0, lng: 0, address: "" },
      description: description || "",
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(startMinutes + (duration || 120)),
      duration: duration || 120,
      estimatedCost: estimatedCost || 0,
      bookingRequired: false,
    };

    day.activities.push(newActivity);
    this.currentItinerary.updatedAt = new Date().toISOString();
  }

  private handleRemoveActivity(args: Record<string, any>): void {
    if (!this.currentItinerary) return;
    const { dayIndex, activityName } = args;

    const day = this.currentItinerary.days[dayIndex];
    if (!day) return;

    const idx = day.activities.findIndex(
      (a) => a.name.includes(activityName) || activityName.includes(a.name)
    );
    if (idx >= 0) {
      day.activities.splice(idx, 1);
      this.recalculateTimes(day);
      this.currentItinerary.updatedAt = new Date().toISOString();
    }
  }

  private handleReplaceActivity(args: Record<string, any>): void {
    if (!this.currentItinerary) return;
    const {
      dayIndex,
      oldActivityName,
      newName,
      newType,
      newDuration,
      newDescription,
      newEstimatedCost,
    } = args;

    const day = this.currentItinerary.days[dayIndex];
    if (!day) return;

    const idx = day.activities.findIndex(
      (a) =>
        a.name.includes(oldActivityName) || oldActivityName.includes(a.name)
    );
    if (idx >= 0) {
      const old = day.activities[idx];
      const duration = newDuration || old.duration;
      day.activities[idx] = {
        ...old,
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: newName,
        type: newType || old.type,
        duration,
        endTime: minutesToTime(timeToMinutes(old.startTime) + duration),
        description: newDescription || "",
        estimatedCost: newEstimatedCost ?? old.estimatedCost,
      };
      this.currentItinerary.updatedAt = new Date().toISOString();
    }
  }

  private handleModifyActivity(args: Record<string, any>): void {
    if (!this.currentItinerary) return;
    const { dayIndex, activityName, changes } = args;

    const day = this.currentItinerary.days[dayIndex];
    if (!day) return;

    const activity = day.activities.find(
      (a) => a.name.includes(activityName) || activityName.includes(a.name)
    );
    if (!activity) return;

    if (changes.startTime) activity.startTime = changes.startTime;
    if (changes.endTime) activity.endTime = changes.endTime;
    if (changes.duration) {
      activity.duration = changes.duration;
      if (activity.startTime && !changes.endTime) {
        activity.endTime = minutesToTime(
          timeToMinutes(activity.startTime) + changes.duration
        );
      }
    }
    if (changes.estimatedCost !== undefined)
      activity.estimatedCost = changes.estimatedCost;
    if (changes.description) activity.description = changes.description;

    this.currentItinerary.updatedAt = new Date().toISOString();
  }

  private handleSetTransport(args: Record<string, any>): void {
    if (!this.currentItinerary) return;
    const { dayIndex, from, to, mode, duration, cost, details } = args;

    const day = this.currentItinerary.days[dayIndex];
    if (!day) return;

    const transportActivity: Activity = {
      id: `transport-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "transport",
      name: `${from} → ${to}（${modeLabel(mode)}）`,
      location: { lat: 0, lng: 0, address: from },
      description: details || `${modeLabel(mode)}从${from}到${to}`,
      startTime: "00:00",
      endTime: minutesToTime(duration || 60),
      duration: duration || 60,
      estimatedCost: cost || 0,
      bookingRequired: mode === "flight" || mode === "train",
      notes: details,
    };

    day.activities.unshift(transportActivity);
    this.recalculateTimes(day);
    this.currentItinerary.updatedAt = new Date().toISOString();
  }

  private handleSetAccommodation(args: Record<string, any>): void {
    if (!this.currentItinerary) return;
    const { dayIndex, name, type, estimatedCost, rating, address } = args;

    const day = this.currentItinerary.days[dayIndex];
    if (!day) return;

    day.accommodation = {
      id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      location: { lat: 0, lng: 0, address: address || "" },
      type: type || "酒店",
      checkIn: "14:00",
      checkOut: "12:00",
      estimatedCost: estimatedCost || 0,
      rating,
    };
    this.currentItinerary.updatedAt = new Date().toISOString();
  }

  private handleReorderDay(args: Record<string, any>): void {
    if (!this.currentItinerary) return;
    const { dayIndex, activityNames } = args;

    const day = this.currentItinerary.days[dayIndex];
    if (!day) return;

    const reordered: Activity[] = [];
    for (const targetName of activityNames) {
      const found = day.activities.find(
        (a) => a.name.includes(targetName) || targetName.includes(a.name)
      );
      if (found) reordered.push(found);
    }

    const remaining = day.activities.filter((a) => !reordered.includes(a));
    day.activities = [...reordered, ...remaining];
    this.recalculateTimes(day);
    this.currentItinerary.updatedAt = new Date().toISOString();
  }

  private recalculateTimes(day: DayPlan): void {
    let currentTime = timeToMinutes("08:30");
    for (const activity of day.activities) {
      activity.startTime = minutesToTime(currentTime);
      activity.endTime = minutesToTime(currentTime + activity.duration);
      currentTime += activity.duration + 30;
    }
  }
}

function modeLabel(mode: string): string {
  const labels: Record<string, string> = {
    walking: "步行",
    bus: "公交",
    subway: "地铁",
    taxi: "打车",
    train: "火车",
    flight: "飞机",
    driving: "自驾",
  };
  return labels[mode] || mode;
}

function buildFallbackMessage(toolCalls: ToolCall[]): string {
  const first = toolCalls[0];
  switch (first.name) {
    case "generate_itinerary": {
      const { destination, days } = first.arguments;
      return `好的，已为您生成 ${destination}${days} 日游行程！请查看中间的行程面板，如需调整随时告诉我。`;
    }
    case "add_activity":
      return `已为您添加景点「${first.arguments.name}」，行程已更新！`;
    case "remove_activity":
      return `已为您从行程中删除「${first.arguments.activityName}」。`;
    case "replace_activity":
      return `已将「${first.arguments.oldActivityName}」替换为「${first.arguments.newName}」。`;
    case "modify_activity":
      return `已为您更新「${first.arguments.activityName}」的信息。`;
    case "set_transport":
      return `已设置${first.arguments.from}到${first.arguments.to}的交通方案。`;
    case "set_accommodation":
      return `已将第 ${first.arguments.dayIndex + 1} 天的住宿设置为「${first.arguments.name}」。`;
    case "reorder_day":
      return `已为您调整第 ${first.arguments.dayIndex + 1} 天的行程顺序。`;
    default:
      return "行程已更新，请查看中间面板！";
  }
}

function splitIntoChunks(text: string, avgSize: number): string[] {
  if (text.length <= avgSize) return [text];

  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    const size = Math.min(
      avgSize + Math.floor(Math.random() * 10) - 5,
      remaining.length
    );
    chunks.push(remaining.slice(0, size));
    remaining = remaining.slice(size);
  }
  return chunks;
}

export const planAgent = new PlanAgent();
