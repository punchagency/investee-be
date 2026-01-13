import "reflect-metadata";
import "dotenv/config";
import path from "path";
import {
  uploadTrainingFile,
  createFineTuneJob,
  listFineTuningJobs,
} from "../src/services/ai.service";
import { initializeDatabase } from "../src/db";

const TRAINING_FILE_PATH = path.join(
  process.cwd(),
  "scripts",
  "training-jsonl",
  "ai.cindee.jsonl"
);

async function main() {
  await initializeDatabase();

  console.log("1. Uploading training file...");
  const file = await uploadTrainingFile(TRAINING_FILE_PATH);

  if (file && file.id) {
    console.log(`   File uploaded successfully. ID: ${file.id}`);

    console.log("2. Starting fine-tuning job...");
    // Default model is gpt-4o-mini-2024-07-18 as per AiModel entity default
    const job = await createFineTuneJob(file.id);

    console.log(`   Job started successfully. ID: ${job.id}`);
    console.log(`   Status: ${job.status}`);

    console.log("3. Recent Jobs:");
    const jobs = await listFineTuningJobs(5);
    console.table(
      jobs.map((j) => ({
        id: j.id,
        status: j.status,
        model: j.model,
        created: new Date(j.created_at * 1000).toISOString(),
      }))
    );
  } else {
    console.error("Failed to upload file.");
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
