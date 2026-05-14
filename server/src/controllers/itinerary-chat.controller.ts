import { Request, Response } from "express";
import prisma from "../config/database";
import { z } from "zod";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const saveChatMessagesSchema = z.object({
  messages: z.array(chatMessageSchema).max(50),
});

const getParam = (param: string | string[] | undefined): string | undefined => {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
};

export const getItineraryChatMessages = async (req: Request, res: Response) => {
  try {
    const itineraryId = getParam(req.params.id);
    if (!itineraryId) {
      return res.status(400).json({
        success: false,
        error: "Itinerary ID is required",
      });
    }

    const messages = await prisma.itineraryChatMessage.findMany({
      where: { itineraryId },
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
      select: {
        role: true,
        content: true,
      },
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Get itinerary chat messages error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get itinerary chat messages",
    });
  }
};

export const saveItineraryChatMessages = async (req: Request, res: Response) => {
  try {
    const itineraryId = getParam(req.params.id);
    if (!itineraryId) {
      return res.status(400).json({
        success: false,
        error: "Itinerary ID is required",
      });
    }

    const { messages } = saveChatMessagesSchema.parse(req.body);
    const trimmedMessages = messages.slice(-50);

    await prisma.$transaction([
      prisma.itineraryChatMessage.deleteMany({ where: { itineraryId } }),
      ...trimmedMessages.map((message, index) =>
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

    res.json({
      success: true,
      data: trimmedMessages,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid chat messages",
        details: error.issues,
      });
    }

    console.error("Save itinerary chat messages error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save itinerary chat messages",
    });
  }
};
