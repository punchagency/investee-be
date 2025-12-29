import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("property_alerts")
export class PropertyAlert {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "text", default: "default_user" })
  userId!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ name: "is_active", type: "text", default: "true" })
  isActive!: string;

  @Column({ name: "min_price", type: "integer", nullable: true })
  minPrice!: number | null;

  @Column({ name: "max_price", type: "integer", nullable: true })
  maxPrice!: number | null;

  @Column({ name: "min_beds", type: "integer", nullable: true })
  minBeds!: number | null;

  @Column({ name: "max_beds", type: "integer", nullable: true })
  maxBeds!: number | null;

  @Column({ name: "min_baths", type: "real", nullable: true })
  minBaths!: number | null;

  @Column({ name: "max_baths", type: "real", nullable: true })
  maxBaths!: number | null;

  @Column({ name: "min_sq_ft", type: "integer", nullable: true })
  minSqFt!: number | null;

  @Column({ name: "max_sq_ft", type: "integer", nullable: true })
  maxSqFt!: number | null;

  @Column({ name: "property_types", type: "text", array: true, nullable: true })
  propertyTypes!: string[] | null;

  @Column({ type: "text", array: true, nullable: true })
  cities!: string[] | null;

  @Column({ type: "text", array: true, nullable: true })
  states!: string[] | null;

  @Column({ name: "postal_codes", type: "text", array: true, nullable: true })
  postalCodes!: string[] | null;

  @Column({ type: "text", nullable: true })
  keywords!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
