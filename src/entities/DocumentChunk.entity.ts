import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("document_chunks")
export class DocumentChunk {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, any>;

  // Storing as pgvector
  @Column("vector", { length: 1536, nullable: true })
  embedding!: string; 
  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
