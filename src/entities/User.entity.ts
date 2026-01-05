import {
  Entity,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from "typeorm";
import { PropertyFavorite } from "./PropertyFavorite.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", nullable: true, select: false })
  password!: string | null;

  @Column({ name: "first_name", type: "varchar", nullable: true })
  firstName!: string | null;

  @Column({ name: "last_name", type: "varchar", nullable: true })
  lastName!: string | null;

  @Column({ type: "varchar", default: "user" })
  role!: string; // 'user' | 'admin' | 'service_role'

  @Column({ name: "profile_image_url", type: "varchar", nullable: true })
  profileImageUrl!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => PropertyFavorite, (favorite) => favorite.user)
  favorites!: PropertyFavorite[];
}
