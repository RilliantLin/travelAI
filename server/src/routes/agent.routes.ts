import { Router, Request, Response } from "express";
import { createPlanStream } from "../services/plan.service";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Codex planning bridge API",
    endpoints: {
      "POST /plan/stream": "SSE planning bridge endpoint",
    },
  });
});

router.post("/plan/stream", async (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

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
    console.error("Plan stream error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Failed to process plan stream",
      });
    } else {
      res.write(
        `data: ${JSON.stringify({
          type: "text",
          content: "规划过程中遇到错误，请稍后重试。",
        })}\n\n`
      );
      res.write(
        `data: ${JSON.stringify({ type: "action", action: "loading_done" })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

export default router;
