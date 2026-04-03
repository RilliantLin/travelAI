import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Weather API",
    endpoints: {
      "GET /": "API info",
      "GET /current": "Get current weather by location",
      "GET /forecast": "Get weather forecast by location",
    },
  });
});

router.get("/current", (req: Request, res: Response) => {
  const { city, lat, lon } = req.query;
  res.json({
    message: "Current weather",
    params: { city, lat, lon },
    data: null,
  });
});

router.get("/forecast", (req: Request, res: Response) => {
  const { city, lat, lon, days } = req.query;
  res.json({
    message: "Weather forecast",
    params: { city, lat, lon, days },
    data: null,
  });
});

export default router;
