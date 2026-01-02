import { AppDataSource } from "../db";
import { Repository } from "typeorm";
import { PropertyWatchlist } from "../entities/PropertyWatchlist.entity";

export class PropertyWatchlistStorage {
  private watchlistRepo: Repository<PropertyWatchlist>;

  constructor() {
    this.watchlistRepo = AppDataSource.getRepository(PropertyWatchlist);
  }

  async addToWatchlist(
    item: Partial<Omit<PropertyWatchlist, "id" | "createdAt">>
  ): Promise<PropertyWatchlist> {
    const created = this.watchlistRepo.create(item);
    return await this.watchlistRepo.save(created);
  }

  async removeFromWatchlist(userId: string, listingId: string): Promise<void> {
    await this.watchlistRepo.delete({ userId, listingId });
  }

  async getWatchlistByUser(userId: string): Promise<PropertyWatchlist[]> {
    return await this.watchlistRepo.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async isInWatchlist(userId: string, listingId: string): Promise<boolean> {
    const item = await this.watchlistRepo.findOne({
      where: { userId, listingId },
    });
    return !!item;
  }
}

export const propertyWatchlistStorage = new PropertyWatchlistStorage();
