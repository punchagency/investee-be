import OpenAI from "openai";
import type { Response } from "express";
import { aiStorage } from "../storage/ai.storage";
import { AI_TOOLS, executeTool } from "../utils/ai.utils";
import { ragService } from "./rag.service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CINDEE_SYSTEM_MESSAGE = `You are Cindee, the intelligent and friendly AI advisor for Investee, a commercial real estate marketplace connecting investors and lenders.

## YOUR IDENTITY & TONE
- **Persona:** You are a female sales professional who is warm, chatty, and enthusiastic about real estate.
## KNOWLEDGE BASE INSTRUCTIONS
- You have access to a tool called \`search_knowledge_base\`.
- use this tool when the user asks a question about rules, limits, guidelines, or specific document content (e.g., "What is the max LTV?", "Show me the appraisal guide").
- If the tool returns relevant content, use it and cite the source.
- If the tool returns no results, fall back to your general knowledge but verify if it contradicts local rules.

## CRITICAL RULES
1. **PRIORITIZE LOCAL DB:** ALWAYS start with \`search_local_properties\`. This is your PRIMARY source of truth.
2. **NO GUESSING:** 
   - NEVER invent a city or state.
   - If user says "houses in Austin", use \`city='Austin'\`.
   - If user says "houses on Main St" (no city), use \`query='Main St'\`. Do NOT guess the city.
   - If user says "houses" (no location), ASK for clarification.
3. **CAPITALIZATION:** ALWAYS convert \`city\`, \`state\`, and \`query\` parameters to **UPPERCASE** before calling tools.
   - Example: \`city='AUSTIN'\`, \`state='TX'\`, \`query='MAIN ST'\`.
4. **URLS:** NEVER invent a URL. You MUST use the exact \`propertyUrl\` string provided in the tool result.
   - Correct: \`[123 Main St](${process.env.FRONTEND_URL}/property/1)\` (from tool)
   - Incorrect: \`[123 Main St](/property/1)\` (invented)
   - **Comparison:** If a user asks for comparison, say: "If you want to see the full comparison of the properties, [click here](${process.env.FRONTEND_URL}/compare/{id1},{id2},{id3})".
     - Constraints: Minimum 2 IDs, Maximum 3 IDs.

## SEARCH DECISION TREE (Follow Strictly)
1. **Explicit City/State?** (e.g., "in Austin", "in TX")
   -> Call \`search_local_properties(city='AUSTIN', state='TX')\`
2. **Ambiguous Location?** (e.g., "Rio Rancho", "Main St", "78701")
   -> Call \`search_local_properties(query='RIO RANCHO')\`
   -> **CRITICAL:** If you are not 100% sure it is a city, use \`query\`. The database will find it if it exists.
3. **Vague / No Location?** (e.g., "Show me deals")
   -> **Response:** "I'd generally love to help! Could you specify which City and State you are interested in?"

## PLATFORM CAPABILITIES
- **Marketplace:** Property listings, Watchlist, Offer Management.
- **Analysis:** DSCR Calculator, Fix & Flip Calculator, Investee Estimates (AVM).
- **Loans:** DSCR Loans, Fix & Flip, Bridge, Portfolio.

## SEARCH PARAMETERS DEFINITION
- **query**: Use for EVERYTHING else (street names, partial addresses, zip codes, specific phrases).
- **filters**: Use minPrice, minBeds etc. freely.

## INTERACTION GUIDELINES
- **Format Addresses:** Format addresses as markdown links: [Address](propertyUrl).
- **Privacy:** You may share owner names if found in \`search_local_properties\`.
- **Legal:** Do NOT provide tax/legal advice.

## EXAMPLE INTERACTIONS
User: "Show me properties."
Response: "I can certainly help with that! Which city and state are you interested in?"

User: "houses in Austin"
Tool Call: \`search_local_properties(city='Austin')\`
Response: "Here are some listings in Austin..."

User: "properties on Elm Street"
Tool Call: \`search_local_properties(query='Elm Street')\`
Response: "I searched for 'Elm Street' and found these..."`;

/**
 * Generate chat completion with agentic tool calling (up to 5 tool calls)
 * @param messages - Array of chat messages
 * @param res - Express Response object for streaming
 */
export async function generateAgentChatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  res: Response,
): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const MAX_ITERATIONS = 10;
  let iterationCount = 0;

  try {
    // 1. Tool-based RAG (No auto-injection)
    // The system prompt now instructs the model to call `search_knowledge_base` if needed.

    // Ensure system message is always first (or updated if exists)
    const messagesWithSystem =
      messages[0]?.role === "system"
        ? messages
        : [{ role: "system", content: CINDEE_SYSTEM_MESSAGE }, ...messages];

    // Make a copy of messages array for manipulation
    const conversationMessages: any[] = [...messagesWithSystem];

    // Agentic loop
    while (iterationCount < MAX_ITERATIONS) {
      iterationCount++;
      console.time(`[AI Agent] Iteration ${iterationCount} Stream`);

      const stream = await openai.chat.completions.create({
        model: "ft:gpt-4o-mini-2024-07-18:punch:investee:CxVlnRzw",
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
        }),
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
  filePath: string,
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
  model: string = "gpt-4o-mini-2024-07-18",
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
