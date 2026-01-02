import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createFavoritesTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS property_favorites (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id VARCHAR NOT NULL,
        session_id VARCHAR NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✅ property_favorites table created successfully!");
  } catch (error) {
    console.error("Error creating table:", error);
    process.exit(1);
  }
  process.exit(0);
}

createFavoritesTable();
