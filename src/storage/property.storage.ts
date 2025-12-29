import { AppDataSource } from "../db";
import { Repository } from "typeorm";
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

  async getAllProperties(): Promise<Property[]> {
    return await this.propertyRepo.find({
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
}

export const propertyStorage = new PropertyStorage();
