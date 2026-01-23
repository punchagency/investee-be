import { AppDataSource } from "../db";
import { Vendor } from "../entities/Vendor.entity";

const vendorRepository = AppDataSource.getRepository(Vendor);

export const VendorStorage = {
  async getAllVendors(params?: {
    search?: string;
    category?: string;
    city?: string;
    state?: string;
    verified?: boolean;
    licensed?: boolean;
    insured?: boolean;
    minRating?: number;
    price?: number;
    minYearsInBusiness?: number;
  }) {
    const qb = vendorRepository.createQueryBuilder("vendor");

    if (params) {
      if (params.search) {
        const sanitizedQuery = params.search
          .replace(/[^\w\s]/g, "")
          .trim()
          .split(/\s+/)
          .map((word) => `${word}:*`)
          .join(" & ");

        if (sanitizedQuery) {
          qb.andWhere(
            `to_tsvector('english', coalesce(vendor.name, '') || ' ' || coalesce(vendor.description, '')) @@ to_tsquery('english', :ftsQuery)`,
            { ftsQuery: sanitizedQuery },
          );
        }
      }

      if (params.category && params.category !== "all") {
        qb.andWhere("vendor.category = :category", {
          category: params.category,
        });
      }

      if (params.city) {
        qb.andWhere("vendor.city = :city", { city: params.city });
      }

      if (params.state) {
        qb.andWhere("vendor.state = :state", { state: params.state });
      }

      if (params.verified) {
        qb.andWhere("vendor.verified = :verified", {
          verified: params.verified,
        });
      }

      if (params.licensed) {
        qb.andWhere("vendor.licensed = :licensed", {
          licensed: params.licensed,
        });
      }

      if (params.insured) {
        qb.andWhere("vendor.insured = :insured", { insured: params.insured });
      }

      if (params.minRating) {
        qb.andWhere("vendor.rating >= :minRating", {
          minRating: params.minRating,
        });
      }

      if (params.price) {
        qb.andWhere("vendor.price = :price", {
          price: params.price,
        });
      }

      if (params.minYearsInBusiness) {
        qb.andWhere("vendor.yearsInBusiness >= :minYearsInBusiness", {
          minYearsInBusiness: params.minYearsInBusiness,
        });
      }
    }

    qb.orderBy("vendor.name", "ASC");

    return await qb.getMany();
  },

  async getVendorById(id: string) {
    return await vendorRepository.findOne({ where: { id } });
  },

  async getVendorsByCategory(category: string) {
    return await vendorRepository.find({
      where: { category },
      order: { rating: "DESC", name: "ASC" },
    });
  },

  async createVendor(vendorData: Partial<Vendor>) {
    const vendor = vendorRepository.create(vendorData);
    return await vendorRepository.save(vendor);
  },

  async updateVendor(id: string, vendorData: Partial<Vendor>) {
    await vendorRepository.update(id, vendorData);
    return await vendorRepository.findOne({ where: { id } });
  },

  async deleteVendor(id: string) {
    const result = await vendorRepository.delete(id);
    return result.affected && result.affected > 0;
  },
};
