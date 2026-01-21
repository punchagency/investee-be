import { AppDataSource } from "../db";
import { Repository, ILike, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { Property } from "../entities/Property.entity";

type PropertyKeys = keyof Property;

export class PropertyStorage {
  private propertyRepo: Repository<Property>;

  constructor() {
    this.propertyRepo = AppDataSource.getRepository(Property);
  }

  async createProperty(
    property: Partial<Omit<Property, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Property> {
    const created = this.propertyRepo.create(property);
    return await this.propertyRepo.save(created);
  }

  async createProperties(
    propertiesToInsert: Partial<
      Omit<Property, "id" | "createdAt" | "updatedAt">
    >[],
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
    propertyType?: string;
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
    select?: PropertyKeys[];
    skipCount?: boolean;
    orderBy?: PropertyKeys;
    orderDirection?: "ASC" | "DESC";
    excludeIds?: string[];
    foreclosure?: boolean;
    ownerOccupied?: boolean;
    listedForSale?: boolean;
  }): Promise<[Property[], number]> {
    const qb = this.propertyRepo.createQueryBuilder("property");
    if (params?.select) {
      qb.select(params.select.map((field) => `property.${field}`));
    }
    if (params) {
      if (params.city) {
        const sanitizedCity = params.city
          .replace(/[^\w\s]/g, "")
          .trim()
          .split(/\s+/)
          .join(" & ");

        qb.andWhere(
          "to_tsvector('english', property.city) @@ to_tsquery('english', :city)",
          { city: `${sanitizedCity}:*` },
        );
      }
      if (params.state)
        qb.andWhere("property.state = :state", {
          state: params.state,
        });

      if (params.propertyType) {
        qb.andWhere("property.propertyType = :propertyType", {
          propertyType: params.propertyType,
        });
      }

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
            { ftsQuery: sanitizedQuery },
          );
        }
      }
      if (params.foreclosure) {
        qb.andWhere("property.foreclosure = :foreclosure", {
          foreclosure: params.foreclosure,
        });
      }
      if (params.ownerOccupied) {
        qb.andWhere("property.ownerOccupied = :ownerOccupied", {
          ownerOccupied: params.ownerOccupied,
        });
      }
      if (params.listedForSale) {
        qb.andWhere("property.listedForSale = :listedForSale", {
          listedForSale: params.listedForSale,
        });
      }

      if (params.excludeIds && params.excludeIds.length > 0) {
        qb.andWhere("property.id NOT IN (:...excludeIds)", {
          excludeIds: params.excludeIds,
        });
      }
    }

    // Default sort is createdAt DESC, but allow override
    const sortField = params?.orderBy
      ? `property.${params.orderBy}`
      : "property.createdAt";
    const sortDir = params?.orderDirection ?? "DESC";
    qb.orderBy(sortField, sortDir);

    qb.take(params?.limit ?? 10);
    qb.skip(params?.offset ?? 0);

    if (params?.skipCount) {
      return [await qb.getMany(), 0];
    }

    return await qb.getManyAndCount();
  }

  async updateProperty(
    id: string,
    updates: Partial<Property>,
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

  async getPropertiesByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    limit: number = 4,
  ): Promise<Property[]> {
    const qb = this.propertyRepo.createQueryBuilder("property");

    // Convert km to meters for ST_DWithin
    const radiusMeters = radiusKm * 1000;

    // Use PostGIS ST_DWithin to find properties within the radius
    // We assume the 'location' column is of type 'geography' with SRID 4326
    qb.where(
      `ST_DWithin(
        property.location, 
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), 
        :radiusMeters
      )`,
      {
        longitude,
        latitude,
        radiusMeters,
      },
    );

    // Order by distance (nearest first)
    qb.orderBy(
      `ST_Distance(
        property.location, 
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
      )`,
      "ASC",
    );

    qb.take(limit);

    return await qb.getMany();
  }
}

export const propertyStorage = new PropertyStorage();
