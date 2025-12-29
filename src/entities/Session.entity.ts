import { Entity, PrimaryColumn, Column, Index } from "typeorm";

@Entity("sessions")
@Index("IDX_session_expire", ["expire"])
export class Session {
  @PrimaryColumn("varchar")
  sid!: string;

  @Column({ type: "jsonb" })
  sess!: any;

  @Column({ type: "timestamp" })
  expire!: Date;
}
