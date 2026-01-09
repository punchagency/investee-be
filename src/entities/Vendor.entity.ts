import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { User } from "./User.entity";

@Entity("vendors")
export class Vendor {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  category!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  phone?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  website?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  city?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  state?: string;

  @Column({ type: "decimal", precision: 3, scale: 2, nullable: true })
  rating?: number;

  @Column({ name: "review_count", type: "int", default: 0 })
  reviewCount?: number;

  @Column({ type: "boolean", default: false })
  verified?: boolean;

  @Column({ type: "boolean", default: false })
  licensed?: boolean;

  @Column({ type: "boolean", default: false })
  insured?: boolean;

  @Column({ name: "years_in_business", type: "int", nullable: true })
  yearsInBusiness?: number;

  @Column({ type: "simple-array", nullable: true })
  specialties?: string[];

  @Column({ name: "service_areas", type: "simple-array", nullable: true })
  serviceAreas?: string[];

  @Column({ name: "price_range", type: "varchar", length: 10, nullable: true })
  priceRange?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  availability?: string;

  @Column({
    name: "contact_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  contactName?: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId?: string;

  @OneToOne(() => User, (user) => user.vendor)
  @JoinColumn({ name: "user_id" })
  user?: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
