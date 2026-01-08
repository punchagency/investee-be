import "reflect-metadata";
import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { pdfToPng } from "pdf-to-png-converter";
import { AppDataSource, initializeDatabase } from "../src/db";

// --- Configuration ---
const PDF_DIR = path.join(process.cwd(), "scripts", "training-pdf");
const OUTPUT_DIR = path.join(process.cwd(), "scripts", "training-jsonl");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "ready_for_finetune.jsonl");

// Placeholder for the "Teacher" prompt.
// REPLACE THIS with the actual prompt provided by "cindees" or the user.
const TEACHER_PROMPT = `
You are an expert Data Distillation AI. Your specific role is to convert raw document images into high-quality "Question-Answer" fine-tuning datasets for a Real Estate & Lending AI Assistant.

Your Goal:
Extract every rule, requirement, limit, number, and instruction from the provided image and transform it into a standalone Q&A pair.

---

### INSTRUCTIONS FOR HANDLING DIFFERENT DOCUMENT TYPES:

1. **IF detecting a CHECKLIST (e.g., "Loan Submission Checklist"):**
   - Create questions about *what* is required.
   - Example Q: "What documents are needed for the preliminary approval?"
   - Example A: "For preliminary approval, you must submit: 1. The application form, 2. The credit report..."

2. **IF detecting a GUIDELINE/POLICY (e.g., "Appraisal Guidelines", "Insurance Req"):**
   - Create conditional questions based on the logic found.
   - Look for "If/Then" scenarios (e.g., "If the property is 5+ units...").
   - Example Q: "What is the appraisal requirement for commercial properties over $2M?"

3. **IF detecting DATA TABLES (Grids with limits, LTVs, Rates):**
   - **CRITICAL:** Do not summarize the whole table. Break it down cell-by-cell or row-by-row.
   - Explicitly mention row and column headers in the Question.
   - Example Q: "What is the maximum LTV for a Cash-Out Refinance on a Mixed-Use property?"

---

### OUTPUT FORMAT RULES:

1. **Format:** Return valid JSON wrapped in a root object with a single key "data".
2. **Tone:** The 'response' must be professional, factual, and direct.
3. **Completeness:** If a section has 5 bullet points, generate 5 separate Q&A pairs.
4. **Context:** Assume the user asking the question does not see the document.

### REQUIRED JSON SCHEMA:
{
  "data": [
    {
      "prompt": "The specific question a user would ask.",
      "response": "The detailed, accurate answer derived strictly from the image.",
      "subject": "A short 2-4 word category tag"
    }
  ]
}
`;

const SYSTEM_MESSAGE_CINDEES = `You are Cindee, the intelligent advisor for Investee, a commercial real estate marketplace.

## IDENTITY
Role: Real Estate Investment Advisor.
Tone: Authoritative, enthusiastic, concise.
Constraint: No legal/tax advice. Always recommend professionals.
Privacy: Only share property owner names found in public records via 'search_local_properties'.

## CAPABILITIES
- **Tools:** DSCR & Flip Calculators, Portfolio Import, AVM ("Investee Estimates").
- **Search:** ALWAYS search local Investee marketplace first using 'search_local_properties'. structured filters (city, beds) > keyword queries.

## FINANCIAL LOGIC
- **DSCR:** >1.25x is healthy. Loans 6.5-8.5%, 30yr fixed/adj.
- **Flip:** Target 70% of ARV (Purchase + Rehab). Profit 15-25%. Rates 9.5-12%.

## INTERACTION
- Be Data-Driven: Use user numbers or estimates.
- Drive Engagement: Suggest calculators/search.
- Format: Link addresses as [Address](propertyUrl).`;

async function main() {
  // 1. Initialize Database
  await initializeDatabase();

  // 2. Initialize OpenAI
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not set in environment variables.");
    process.exit(1);
  }
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // 3. Ensure directories exist
  if (!fs.existsSync(PDF_DIR)) {
    console.log(`Creating input directory: ${PDF_DIR}`);
    fs.mkdirSync(PDF_DIR, { recursive: true });
    console.log(
      "Please place your PDF files in 'training-pdf' and run the script again."
    );
    process.exit(0);
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 4. Process PDFs
  const files = fs
    .readdirSync(PDF_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));
  if (files.length === 0) {
    console.log("No PDF files found in training-pdf directory.");
    process.exit(0);
  }

  const allTrainingData: any[] = [];

  console.log(`Found ${files.length} PDF files. Starting processing...`);

  for (const file of files) {
    const filePath = path.join(PDF_DIR, file);
    console.log(`\nProcessing file: ${file}`);

    try {
      const pdfBuffer = fs.readFileSync(filePath);

      const pngPages = await pdfToPng(Uint8Array.from(pdfBuffer).buffer, {
        viewportScale: 2.0,
      });

      console.log(`- Converted to ${pngPages.length} images.`);

      for (let i = 0; i < pngPages.length; i++) {
        const page = pngPages[i];
        console.log(`  - Processing Page ${i + 1}/${pngPages.length}...`);

        // Send to OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: TEACHER_PROMPT,
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Extract training data from this page." },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${page?.content?.toString(
                      "base64"
                    )}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (content) {
          const pageData = JSON.parse(content);
          if (pageData.data && Array.isArray(pageData.data)) {
            // Transform to fine-tuning format
            const formattedData = pageData.data.map((item: any) => ({
              messages: [
                { role: "system", content: SYSTEM_MESSAGE_CINDEES.trim() },
                { role: "user", content: item.prompt },
                { role: "assistant", content: item.response },
              ],
            }));
            allTrainingData.push(...formattedData);
            console.log(`    > Extracted ${formattedData.length} examples.`);
          }
        }
      }
    } catch (err) {
      console.error(`Error processing file ${file}:`, err);
    }
  }

  // 5. Save Output
  console.log(`\nTotal training examples generated: ${allTrainingData.length}`);
  // JSONL format: each line is a valid JSON object
  const jsonlContent = allTrainingData
    .map((item) => JSON.stringify(item))
    .join("\n");
  fs.writeFileSync(OUTPUT_FILE, jsonlContent);

  console.log(`Saved output to: ${OUTPUT_FILE}`);

  // 6. Update AiModel Entity
  const { aiStorage } = await import("../src/storage/ai.storage");
  await aiStorage.upsertAiModel({
    model: "gpt-4o-mini-2024-07-18",
    systemMessage: SYSTEM_MESSAGE_CINDEES,
    lastTrainedAt: new Date(),
  });
  console.log("Updated AiModel entry.");

  console.log("Done.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
