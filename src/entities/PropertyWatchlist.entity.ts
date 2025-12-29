import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("property_watchlist")
export class PropertyWatchlist {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "text", default: "default_user" })
  userId!: string;

  @Column({ name: "listing_id", type: "varchar" })
  listingId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

// Type exports for compatibility
export type InsertWatchlist = Partial<
  Omit<PropertyWatchlist, "id" | "createdAt">
>;
export type PropertyWatchlistItem = PropertyWatchlist;
