import { AppDataSource } from "../db";
import { Vendor } from "../entities/Vendor.entity";

const vendorRepository = AppDataSource.getRepository(Vendor);

export const VendorStorage = {
  async getAllVendors() {
    return await vendorRepository.find({
      order: { name: "ASC" },
    });
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
