import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { getChatModel, getStreamingChatModel } from "./llm";
import { SYSTEM_PROMPT } from "./prompts";
import { detectIntent, Intent } from "./intent";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentResponse {
  message: string;
  intent?: Intent;
  suggestions?: string[];
}

export interface ConversationContext {
  messages: ChatMessage[];
  userId?: string;
  sessionId?: string;
}

function convertToLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
  return messages.map((msg) => {
    if (msg.role === "user") {
      return new HumanMessage(msg.content);
    } else if (msg.role === "assistant") {
      return new AIMessage(msg.content);
    }
    return new SystemMessage(msg.content);
  });
}

export class TravelAgent {
  async chat(
    userInput: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<AgentResponse> {
    const intent = await detectIntent(userInput);

    const messages: BaseMessage[] = [
      new SystemMessage(SYSTEM_PROMPT),
      ...convertToLangChainMessages(conversationHistory),
      new HumanMessage(userInput),
    ];

    const model = getChatModel();
    const response = await model.invoke(messages);
    const responseContent =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    return {
      message: responseContent,
      intent,
      suggestions: this.generateSuggestions(intent),
    };
  }

  async *chatStream(
    userInput: string,
    conversationHistory: ChatMessage[] = []
  ): AsyncGenerator<string, void, unknown> {
    const messages: BaseMessage[] = [
      new SystemMessage(SYSTEM_PROMPT),
      ...convertToLangChainMessages(conversationHistory),
      new HumanMessage(userInput),
    ];

    const model = getStreamingChatModel();
    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      const content =
        typeof chunk.content === "string" ? chunk.content : JSON.stringify(chunk.content);
      if (content) {
        yield content;
      }
    }
  }

  private generateSuggestions(intent: Intent): string[] {
    const suggestions: Record<string, string[]> = {
      plan_itinerary: [
        "帮我规划一个5天的行程",
        "推荐一些必去的景点",
        "预算大概需要多少？",
      ],
      search_attractions: [
        "有什么好玩的景点？",
        "推荐一些小众景点",
        "哪些景点适合拍照？",
      ],
      search_restaurants: [
        "有什么好吃的？",
        "推荐当地特色美食",
        "有什么网红餐厅？",
      ],
      search_hotels: [
        "推荐性价比高的酒店",
        "有什么民宿推荐？",
        "市中心有什么酒店？",
      ],
      search_flights: [
        "帮我查一下机票",
        "什么时候买机票最便宜？",
        "有直飞吗？",
      ],
      check_weather: [
        "未来几天天气怎么样？",
        "需要带什么衣服？",
        "会下雨吗？",
      ],
      get_budget: [
        "帮我算一下预算",
        "怎么省钱？",
        "人均大概多少？",
      ],
      modify_preferences: [
        "更新我的偏好设置",
        "我喜欢自然风光",
        "我喜欢美食之旅",
      ],
      general_chat: [
        "你好！有什么可以帮你的？",
        "我想去旅游",
        "推荐一个目的地",
      ],
      unknown: ["请告诉我更多细节", "你想了解什么？"],
    };

    return suggestions[intent.intent] || suggestions.unknown;
  }
}

export const travelAgent = new TravelAgent();
