import type { Request, Response } from "express";
import { generateAgentChatCompletion } from "../services/ai.service";

/**
 * Generate a chat completion with agentic tool calling
 * POST /api/ai/chat
 * Body: { messages: Array<{ role: "system" | "user" | "assistant", content: string }> }
 *
 * The AI can make up to 5 automated tool calls to fetch property data from RentCast API
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

    // Set headers for streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.flushHeaders(); // Helper to send headers immediately

    await generateAgentChatCompletion(messages, res);
    res.end();
  } catch (error) {
    console.error("AI chat completion error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate chat completion",
      });
    } else {
      res.end();
    }
  }
};

/**
 * List fine-tuning jobs
 * GET /api/ai/fine-tuning-jobs
 */
export const getFineTuningJobs = async (req: Request, res: Response) => {
  try {
    const { listFineTuningJobs } = await import("../services/ai.service");
    const jobs = await listFineTuningJobs();
    res.json(jobs);
  } catch (error) {
    console.error("Error listing fine-tuning jobs:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to list fine-tuning jobs",
    });
  }
};
