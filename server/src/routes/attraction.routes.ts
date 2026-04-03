import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Attraction API",
    endpoints: {
      "GET /": "API info",
      "GET /search": "Search attractions by location",
      "GET /:id": "Get attraction details",
    },
  });
});

router.get("/search", (req: Request, res: Response) => {
  const { city, lat, lon, radius, category } = req.query;
  res.json({
    message: "Search attractions",
    params: { city, lat, lon, radius, category },
    data: [],
  });
});

router.get("/:id", (req: Request, res: Response) => {
  res.json({ message: `Get attraction ${req.params.id}`, data: null });
});

export default router;
