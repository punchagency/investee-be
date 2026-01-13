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
  embedding!: string; // TypeORM maps vector to string in JS usually, or array. specific driver usage.
  // Actually pgvector-node typically maps to string or array.
  // Let's use string for TypeORM raw handling or specific pgvector transformer if available.
  // Ideally: @Column("vector", { length: 1536 })
  // But typeorm-pgvector support might need a transformer.
  // For raw usage, string is safest (e.g. '[1,2,3]')
  // Let's stick to simple "vector" column definition.

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
