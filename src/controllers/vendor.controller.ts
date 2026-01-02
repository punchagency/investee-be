import { Request, Response } from "express";
import { VendorStorage } from "../storage/vendor.storage";
import logger from "../utils/logger";

export const VendorController = {
  async getAllVendors(req: Request, res: Response) {
    try {
      const vendors = await VendorStorage.getAllVendors();
      return res.json({ success: true, data: vendors });
    } catch (error) {
      logger.error(error, "Error fetching vendors");
      return res.status(500).json({
        success: false,
        error: "Failed to fetch vendors",
      });
    }
  },

  async getVendorById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vendor = await VendorStorage.getVendorById(id);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          error: "Vendor not found",
        });
      }

      return res.json({ success: true, data: vendor });
    } catch (error) {
      logger.error(error, "Error fetching vendor");
      return res.status(500).json({
        success: false,
        error: "Failed to fetch vendor",
      });
    }
  },

  async createVendor(req: Request, res: Response) {
    try {
      const vendor = await VendorStorage.createVendor(req.body);
      return res.status(201).json({
        success: true,
        message: "Vendor created successfully",
        data: vendor,
      });
    } catch (error) {
      logger.error(error, "Error creating vendor");
      return res.status(500).json({
        success: false,
        error: "Failed to create vendor",
      });
    }
  },

  async updateVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vendor = await VendorStorage.updateVendor(id, req.body);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          error: "Vendor not found",
        });
      }

      return res.json({
        success: true,
        message: "Vendor updated successfully",
        data: vendor,
      });
    } catch (error) {
      logger.error(error, "Error updating vendor");
      return res.status(500).json({
        success: false,
        error: "Failed to update vendor",
      });
    }
  },

  async deleteVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await VendorStorage.deleteVendor(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Vendor not found",
        });
      }

      return res.status(204).send();
    } catch (error) {
      logger.error(error, "Error deleting vendor");
      return res.status(500).json({
        success: false,
        error: "Failed to delete vendor",
      });
    }
  },
};
