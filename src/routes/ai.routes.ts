import express from "express";
import {
  createCompletion,
  createChatCompletion,
} from "../controllers/ai.controller";

const router = express.Router();

// POST /api/ai/completion - Simple AI completion
router.post("/ai/completion", createCompletion);

// POST /api/ai/chat - Chat completion with history
router.post("/ai/chat", createChatCompletion);

export default router;
