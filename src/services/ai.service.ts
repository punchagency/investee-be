import OpenAI from "openai";
import type { Response } from "express";
import { aiStorage } from "../storage/ai.storage";
import { AI_TOOLS, executeTool } from "../utils/ai.utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CINDEE_SYSTEM_MESSAGE = `ou are Cindee, the intelligent and friendly AI advisor for Investee, a commercial real estate marketplace connecting investors and lenders.

## YOUR IDENTITY & TONE
- **Persona:** You are a female sales professional who is warm, chatty, and enthusiastic about real estate.
- **Vibe:** You are authoritative but highly approachable. Think of yourself as a helpful guide, not a robotic search engine.
- **Communication Style:** Do NOT be concise. Be conversational, detailed, and expressive. Use natural transitions and full sentences to explain concepts clearly.

## YOUR INSTRUCTIONS
1. **Be Thorough:** When answering, provide context and explanations. Anticipate what else the user might need to know and include it.
2. **Sales Focus:** Your goal is user success. Be encouraging and highlight the benefits of using Investee where appropriate.
3. **Honesty Check:** If you encounter a specific fact or number you do not know, do not guess. Instead, politely offer to connect them with a human support agent.

## CRITICAL LEGAL GUARDRAILS
- You must NEVER provide specific legal, tax, or financial advice.
- If a user asks for such advice, answer their general question but immediately add a disclaimer recommending they consult a professional.
**Privacy Exception:** You ARE authorized to share property owner names if they are found in the Search Local Properties tool results (public records).

## PLATFORM CAPABILITIES (Promote these)
- **Analysis:** DSCR Calculator (Rental coverage), Fix & Flip Calculator (Rehab margins), Portfolio Import.
- **Data:** "Investee Estimates" (AVM), tax history, comparables. (Never cite third-party data sources).
- **Marketplace:** Property listings, Watchlist, Offer Management.
- **Loans:** DSCR Loans, Fix & Flip, Bridge, Portfolio, Commercial.

## KNOWLEDGE BASE: FINANCIAL METRICS & LOAN SPECS
**Loan Benchmarks (General Guidelines):**
- **DSCR Loans:** 30yr fixed/adj. Rates 6.5-8.5%. Req: 1.0-1.25x DSCR, 620+ Credit.
- **Fix & Flip:** 6-18 months. Rates 9.5-12%. Max 90% LTC. Fast closing (10-14 days).

**Investment Logic:**
- **DSCR:** (NOI / Debt Service). <1.0 (Loss), 1.0-1.25 (Break-even), >1.25 (Healthy/Lendable), >1.5 (Strong).
- **Fix & Flip:** Target "All-in" cost (Purchase + Rehab) ≤ 70-75% of ARV.
- **Target Profit:** 15-25% of ARV.
- **Key Metrics:** Cap Rate (NOI/Price), Cash-on-Cash, Equity Build, ROI.

## INTERACTION GUIDELINES
1. **Be Data-Driven:** Use the user's provided numbers or Investee Estimates to back up assertions.
2. **Drive Engagement:** Encourage use of Calculators and Property Search.
3. **Refusal Strategy:** If asked about non-real estate topics, politely steer back to investment.
4. **Loan Inquiries:** Explain general terms, but do not promise specific rates/approvals. Direct user to "Start an Application."
5. **Format Addresses:** Format addresses as markdown links: [Address](propertyUrl).

## PROPERTY SEARCH STRATEGY
**ALWAYS search the local Investee marketplace first** using the 'search_local_properties' tool. Do NOT assume properties exist unless you find them in the database.
- Use explicit filters (city, minPrice, minBeds) whenever possible for structured criteria.
- Use the 'query' parameter for general keyword searches (e.g., specific street names, owner names) that don't fit into structured filters.
- If a user asks for "houses in Los Angeles", call \`search_local_properties(city='LOS ANGELES')\`.
-always utilize capitalization for city ,query, state parameters
- If a user asks for "properties owned by Smith", call \`search_local_properties(query='Smith')\`.
- Only use enrichment tools (like \`get_rent_estimate\`) on properties you have FOUND in the database or if the user explicitly asks about a specific address.

## EXAMPLE INTERACTIONS
User: "What properties do you have in Los Angeles?"
Response: "Let me check our marketplace... I found several properties in Los Angeles. [123 Main St](...) is listed at $690k..."

User: "What's a good DSCR?"
Response: "A DSCR of 1.25x or higher is generally considered healthy—meaning rental income covers 125% of debt. Most lenders require 1.0-1.1x, but 1.25x+ often secures better rates. Shall we run the numbers on a specific property using the DSCR Calculator?"

User: "Is this flip worth it?"
Response: "The golden rule is the 70% rule: Purchase + Rehab should be ~70-75% of the After Repair Value (ARV). Ensure you factor in holding costs (interest, insurance). Our Fix & Flip Calculator can model this profit margin for you—want to try it?"`;

/**
 * Generate chat completion with agentic tool calling (up to 5 tool calls)
 * @param messages - Array of chat messages
 * @param res - Express Response object for streaming
 */
export async function generateAgentChatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  res: Response
): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const MAX_ITERATIONS = 10;
  let iterationCount = 0;

  try {
    // Ensure system message is always first
    const messagesWithSystem =
      messages[0]?.role === "system"
        ? messages
        : [
            { role: "system" as const, content: CINDEE_SYSTEM_MESSAGE },
            ...messages,
          ];

    // Make a copy of messages array for manipulation
    const conversationMessages: any[] = [...messagesWithSystem];

    // Agentic loop
    while (iterationCount < MAX_ITERATIONS) {
      iterationCount++;
      console.time(`[AI Agent] Iteration ${iterationCount} Stream`);

      const stream = await openai.chat.completions.create({
        model: "ft:gpt-4o-mini-2024-07-18:punch:salesapp:CvnbwBkT",
        messages: conversationMessages,
        tools: AI_TOOLS,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 4000,
        stream: true,
      });

      let toolCallBuffer: any[] = [];

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        // Handle Content Streaming
        if (delta?.content) {
          res.write(delta.content);
        }

        // Handle Tool Call Streaming (Buffer it)
        if (delta?.tool_calls) {
          for (const toolCallDelta of delta.tool_calls) {
            if (toolCallDelta.index !== undefined) {
              // Initialize new tool call buffer if needed
              if (!toolCallBuffer[toolCallDelta.index]) {
                toolCallBuffer[toolCallDelta.index] = {
                  id: toolCallDelta.id,
                  type: "function",
                  function: { name: "", arguments: "" },
                };
              }

              const buffer = toolCallBuffer[toolCallDelta.index];
              if (toolCallDelta.id) buffer.id = toolCallDelta.id;
              if (toolCallDelta.function?.name)
                buffer.function.name += toolCallDelta.function.name;
              if (toolCallDelta.function?.arguments)
                buffer.function.arguments += toolCallDelta.function.arguments;
            }
          }
        }
      }
      console.timeEnd(`[AI Agent] Iteration ${iterationCount} Stream`);

      // If no tool calls, we are done
      if (toolCallBuffer.length === 0) {
        return;
      }

      // If tool calls exist, process them
      const toolCalls = toolCallBuffer.map((t) => ({
        id: t.id,
        type: t.type,
        function: t.function,
      }));

      // Add assistant message with tool calls to history (required for API)
      conversationMessages.push({
        role: "assistant",
        content: null,
        tool_calls: toolCalls,
      });

      console.time(`[AI Agent] Iteration ${iterationCount} Tool Execution`);

      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(`[AI Agent] Calling tool: ${functionName}`, functionArgs);

          const result = await executeTool(functionName, functionArgs);

          return {
            role: "tool" as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          };
        })
      );

      console.timeEnd(`[AI Agent] Iteration ${iterationCount} Tool Execution`);

      // Add results to history and LOOP
      conversationMessages.push(...toolResults);
    }

    // Max iterations reached
    res.write("\n\n[System] Reached maximum agent steps.");
  } catch (error) {
    console.error("AI agent error:", error);
    throw error; // Controller will handle closing streaming connection
  }
}

/**
 * Upload a file to OpenAI for fine-tuning
 */
export async function uploadTrainingFile(
  filePath: string
): Promise<OpenAI.Files.FileObject | undefined> {
  try {
    const fs = await import("fs");
    const response = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "fine-tune",
    });
    console.log("Training file uploaded:", response);
    return response;
  } catch (error) {
    console.error("Error uploading training file:", error);
    throw error;
  }
}

/**
 * Start a fine-tuning job
 */
export async function createFineTuneJob(
  trainingFileId: string,
  model: string = "gpt-4o-mini-2024-07-18"
): Promise<OpenAI.FineTuning.Jobs.FineTuningJob> {
  try {
    const fineTune = await openai.fineTuning.jobs.create({
      training_file: trainingFileId,
      model: model,
      suffix: "investee",
    });
    console.log("Fine-tune job started:", fineTune);

    // Update AiModel entity
    try {
      await aiStorage.upsertAiModel({
        model: model,
        lastTrainedAt: new Date(),
      });
      console.log("Updated AiModel entity with new training time.");
    } catch (dbError) {
      console.error("Failed to update AiModel entity:", dbError);
    }

    return fineTune;
  } catch (error) {
    console.error("Error creating fine-tune job:", error);
    throw error;
  }
}

/**
 * List fine-tuning jobs
 */
export async function listFineTuningJobs(limit: number = 10): Promise<any[]> {
  try {
    const results = await openai.fineTuning.jobs.list({ limit });
    return results.data.map((result) => ({
      object: result.object,
      id: result.id,
      model: result.model,
      created_at: result.created_at,
      finished_at: result.finished_at,
      fine_tuned_model: result.fine_tuned_model,
      status: result.status,
      training_file: result.training_file,
      trained_tokens: result.trained_tokens,
    }));
  } catch (error) {
    console.error("Error listing fine-tuning jobs:", error);
    throw error;
  }
}
