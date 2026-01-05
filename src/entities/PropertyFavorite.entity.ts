import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.entity";
import { Property } from "./Property.entity";

@Entity("property_favorites")
export class PropertyFavorite {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "property_id", type: "uuid" }) // Changed to uuid assuming Properties use UUID
  propertyId!: string;

  @ManyToOne(() => Property, (property) => property.favorites)
  @JoinColumn({ name: "property_id" })
  property!: Property;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, (user) => user.favorites)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
