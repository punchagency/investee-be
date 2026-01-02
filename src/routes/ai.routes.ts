import express from "express";
import { createChatCompletion } from "../controllers/ai.controller";

const router = express.Router();

// POST /api/ai/chat - Chat completion with history
router.post("/ai/chat", createChatCompletion);

export default router;
