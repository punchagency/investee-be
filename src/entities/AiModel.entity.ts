import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("ai_models")
export class AiModel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "system_message", type: "text", nullable: true })
  systemMessage!: string | null;

  @Column({
    name: "model",
    default: "gpt-4o-mini-2024-07-18",
    type: "varchar",
    length: 45,
  })
  model!: string;

  @Column({ name: "last_trained_at", type: "timestamp", nullable: true })
  lastTrainedAt!: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
