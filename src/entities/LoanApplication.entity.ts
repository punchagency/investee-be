import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.entity";

@Entity("loan_applications")
export class LoanApplication {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, (user) => user.loanApplications)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "loan_type", type: "text" })
  loanType!: string;

  @Column({ name: "property_type", type: "text" })
  propertyType!: string;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column({ name: "purchase_price", type: "integer" })
  purchasePrice!: number;

  @Column({ name: "estimated_value", type: "integer" })
  estimatedValue!: number;

  @Column({ name: "down_payment", type: "integer" })
  downPayment!: number;

  @Column({ name: "loan_amount", type: "integer" })
  loanAmount!: number;

  @Column({ name: "credit_score", type: "text" })
  creditScore!: string;

  @Column({ type: "text", default: "submitted" })
  status!: string;

  @Column({ name: "first_name", type: "text" })
  firstName!: string;

  @Column({ name: "last_name", type: "text" })
  lastName!: string;

  @Column({ type: "text" })
  email!: string;

  @Column({ type: "text", nullable: true })
  phone!: string | null;

  @Column({ name: "preferred_contact", type: "text", nullable: true })
  preferredContact!: string | null;

  @Column({ name: "preferred_call_time", type: "text", nullable: true })
  preferredCallTime!: string | null;

  @Column({ name: "agree_marketing", type: "text", nullable: true })
  agreeMarketing!: string | null;

  @Column({ type: "jsonb", default: [] })
  documents!: any;

  @CreateDateColumn({ name: "submitted_at" })
  submittedAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
