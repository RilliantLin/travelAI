import prisma from "../config/database";
import { ChatMessage } from "../contracts/events";

export function findChatMessages(itineraryId: string) {
  return prisma.itineraryChatMessage.findMany({
    where: { itineraryId },
    orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
    select: {
      role: true,
      content: true,
    },
  });
}

export function replaceChatMessages(itineraryId: string, messages: ChatMessage[]) {
  return prisma.$transaction([
    prisma.itineraryChatMessage.deleteMany({ where: { itineraryId } }),
    ...messages.map((message, index) =>
      prisma.itineraryChatMessage.create({
        data: {
          itineraryId,
          role: message.role,
          content: message.content,
          sequence: index,
        },
      })
    ),
  ]);
}

