import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("property_offers")
export class PropertyOffer {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "listing_id", type: "varchar" })
  listingId!: string;

  @Column({ name: "buyer_user_id", type: "text", default: "default_user" })
  buyerUserId!: string;

  @Column({ name: "offer_amount", type: "integer" })
  offerAmount!: number;

  @Column({ type: "text", default: "submitted" })
  status!: string;

  @Column({ type: "text", nullable: true })
  message!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

// Type exports for compatibility
export type InsertOffer = Partial<
  Omit<PropertyOffer, "id" | "createdAt" | "updatedAt">
>;
