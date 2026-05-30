import { Request, Response } from "express";
import { z } from "zod";
import {
  getItineraryChatMessages as getItineraryChatMessagesService,
  saveItineraryChatMessages as saveItineraryChatMessagesService,
} from "../services/itinerary-chat.service";

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

    const messages = await getItineraryChatMessagesService(itineraryId);

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

    const trimmedMessages = await saveItineraryChatMessagesService(itineraryId, req.body);

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
