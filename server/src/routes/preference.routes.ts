import { Router } from "express";
import {
  getPreference,
  createOrUpdatePreference,
  deletePreference,
} from "../controllers/preference.controller";

const router = Router();

router.get("/:userId", getPreference);
router.put("/:userId", createOrUpdatePreference);
router.delete("/:userId", deletePreference);

export default router;
