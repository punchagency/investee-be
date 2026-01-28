import {
  Entity,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { PropertyFavorite } from "./PropertyFavorite.entity";
import { LoanApplication } from "./LoanApplication.entity";
import { Vendor } from "./Vendor.entity";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  VENDOR = "vendor",
  LENDER = "lender",
  OWNER = "owner",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true, nullable: true })
  email!: string | null;

  @Column({ name: "google_id", type: "varchar", unique: true, nullable: true })
  googleId!: string | null;

  @Column({ type: "varchar", nullable: true, select: false })
  password!: string | null;

  @Column({ name: "first_name", type: "varchar", nullable: true })
  firstName!: string | null;

  @Column({ name: "last_name", type: "varchar", nullable: true })
  lastName!: string | null;

  @Column({ name: "phone_number", type: "varchar", nullable: true })
  phoneNumber!: string | null;

  @Column({
    type: "enum",
    enum: UserRole,
    nullable: true,
  })
  role!: UserRole;

  @Column({ name: "profile_image_url", type: "varchar", nullable: true })
  profileImageUrl!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => PropertyFavorite, (favorite) => favorite.user)
  favorites!: PropertyFavorite[];

  @OneToMany(() => LoanApplication, (application) => application.user)
  loanApplications!: LoanApplication[];

  @OneToOne(() => Vendor, (vendor) => vendor.user)
  vendor?: Vendor;
}
