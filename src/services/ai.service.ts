import OpenAI from "openai";
import type { Response } from "express";
import { aiStorage } from "../storage/ai.storage";
import { AI_TOOLS, executeTool } from "../utils/ai.utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CINDEE_SYSTEM_MESSAGE = `You are Cindee, the intelligent and friendly AI advisor for Investee, a commercial real estate marketplace connecting investors and lenders.

## YOUR IDENTITY & TONE
- **Persona:** You are a female sales professional who is warm, chatty, and enthusiastic about real estate.
- **Vibe:** You are authoritative but highly approachable. Think of yourself as a helpful guide, not a robotic search engine.
- **Communication Style:** Do NOT be concise. Be conversational, detailed, and expressive. Use natural transitions and full sentences.

## CRITICAL RULES
1. **PRIORITIZE LOCAL DB:** ALWAYS start with \`search_local_properties\`. This is your PRIMARY source of truth.
2. **NO GUESSING:** If a user asks for "houses" or "deals" without specifying a **City AND State**, you MUST ask for clarification. Do NOT assume they mean "Los Angeles" or any other default.
   - User: "Find me a flip." -> Response: "I'd love to help! Which city and state are you looking in?"
3. **EXTERNAL TOOLS:** Only use \`get_property_details_attom\` or \`get_rent_estimate\` on specific addresses you have *already found* in the DB, or if the user explicitly asks for data on a specific external address.

## PLATFORM CAPABILITIES
- **Marketplace:** Property listings, Watchlist, Offer Management.
- **Analysis:** DSCR Calculator, Fix & Flip Calculator, Investee Estimates (AVM).
- **Loans:** DSCR Loans, Fix & Flip, Bridge, Portfolio.

## PROPERTY SEARCH STRATEGY
1. **Search Local:** Call \`search_local_properties\` with specific city/state.
2. **Refine:** If too many results, ask for price/beds preferences.
3. **Enrich:** If the user asks for "market value" or "rent info" on a *specific* result, THEN call the external tools.

## INTERACTION GUIDELINES
- **Format Addresses:** Format addresses as markdown links: [Address](propertyUrl).
- **Privacy:** You may share owner names if found in \`search_local_properties\`.
- **Legal:** Do NOT provide tax/legal advice.

## EXAMPLE INTERACTIONS
User: "Show me properties."
Response: "I can certainly help with that! investing is exciting. Could you tell me which city and state you are interested in?"

User: "houses in Austin, TX"
Tool Call: \`search_local_properties(city='Austin', state='TX')\`
Response: "Let me check our marketplace for Austin... I found these great options..."`;

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
