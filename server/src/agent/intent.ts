import { z } from "zod";
import { getStructuredChatModel } from "./llm";

export const IntentSchema = z.object({
  intent: z.enum([
    "plan_itinerary",
    "search_attractions",
    "search_restaurants",
    "search_hotels",
    "search_flights",
    "check_weather",
    "get_budget",
    "modify_preferences",
    "general_chat",
    "unknown",
  ]),
  confidence: z.number().min(0).max(1),
  entities: z.object({
    destination: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    budget: z.number().optional(),
    travelers: z.number().optional(),
    preferences: z.array(z.string()).optional(),
    cuisine: z.string().optional(),
    hotelType: z.string().optional(),
  }),
});

export type Intent = z.infer<typeof IntentSchema>;

const INTENT_PROMPT = `你是一个旅游助手的意图识别模块。分析用户的输入，识别用户意图并提取相关实体。

意图类型说明：
- plan_itinerary: 用户想要规划行程或制定旅行计划
- search_attractions: 用户想要搜索景点或游玩地点
- search_restaurants: 用户想要搜索餐厅或美食推荐
- search_hotels: 用户想要搜索酒店或住宿
- search_flights: 用户想要搜索航班或机票
- check_weather: 用户想要查询天气信息
- get_budget: 用户想要了解预算或费用信息
- modify_preferences: 用户想要修改个人偏好设置
- general_chat: 普通聊天或问候
- unknown: 无法识别的意图

请分析以下用户输入，返回JSON格式的意图和提取的实体信息。
返回格式示例：
{"intent": "plan_itinerary", "confidence": 0.95, "entities": {"destination": "北京", "startDate": "2024-05-01", "endDate": "2024-05-05"}}

用户输入：`;

export async function detectIntent(userInput: string): Promise<Intent> {
  const defaultIntent: Intent = {
    intent: "unknown",
    confidence: 0,
    entities: {},
  };

  try {
    const model = getStructuredChatModel();
    const response = await model.invoke([
      { role: "system", content: INTENT_PROMPT },
      { role: "user", content: userInput },
    ]);

    const content = response.content;

    if (typeof content === "string") {
      try {
        const parsed = JSON.parse(content);
        return IntentSchema.parse(parsed);
      } catch {
        return defaultIntent;
      }
    }

    if (Array.isArray(content)) {
      const textContent = content.find((block) => block.type === "text");
      if (textContent && "text" in textContent) {
        const text = textContent.text;
        if (typeof text === "string") {
          try {
            const parsed = JSON.parse(text);
            return IntentSchema.parse(parsed);
          } catch {
            return defaultIntent;
          }
        }
      }
    }

    return defaultIntent;
  } catch (error) {
    console.error("Intent detection error:", error);
    return defaultIntent;
  }
}
