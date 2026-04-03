import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Hotel API",
    endpoints: {
      "GET /": "API info",
      "GET /search": "Search hotels by location",
      "GET /:id": "Get hotel details",
    },
  });
});

router.get("/search", (req: Request, res: Response) => {
  const { city, lat, lon, checkIn, checkOut, guests, rooms } = req.query;
  res.json({
    message: "Search hotels",
    params: { city, lat, lon, checkIn, checkOut, guests, rooms },
    data: [],
  });
});

router.get("/:id", (req: Request, res: Response) => {
  res.json({ message: `Get hotel ${req.params.id}`, data: null });
});

export default router;
