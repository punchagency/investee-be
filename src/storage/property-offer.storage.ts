import { AppDataSource } from "../db";
import { Repository } from "typeorm";
import { PropertyOffer, InsertOffer } from "@/entities";

export class PropertyOfferStorage {
  private offerRepo: Repository<PropertyOffer>;

  constructor() {
    this.offerRepo = AppDataSource.getRepository(PropertyOffer);
  }

  async createOffer(offer: InsertOffer): Promise<PropertyOffer> {
    const created = this.offerRepo.create(offer);
    return await this.offerRepo.save(created);
  }

  async getOffer(id: string): Promise<PropertyOffer | undefined> {
    const offer = await this.offerRepo.findOne({ where: { id } });
    return offer || undefined;
  }

  async getOffersByListing(listingId: string): Promise<PropertyOffer[]> {
    return await this.offerRepo.find({
      where: { listingId },
      order: { createdAt: "DESC" },
    });
  }

  async getOffersByBuyer(buyerId: string): Promise<PropertyOffer[]> {
    return await this.offerRepo.find({
      where: { buyerUserId: buyerId },
      order: { createdAt: "DESC" },
    });
  }

  async updateOffer(
    id: string,
    updates: Partial<PropertyOffer>
  ): Promise<PropertyOffer | undefined> {
    const offer = await this.offerRepo.findOne({ where: { id } });
    if (!offer) return undefined;

    Object.assign(offer, updates);
    offer.updatedAt = new Date();
    return await this.offerRepo.save(offer);
  }
}

export const propertyOfferStorage = new PropertyOfferStorage();
