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
import { PropertyFavorite } from "./entities";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV !== "production",
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
  ],
});

// Initialize the data source
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection initialized successfully");

    // Ensure Full Text Search Index exists
    await AppDataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_property_fts ON properties
      USING GIN (to_tsvector('english', coalesce(address, '') || ' ' || coalesce(city, '') || ' ' || coalesce(owner, '')));
    `);

    // Add indexes for specific filters (City = FTS for flexible search, State = Composite for speed/sorting)
    await AppDataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_property_state_created_at ON properties (state, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_property_city_fts ON properties USING GIN (to_tsvector('english', coalesce(city, '')));
    `);
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export { AppDataSource as db };
