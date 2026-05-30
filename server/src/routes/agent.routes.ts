import { Router, Request, Response } from "express";
import { createPlanStream } from "../services/plan.service";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Agent API is deprecated",
    deprecated: true,
    replacement: "Use Codex Agent with travel CLI tools.",
    endpoints: {
      "POST /plan/stream": "Deprecated compatibility SSE endpoint",
    },
  });
});

router.post("/plan/stream", async (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Deprecation", "true");
    res.setHeader("Sunset", "Sat, 30 May 2026 00:00:00 GMT");

    const stream = createPlanStream({
      message: req.body?.message ?? "",
      history: req.body?.history ?? [],
      itineraryContext: req.body?.itineraryContext,
      itineraryId: req.body?.itineraryId,
      userId: req.body?.userId,
    });

    for await (const event of stream) {
      if (event.type === "done") continue;
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Deprecated plan stream error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Failed to process deprecated plan stream",
      });
    } else {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

export default router;

