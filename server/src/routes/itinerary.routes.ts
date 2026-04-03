import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Itinerary API",
    endpoints: {
      "GET /": "API info",
      "GET /:id": "Get itinerary by ID",
      "POST /": "Create itinerary",
      "PUT /:id": "Update itinerary",
      "DELETE /:id": "Delete itinerary",
      "GET /:id/days": "Get itinerary days",
      "POST /:id/days": "Add day to itinerary",
      "GET /:id/flights": "Get itinerary flights",
      "GET /:id/hotels": "Get itinerary hotels",
    },
  });
});

router.get("/:id", (req: Request, res: Response) => {
  res.json({ message: `Get itinerary ${req.params.id}`, data: null });
});

router.post("/", (req: Request, res: Response) => {
  res.status(201).json({ message: "Create itinerary", data: req.body });
});

router.put("/:id", (req: Request, res: Response) => {
  res.json({ message: `Update itinerary ${req.params.id}`, data: req.body });
});

router.delete("/:id", (req: Request, res: Response) => {
  res.json({ message: `Delete itinerary ${req.params.id}` });
});

router.get("/:id/days", (req: Request, res: Response) => {
  res.json({ message: `Get days for itinerary ${req.params.id}`, data: [] });
});

router.post("/:id/days", (req: Request, res: Response) => {
  res.status(201).json({ message: `Add day to itinerary ${req.params.id}`, data: req.body });
});

router.get("/:id/flights", (req: Request, res: Response) => {
  res.json({ message: `Get flights for itinerary ${req.params.id}`, data: [] });
});

router.get("/:id/hotels", (req: Request, res: Response) => {
  res.json({ message: `Get hotels for itinerary ${req.params.id}`, data: [] });
});

export default router;
