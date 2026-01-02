import type { Request, Response } from "express";
import { generateAgentChatCompletion } from "../services/ai.service";

/**
 * Generate a chat completion with agentic tool calling
 * POST /api/ai/chat
 * Body: { messages: Array<{ role: "system" | "user" | "assistant", content: string }> }
 *
 * The AI can make up to 5 automated tool calls to fetch property data from ATTOM and RentCast APIs
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

    const response = await generateAgentChatCompletion(messages);
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
