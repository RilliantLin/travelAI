import { ChatZhipuAI } from "@langchain/community/chat_models/zhipuai";

let _chatModel: ChatZhipuAI | null = null;
let _streamingChatModel: ChatZhipuAI | null = null;
let _structuredChatModel: ChatZhipuAI | null = null;

function getApiKey(): string | undefined {
  return process.env.ZHIPU_API_KEY;
}

function createChatModel(options?: {
  modelName?: string;
  temperature?: number;
  streaming?: boolean;
}): ChatZhipuAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("ZHIPU_API_KEY is not set. Please configure your API key in .env file.");
  }
  return new ChatZhipuAI({
    model: options?.modelName || "glm-4-flash",
    temperature: options?.temperature ?? 0.7,
    streaming: options?.streaming ?? false,
    zhipuAIApiKey: apiKey,
  });
}

export function getChatModel(): ChatZhipuAI {
  if (!_chatModel) {
    _chatModel = createChatModel();
  }
  return _chatModel;
}

export function getStreamingChatModel(): ChatZhipuAI {
  if (!_streamingChatModel) {
    _streamingChatModel = createChatModel({ streaming: true });
  }
  return _streamingChatModel;
}

export function getStructuredChatModel(): ChatZhipuAI {
  if (!_structuredChatModel) {
    _structuredChatModel = createChatModel({ temperature: 0 });
  }
  return _structuredChatModel;
}

export const chatModel = {
  invoke: (...args: Parameters<ChatZhipuAI["invoke"]>) => getChatModel().invoke(...args),
  stream: (...args: Parameters<ChatZhipuAI["stream"]>) => getChatModel().stream(...args),
};

export const streamingChatModel = {
  invoke: (...args: Parameters<ChatZhipuAI["invoke"]>) => getStreamingChatModel().invoke(...args),
  stream: (...args: Parameters<ChatZhipuAI["stream"]>) => getStreamingChatModel().stream(...args),
};

export const structuredChatModel = {
  invoke: (...args: Parameters<ChatZhipuAI["invoke"]>) => getStructuredChatModel().invoke(...args),
  stream: (...args: Parameters<ChatZhipuAI["stream"]>) => getStructuredChatModel().stream(...args),
};
