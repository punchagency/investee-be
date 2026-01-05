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

  @Column({ name: "owner_occupied", type: "text", nullable: true })
  ownerOccupied!: string | null;

  @Column({ name: "listed_for_sale", type: "text", nullable: true })
  listedForSale!: string | null;

  @Column({ type: "text", nullable: true })
  foreclosure!: string | null;

  @Column({ name: "attom_status", type: "text", default: "pending" })
  attomStatus!: string;

  @Column({ name: "attom_market_value", type: "integer", nullable: true })
  attomMarketValue!: number | null;

  @Column({ name: "attom_assessed_value", type: "integer", nullable: true })
  attomAssessedValue!: number | null;

  @Column({ name: "attom_year_built", type: "integer", nullable: true })
  attomYearBuilt!: number | null;

  @Column({ name: "attom_bldg_size", type: "integer", nullable: true })
  attomBldgSize!: number | null;

  @Column({ name: "attom_beds", type: "integer", nullable: true })
  attomBeds!: number | null;

  @Column({ name: "attom_baths", type: "real", nullable: true })
  attomBaths!: number | null;

  @Column({ name: "attom_lot_size", type: "real", nullable: true })
  attomLotSize!: number | null;

  @Column({ name: "attom_prop_class", type: "text", nullable: true })
  attomPropClass!: string | null;

  @Column({ name: "attom_last_sale_price", type: "integer", nullable: true })
  attomLastSalePrice!: number | null;

  @Column({ name: "attom_last_sale_date", type: "text", nullable: true })
  attomLastSaleDate!: string | null;

  @Column({ name: "attom_data", type: "jsonb", nullable: true })
  attomData!: any;

  @Column({ name: "attom_error", type: "text", nullable: true })
  attomError!: string | null;

  @Column({ name: "attom_avm_value", type: "integer", nullable: true })
  attomAvmValue!: number | null;

  @Column({ name: "attom_avm_high", type: "integer", nullable: true })
  attomAvmHigh!: number | null;

  @Column({ name: "attom_avm_low", type: "integer", nullable: true })
  attomAvmLow!: number | null;

  @Column({ name: "attom_avm_confidence", type: "integer", nullable: true })
  attomAvmConfidence!: number | null;

  @Column({ name: "attom_tax_amount", type: "integer", nullable: true })
  attomTaxAmount!: number | null;

  @Column({ name: "attom_tax_year", type: "integer", nullable: true })
  attomTaxYear!: number | null;

  @Column({ name: "annual_taxes", type: "integer", nullable: true })
  annualTaxes!: number | null;

  @Column({ name: "annual_insurance", type: "integer", nullable: true })
  annualInsurance!: number | null;

  @Column({ name: "monthly_hoa", type: "integer", nullable: true })
  monthlyHoa!: number | null;

  @Column({ name: "attom_synced_at", type: "timestamp", nullable: true })
  attomSyncedAt!: Date | null;

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

  @Column({ name: "rentcast_property_data", type: "jsonb", nullable: true })
  rentcastPropertyData!: any;

  @Column({ name: "rentcast_tax_history", type: "jsonb", nullable: true })
  rentcastTaxHistory!: any;

  @Column({ name: "rentcast_sale_comps", type: "jsonb", nullable: true })
  rentcastSaleComps!: any;

  @Column({ name: "rentcast_rent_comps", type: "jsonb", nullable: true })
  rentcastRentComps!: any;

  @Column({ name: "rentcast_market_data", type: "jsonb", nullable: true })
  rentcastMarketData!: any;

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
