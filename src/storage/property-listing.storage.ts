import { AppDataSource } from "../db";
import { Repository } from "typeorm";
import { PropertyListing, InsertListing } from "@/entities";

export class PropertyListingStorage {
  private listingRepo: Repository<PropertyListing>;

  constructor() {
    this.listingRepo = AppDataSource.getRepository(PropertyListing);
  }

  async createListing(listing: InsertListing): Promise<PropertyListing> {
    const created = this.listingRepo.create(listing);
    return await this.listingRepo.save(created);
  }

  async getListing(id: string): Promise<PropertyListing | undefined> {
    const listing = await this.listingRepo.findOne({ where: { id } });
    return listing || undefined;
  }

  async getAllListings(): Promise<PropertyListing[]> {
    return await this.listingRepo.find({
      where: { status: "active" },
      order: { createdAt: "DESC" },
    });
  }

  async getListingsByOwner(ownerId: string): Promise<PropertyListing[]> {
    return await this.listingRepo.find({
      where: { ownerUserId: ownerId },
      order: { createdAt: "DESC" },
    });
  }

  async updateListing(
    id: string,
    updates: Partial<PropertyListing>
  ): Promise<PropertyListing | undefined> {
    const listing = await this.listingRepo.findOne({ where: { id } });
    if (!listing) return undefined;

    Object.assign(listing, updates);
    listing.updatedAt = new Date();
    return await this.listingRepo.save(listing);
  }

  async deleteListing(id: string): Promise<void> {
    await this.listingRepo.delete({ id });
  }
}

export const propertyListingStorage = new PropertyListingStorage();
