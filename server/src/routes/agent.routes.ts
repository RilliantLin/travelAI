import { Router, Request, Response } from "express";
import { travelAgent, ChatMessage } from "../agent";
import { createPlanStream } from "../services/plan.service";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Agent API",
    endpoints: {
      "POST /chat": "Send a message to the AI agent",
      "POST /chat/stream": "Stream response from the AI agent",
      "POST /intent": "Detect intent from user input",
      "POST /plan/stream": "Stream plan response with tool calling",
    },
  });
});

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await travelAgent.chat(message, history as ChatMessage[]);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process message",
    });
  }
});

router.post("/chat/stream", async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = travelAgent.chatStream(message, history as ChatMessage[]);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Stream chat error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process streaming message",
    });
  }
});

router.post("/plan/stream", async (req: Request, res: Response) => {
  try {
    const { message, history = [], itineraryContext, itineraryId, userId = "demo-user-001" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const stream = await createPlanStream({
      message,
      history: history as ChatMessage[],
      itineraryContext,
      itineraryId,
      userId,
    });

    for await (const event of stream) {
      const eventData = JSON.stringify(event);
      res.write(`data: ${eventData}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Plan stream error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Failed to process plan stream",
      });
    } else {
      res.write(
        `data: ${JSON.stringify({ type: "text", content: "\n\n抱歉，处理出错了。" })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

router.post("/intent", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const { detectIntent } = await import("../agent/intent");
    const intent = await detectIntent(message);

    res.json({
      success: true,
      data: intent,
    });
  } catch (error) {
    console.error("Intent detection error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to detect intent",
    });
  }
});

export default router;
