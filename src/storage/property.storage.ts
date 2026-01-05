import { AppDataSource } from "../db";
import { Repository, ILike, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { Property } from "../entities/Property.entity";

export class PropertyStorage {
  private propertyRepo: Repository<Property>;

  constructor() {
    this.propertyRepo = AppDataSource.getRepository(Property);
  }

  async createProperty(
    property: Partial<Omit<Property, "id" | "createdAt" | "updatedAt">>
  ): Promise<Property> {
    const created = this.propertyRepo.create(property);
    return await this.propertyRepo.save(created);
  }

  async createProperties(
    propertiesToInsert: Partial<
      Omit<Property, "id" | "createdAt" | "updatedAt">
    >[]
  ): Promise<Property[]> {
    if (propertiesToInsert.length === 0) return [];
    const created = this.propertyRepo.create(propertiesToInsert);
    return await this.propertyRepo.save(created);
  }

  async getProperty(id: string): Promise<Property | undefined> {
    const property = await this.propertyRepo.findOne({ where: { id } });
    return property || undefined;
  }

  async getAllProperties(): Promise<[Property[], number]> {
    return await this.propertyRepo.findAndCount({
      order: { createdAt: "DESC" },
    });
  }

  async getPropertiesByStatus(status: string): Promise<Property[]> {
    return await this.propertyRepo.find({
      where: { attomStatus: status },
      order: { createdAt: "DESC" },
    });
  }

  async updateProperty(
    id: string,
    updates: Partial<Property>
  ): Promise<Property | undefined> {
    const property = await this.propertyRepo.findOne({ where: { id } });
    if (!property) return undefined;

    Object.assign(property, updates);
    property.updatedAt = new Date();
    return await this.propertyRepo.save(property);
  }

  async countRentcastSyncedProperties(): Promise<number> {
    return await this.propertyRepo.count({
      where: { rentcastStatus: "success" },
    });
  }

  async searchProperties(params: {
    query?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    minPrice?: number;
    maxPrice?: number;
    minBeds?: number;
    maxBeds?: number;
    minBaths?: number;
    maxBaths?: number;
    minSqFt?: number;
    maxSqFt?: number;
  }): Promise<Property[]> {
    const where: any = {};

    if (params.city) where.city = ILike(`%${params.city}%`);
    if (params.state) where.state = ILike(`%${params.state}%`);
    if (params.zipCode) where.postalCode = ILike(`%${params.zipCode}%`);

    // Numeric filters
    if (params.minPrice) where.estValue = MoreThanOrEqual(params.minPrice);
    if (params.maxPrice) where.estValue = LessThanOrEqual(params.maxPrice);

    if (params.minBeds) where.beds = MoreThanOrEqual(params.minBeds);
    if (params.maxBeds) where.beds = LessThanOrEqual(params.maxBeds);

    if (params.minBaths) where.baths = MoreThanOrEqual(params.minBaths);
    if (params.maxBaths) where.baths = LessThanOrEqual(params.maxBaths);

    if (params.minSqFt) where.sqFt = MoreThanOrEqual(params.minSqFt);
    if (params.maxSqFt) where.sqFt = LessThanOrEqual(params.maxSqFt);

    if (params.query) {
      if (!params.city && !params.state && !params.zipCode) {
        return await this.propertyRepo.find({
          where: [
            { address: ILike(`%${params.query}%`) },
            { city: ILike(`%${params.query}%`) },
          ],
          take: 10,
          order: { createdAt: "DESC" },
        });
      }
    }

    return await this.propertyRepo.find({
      where,
      take: 10,
      order: { createdAt: "DESC" },
    });
  }
}

export const propertyStorage = new PropertyStorage();
