import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Restaurant API",
    endpoints: {
      "GET /": "API info",
      "GET /search": "Search restaurants by location",
      "GET /:id": "Get restaurant details",
    },
  });
});

router.get("/search", (req: Request, res: Response) => {
  const { city, lat, lon, radius, cuisine, priceRange } = req.query;
  res.json({
    message: "Search restaurants",
    params: { city, lat, lon, radius, cuisine, priceRange },
    data: [],
  });
});

router.get("/:id", (req: Request, res: Response) => {
  res.json({ message: `Get restaurant ${req.params.id}`, data: null });
});

export default router;
