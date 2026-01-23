import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User.entity";
import { Property } from "./entities/Property.entity";
import { LoanApplication } from "./entities/LoanApplication.entity";
import { PropertyListing } from "./entities/PropertyListing.entity";
import { PropertyWatchlist } from "./entities/PropertyWatchlist.entity";
import { PropertyOffer } from "./entities/PropertyOffer.entity";
import { PropertyAlert } from "./entities/PropertyAlert.entity";
import { Vendor } from "./entities/Vendor.entity";
import { AiModel } from "./entities/AiModel.entity";
import { PropertyFavorite } from "./entities";
import { DocumentChunk } from "./entities";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false, // We will sync manually after enabling extensions
  logging: process.env.NODE_ENV === "development",
  entities: [
    User,
    Property,
    LoanApplication,
    PropertyListing,
    PropertyFavorite,
    PropertyWatchlist,
    PropertyOffer,
    PropertyAlert,
    Vendor,
    AiModel,
    DocumentChunk,
  ],
});

// Initialize the data source
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection initialized successfully");

    // Enable database extensions
    await AppDataSource.query("CREATE EXTENSION IF NOT EXISTS vector");
    await AppDataSource.query("CREATE EXTENSION IF NOT EXISTS postgis");

    // Now sync schema
    if (process.env.NODE_ENV !== "production") {
      await AppDataSource.synchronize();
      console.log("Database schema synchronized");
    }

    // Ensure Full Text Search Index exists
    await AppDataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_property_fts ON properties
      USING GIN (to_tsvector('english', coalesce(address, '') || ' ' || coalesce(city, '') || ' ' || coalesce(owner, '')));
    `);

    await AppDataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_vendor_fts ON vendors
      USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));
    `);

    // Add indexes for specific filters (City = FTS for flexible search, State = Composite for speed/sorting)
    await AppDataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_property_state_created_at ON properties (state, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_property_city_fts ON properties USING GIN (to_tsvector('english', coalesce(city, '')));
    `);

    // Add HNSW Index for fast vector search
    await AppDataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_document_embedding 
      ON document_chunks 
      USING hnsw (embedding vector_l2_ops)
      WITH (m = 16, ef_construction = 64);
    `);
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export { AppDataSource as db };
