import type { Request, Response } from "express";
import {
  generateCompletion,
  generateChatCompletion,
} from "../services/ai.service";

/**
 * Generate a simple AI completion from a prompt
 * POST /api/ai/completion
 * Body: { prompt: string }
 */
export const createCompletion = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res
        .status(400)
        .json({ error: "Prompt is required and must be a string" });
      return;
    }

    const response = await generateCompletion(prompt);
    res.json({ response });
  } catch (error) {
    console.error("AI completion error:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate completion",
    });
  }
};

/**
 * Generate a chat completion with conversation history
 * POST /api/ai/chat
 * Body: { messages: Array<{ role: "system" | "user" | "assistant", content: string }> }
 */
export const createChatCompletion = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Messages array is required" });
      return;
    }

    // Validate message structure
    const isValid = messages.every(
      (msg) =>
        msg &&
        typeof msg === "object" &&
        ["system", "user", "assistant"].includes(msg.role) &&
        typeof msg.content === "string"
    );

    if (!isValid) {
      res.status(400).json({
        error:
          'Each message must have a valid role ("system", "user", or "assistant") and content string',
      });
      return;
    }

    const response = await generateChatCompletion(messages);
    res.json({ response });
  } catch (error) {
    console.error("AI chat completion error:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate chat completion",
    });
  }
};
