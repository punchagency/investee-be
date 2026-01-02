import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("property_listings")
export class PropertyListing {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "property_id", type: "varchar" })
  propertyId!: string;

  @Column({ name: "owner_user_id", type: "text", default: "default_user" })
  ownerUserId!: string;

  @Column({ type: "text", default: "active" })
  status!: string;

  @Column({ name: "list_price", type: "integer", nullable: true })
  listPrice!: number | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "text", nullable: true })
  terms!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
