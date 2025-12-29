import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Make a simple request to OpenAI using GPT-4o-mini
 * @param prompt - The user prompt to send to the AI
 * @returns The AI's response text
 */
export async function generateCompletion(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(
      `Failed to generate completion: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Make a chat request with conversation history
 * @param messages - Array of chat messages
 * @returns The AI's response text
 */
export async function generateChatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(
      `Failed to generate chat completion: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
