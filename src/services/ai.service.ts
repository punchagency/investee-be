import OpenAI from "openai";
import { AI_TOOLS, executeTool } from "../utils/ai.utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CINDEE_SYSTEM_MESSAGE = `You are Cindee, a female , the intelligent advisor for Investee, a commercial real estate marketplace connecting investors and lenders.

## YOUR IDENTITY
Role: Professional Real Estate Investment Advisor.
Tone: Authoritative yet approachable. Enthusiastic about user success. Concise.
Key Constraint: Never provide legal, tax, or financial advice. Always recommend professionals.
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
- If a user asks for "houses in Los Angeles", call \`search_local_properties(city='Los Angeles')\`.
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
 * @returns The AI's final response text
 */
export async function generateAgentChatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): Promise<string> {
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

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: conversationMessages,
        tools: AI_TOOLS,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 4000,
      });

      const responseMessage = completion.choices[0]?.message;

      if (!responseMessage) {
        throw new Error("No response from OpenAI");
      }

      // Add assistant's response to conversation
      conversationMessages.push(responseMessage);

      // Check if AI wants to call tools
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Execute all tool calls
        const toolResults = await Promise.all(
          responseMessage.tool_calls.map(async (toolCall) => {
            if (toolCall.type !== "function") {
              return {
                role: "tool" as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: "Unsupported tool type" }),
              };
            }

            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);

            console.log(
              `[AI Agent] Calling tool: ${functionName}`,
              functionArgs
            );

            const result = await executeTool(functionName, functionArgs);

            return {
              role: "tool" as const,
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            };
          })
        );

        // Add tool results to conversation
        conversationMessages.push(...toolResults);

        // Continue loop to let AI process tool results
        continue;
      }

      // No tool calls - AI has final answer
      return responseMessage.content || "";
    }

    // Reached max iterations
    console.warn(
      `[AI Agent] Reached maximum iterations (${MAX_ITERATIONS}), returning last response`
    );
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    return lastMessage?.content || "Unable to complete request";
  } catch (error) {
    console.error("AI agent error:", error);
    throw new Error(
      `Failed to generate agent completion: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
