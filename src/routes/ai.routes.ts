import express from "express";
import {
  createChatCompletion,
  getFineTuningJobs,
} from "../controllers/ai.controller";

const router = express.Router();

// POST /api/ai/chat - Chat completion with history
router.post("/ai/chat", createChatCompletion);

// GET /api/ai/fine-tuning-jobs - List fine-tuning jobs
router.get("/ai/fine-tuning-jobs", getFineTuningJobs);

export default router;
