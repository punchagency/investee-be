import "dotenv/config";
import { AppDataSource } from "../src/db";

async function forceSync() {
  try {
    console.log("Initializing DataSource and syncing schema...");
    await AppDataSource.initialize();
    console.log("Schema sync completed.");
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Error during schema sync:", error);
    process.exit(1);
  }
}

forceSync();
