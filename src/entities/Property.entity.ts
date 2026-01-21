import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { PropertyFavorite } from "./PropertyFavorite.entity";

@Entity("properties")
export class Property {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "property_type", type: "text", nullable: true })
  propertyType!: string | null;

  @Column({ type: "text" })
  address!: string;

  @Column({ type: "text", nullable: true })
  city!: string | null;

  @Column({ type: "text", nullable: true })
  state!: string | null;

  @Column({ type: "double precision", nullable: true })
  latitude!: number | null;

  @Column({ type: "double precision", nullable: true })
  longitude!: number | null;

  @Column({
    type: "geography",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true,
  })
  location!: any;

  @Column({ name: "postal_code", type: "text", nullable: true })
  postalCode!: string | null;

  @Column({ name: "sq_ft", type: "integer", nullable: true })
  sqFt!: number | null;

  @Column({ type: "integer", nullable: true })
  beds!: number | null;

  @Column({ type: "real", nullable: true })
  baths!: number | null;

  @Column({ name: "est_value", type: "integer", nullable: true })
  estValue!: number | null;

  @Column({ name: "est_equity", type: "integer", nullable: true })
  estEquity!: number | null;

  @Column({ type: "text", nullable: true })
  owner!: string | null;

  @Column({ name: "owner_occupied", type: "boolean", nullable: true })
  ownerOccupied!: boolean | null;

  @Column({ name: "listed_for_sale", type: "boolean", nullable: true })
  listedForSale!: boolean | null;

  @Column({ type: "boolean", nullable: true })
  foreclosure!: boolean | null;

  @Column({ name: "annual_taxes", type: "integer", nullable: true })
  annualTaxes!: number | null;

  @Column({ name: "annual_insurance", type: "integer", nullable: true })
  annualInsurance!: number | null;

  @Column({ name: "monthly_hoa", type: "integer", nullable: true })
  monthlyHoa!: number | null;

  @Column({ name: "rentcast_status", type: "text", default: "pending" })
  rentcastStatus!: string;

  @Column({ name: "rentcast_value_estimate", type: "integer", nullable: true })
  rentcastValueEstimate!: number | null;

  @Column({ name: "rentcast_value_low", type: "integer", nullable: true })
  rentcastValueLow!: number | null;

  @Column({ name: "rentcast_value_high", type: "integer", nullable: true })
  rentcastValueHigh!: number | null;

  @Column({ name: "rentcast_rent_estimate", type: "integer", nullable: true })
  rentcastRentEstimate!: number | null;

  @Column({ name: "rentcast_rent_low", type: "integer", nullable: true })
  rentcastRentLow!: number | null;

  @Column({ name: "rentcast_rent_high", type: "integer", nullable: true })
  rentcastRentHigh!: number | null;

  @Column({ name: "rentcast_error", type: "text", nullable: true })
  rentcastError!: string | null;

  @Column({ name: "rentcast_synced_at", type: "timestamp", nullable: true })
  rentcastSyncedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => PropertyFavorite, (favorite) => favorite.property)
  favorites!: PropertyFavorite[];
}
