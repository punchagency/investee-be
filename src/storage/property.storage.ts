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

  async getAllProperties(params?: {
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
    limit?: number;
    offset?: number;
  }): Promise<[Property[], number]> {
    const qb = this.propertyRepo.createQueryBuilder("property");

    if (params) {
      if (params.city)
        qb.andWhere("property.city ILIKE :city", { city: `%${params.city}%` });
      if (params.state)
        qb.andWhere("property.state ILIKE :state", {
          state: `%${params.state}%`,
        });
      if (params.zipCode)
        qb.andWhere("property.postalCode ILIKE :zipCode", {
          zipCode: `%${params.zipCode}%`,
        });

      // Numeric filters
      if (params.minPrice)
        qb.andWhere("property.estValue >= :minPrice", {
          minPrice: params.minPrice,
        });
      if (params.maxPrice)
        qb.andWhere("property.estValue <= :maxPrice", {
          maxPrice: params.maxPrice,
        });

      if (params.minBeds)
        qb.andWhere("property.beds >= :minBeds", { minBeds: params.minBeds });
      if (params.maxBeds)
        qb.andWhere("property.beds <= :maxBeds", { maxBeds: params.maxBeds });

      if (params.minBaths)
        qb.andWhere("property.baths >= :minBaths", {
          minBaths: params.minBaths,
        });
      if (params.maxBaths)
        qb.andWhere("property.baths <= :maxBaths", {
          maxBaths: params.maxBaths,
        });

      if (params.minSqFt)
        qb.andWhere("property.sqFt >= :minSqFt", { minSqFt: params.minSqFt });
      if (params.maxSqFt)
        qb.andWhere("property.sqFt <= :maxSqFt", { maxSqFt: params.maxSqFt });

      if (params.query) {
        const sanitizedQuery = params.query
          .replace(/[^\w\s]/g, "")
          .trim()
          .split(/\s+/)
          .map((word) => `${word}:*`)
          .join(" & ");

        if (sanitizedQuery) {
          qb.andWhere(
            `to_tsvector('english', coalesce(property.address, '') || ' ' || coalesce(property.city, '') || ' ' || coalesce(property.owner, '')) @@ to_tsquery('english', :ftsQuery)`,
            { ftsQuery: sanitizedQuery }
          );
        }
      }
    }

    qb.orderBy("property.createdAt", "DESC");
    qb.take(params?.limit ?? 10);
    qb.skip(params?.offset ?? 0);

    return await qb.getManyAndCount();
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
}

export const propertyStorage = new PropertyStorage();
