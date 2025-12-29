import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User.entity";
import { Session } from "./entities/Session.entity";
import { Property } from "./entities/Property.entity";
import { LoanApplication } from "./entities/LoanApplication.entity";
import { PropertyListing } from "./entities/PropertyListing.entity";
import { PropertyWatchlist } from "./entities/PropertyWatchlist.entity";
import { PropertyOffer } from "./entities/PropertyOffer.entity";
import { PropertyAlert } from "./entities/PropertyAlert.entity";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false, // Never auto-sync in production
  logging: process.env.NODE_ENV === "development",
  entities: [
    User,
    Session,
    Property,
    LoanApplication,
    PropertyListing,
    PropertyWatchlist,
    PropertyOffer,
    PropertyAlert,
  ],
});

// Initialize the data source
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export { AppDataSource as db };
