import "reflect-metadata";
import "dotenv/config";
import { IsNull } from "typeorm";
import { initializeDatabase, AppDataSource } from "../src/db";
import { DocumentChunk } from "../src/entities/DocumentChunk.entity";
import { ragService } from "../src/services/rag.service";

// Configuration
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES_MS = 500; // 500ms delay to be nice to rate limits

async function main() {
  console.log("Initializing database connection...");
  await initializeDatabase();

  const chunkRepo = AppDataSource.getRepository(DocumentChunk);

  // Count total chunks needing embedding
  const totalChunks = await chunkRepo.count({
    where: {
      embedding: IsNull(),
    },
  });

  console.log(`Found ${totalChunks} chunks needing embeddings.`);

  if (totalChunks === 0) {
    console.log("No chunks to process. Exiting.");
    process.exit(0);
  }

  let processedCount = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch a batch of chunks with null embeddings
    const chunks = await chunkRepo.find({
      where: {
        embedding: IsNull(),
      },
      take: BATCH_SIZE,
    });

    if (chunks.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Processing batch of ${chunks.length} chunks...`);

    for (const chunk of chunks) {
      try {
        if (!chunk.content) {
          console.warn(`  [WARN] Chunk ${chunk.id} has no content. Skipping.`);
          continue;
        }

        // Generate embedding
        const embedding = await ragService.generateEmbedding(chunk.content);

        // Update chunk
        // Note: we cast to any because of TypeORM vector/string handling quirks
        chunk.embedding = JSON.stringify(embedding) as any;
        await chunkRepo.save(chunk);

        processedCount++;
        process.stdout.write("."); // Progress indicator
      } catch (error) {
        console.error(
          `\n  [ERROR] Failed to process chunk ${chunk.id}:`,
          error
        );
        // Continue to next chunk
      }
    }

    // Logging progress
    console.log(`\n  >> Progress: ${processedCount}/${totalChunks}`);

    // Rate limiting delay
    if (chunks.length === BATCH_SIZE) {
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS)
      );
    }
  }

  console.log("\nRe-embedding complete!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error during re-embedding:", error);
  process.exit(1);
});
