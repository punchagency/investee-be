import { AppDataSource } from "../db";
import { PropertyFavorite } from "../entities/PropertyFavorite.entity";
import { Property } from "../entities/Property.entity";

export class PropertyFavoriteStorage {
  private repo = AppDataSource.getRepository(PropertyFavorite);
  private propertyRepo = AppDataSource.getRepository(Property);

  async addFavorite(userId: string, propertyId: string) {
    const existing = await this.repo.findOne({
      where: { userId, propertyId },
    });

    if (existing) return existing;

    const favorite = this.repo.create({
      userId,
      propertyId,
    });

    return await this.repo.save(favorite);
  }

  async removeFavorite(userId: string, propertyId: string) {
    await this.repo.delete({ userId, propertyId });
    return true;
  }

  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { userId, propertyId },
    });
    return count > 0;
  }

  async getFavorites(userId: string): Promise<PropertyFavorite[]> {
    return await this.repo.find({
      where: { userId },
      relations: ["property"],
    });
  }
}

export const propertyFavoriteStorage = new PropertyFavoriteStorage();
