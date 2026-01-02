import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("property_favorites")
export class PropertyFavorite {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "property_id", type: "varchar" })
  propertyId!: string;

  @Column({ name: "session_id", type: "varchar" })
  sessionId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
