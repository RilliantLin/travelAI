import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Flight API",
    endpoints: {
      "GET /": "API info",
      "GET /search": "Search flights",
    },
  });
});

router.get("/search", (req: Request, res: Response) => {
  const { origin, destination, date, returnDate, passengers } = req.query;
  res.json({
    message: "Search flights",
    params: { origin, destination, date, returnDate, passengers },
    data: [],
  });
});

export default router;
