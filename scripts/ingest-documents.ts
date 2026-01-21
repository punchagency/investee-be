import "reflect-metadata";
import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { pdfToPng } from "pdf-to-png-converter";
import { initializeDatabase } from "../src/db";
import { ragService } from "../src/services/rag.service";

// --- Configuration ---
const PDF_DIR = path.join(process.cwd(), "scripts", "training-pdf");
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const BATCH_SIZE = 3; // Only hold 3 pages in memory at a time

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Splits text into chunks with overlap
 */
function splitText(text: string, chunkSize: number, overlap: number): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex > text.length) endIndex = text.length;

    // Intelligent breaking logic
    if (endIndex < text.length) {
      const lastNewline = text.lastIndexOf("\n", endIndex);
      const lastPeriod = text.lastIndexOf(".", endIndex);

      if (lastNewline > startIndex + chunkSize * 0.5) {
        endIndex = lastNewline + 1;
      } else if (lastPeriod > startIndex + chunkSize * 0.5) {
        endIndex = lastPeriod + 1;
      }
    }

    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk.length > 0) chunks.push(chunk);

    // --- FIX START ---
    // If we have reached the end of the text, STOP.
    if (endIndex >= text.length) {
      break;
    }
    // --- FIX END ---

    startIndex = endIndex - overlap;

    // Safety check: ensure we always move forward at least 1 character
    // (Prevents infinite loops if overlap >= chunk size due to logic adjustments)
    if (startIndex <= endIndex - chunkSize) {
      startIndex = endIndex;
    }
  }
  return chunks;
}

async function processPdfInBatches(filePath: string, filename: string) {
  const pdfBuffer = fs.readFileSync(filePath);

  let pageIndex = 1; // 1-based index for this library usually
  let hasMorePages = true;

  while (hasMorePages) {
    const pagesToConvert = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      pagesToConvert.push(pageIndex + i);
    }

    console.log(`\n   > Batch processing pages: ${pagesToConvert.join(", ")}`);

    try {
      // Convert ONLY the specific batch of pages
      const pngPages = await pdfToPng(Uint8Array.from(pdfBuffer).buffer, {
        viewportScale: 1.5,
        pagesToProcess: pagesToConvert, // CRITICAL: This prevents loading all 50 pages!
      });

      if (pngPages.length === 0) {
        hasMorePages = false;
        break;
      }

      for (let i = 0; i < pngPages.length; i++) {
        const page = pngPages[i];
        const actualPageNum = pageIndex + i;

        console.log(`     >> Transcribing Page ${actualPageNum}...`);

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a specialized OCR assistant. Transcribe the following real estate document image into clean Markdown text. Preserve headers, lists, and tables structure. Do NOT summarize. Output only the content.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Transcribe this page." },
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
        });

        const extractedText = completion.choices[0].message.content || "";

        // Aggressive Memory Cleanup
        (page as any).content = null;

        if (extractedText.length < 50) {
          console.log("     >> Skipped (text too short).");
        } else {
          const chunks = splitText(extractedText, CHUNK_SIZE, CHUNK_OVERLAP);
          for (const chunkContent of chunks) {
            await ragService.storeChunk(chunkContent, {
              source: filename,
              page: actualPageNum,
            });
          }
          console.log(`     >> Saved ${chunks.length} chunks.`);
        }
      }

      // Check if we reached the end
      if (pngPages.length < BATCH_SIZE) {
        hasMorePages = false;
      } else {
        pageIndex += BATCH_SIZE;
        // Optional: Small GC pause
        if (global.gc) global.gc();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (err) {
      const errMsg = (err as Error).message || "";
      if (errMsg.includes("range") || errMsg.includes("page")) {
        console.log("   > Reached end of PDF.");
        hasMorePages = false;
      } else {
        console.error(`   > Error on batch ${pageIndex}:`, err);
        hasMorePages = false; // Stop on critical error to be safe
      }
    }
  }
}

async function main() {
  console.log("Initializing database...");
  await initializeDatabase();

  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
    console.log("Created directory. Please add PDFs and restart.");
    process.exit(0);
  }

  const files = fs
    .readdirSync(PDF_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));
  console.log(`Found ${files.length} PDF files. Starting ingestion...`);

  for (const file of files) {
    const filePath = path.join(PDF_DIR, file);
    console.log(`\nProcessing file: ${file}`);
    await processPdfInBatches(filePath, file);
    console.log(` - Completed file: ${file}`);
  }

  console.log("\nIngestion complete.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
