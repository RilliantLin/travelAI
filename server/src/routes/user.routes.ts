import { Router } from "express";
import { createUser, getUser, updateUser, deleteUser } from "../controllers/user.controller";
import { getPreference, createOrUpdatePreference } from "../controllers/preference.controller";

const router = Router();

router.get("/", (req, res) => {
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

router.post("/", createUser);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get("/:id/preferences", getPreference);
router.put("/:id/preferences", createOrUpdatePreference);

export default router;
