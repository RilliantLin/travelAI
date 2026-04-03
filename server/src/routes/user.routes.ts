import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "User API",
    endpoints: {
      "GET /": "API info",
      "GET /:id": "Get user by ID",
      "POST /": "Create user",
      "PUT /:id": "Update user",
      "DELETE /:id": "Delete user",
      "GET /:id/preferences": "Get user preferences",
      "PUT /:id/preferences": "Update user preferences",
    },
  });
});

router.get("/:id", (req: Request, res: Response) => {
  res.json({ message: `Get user ${req.params.id}`, data: null });
});

router.post("/", (req: Request, res: Response) => {
  res.status(201).json({ message: "Create user", data: req.body });
});

router.put("/:id", (req: Request, res: Response) => {
  res.json({ message: `Update user ${req.params.id}`, data: req.body });
});

router.delete("/:id", (req: Request, res: Response) => {
  res.json({ message: `Delete user ${req.params.id}` });
});

router.get("/:id/preferences", (req: Request, res: Response) => {
  res.json({ message: `Get preferences for user ${req.params.id}`, data: null });
});

router.put("/:id/preferences", (req: Request, res: Response) => {
  res.json({ message: `Update preferences for user ${req.params.id}`, data: req.body });
});

export default router;
