import type { Request, Response } from "express";
import { propertyStorage } from "../storage/property.storage";
// delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
import { enrichPropertyWithRentcast } from "../services/rentcast.service";
import { Property } from "../entities/Property.entity";
import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

// Get all properties
export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const {
      query,
      search,
      city,
      state,
      zipCode,
      minPrice,
      maxPrice,
      minBeds,
      maxBeds,
      minBaths,
      maxBaths,
      minSqFt,
      maxSqFt,
      limit,
      offset,
      propertyType,
      foreclosure,
      ownerOccupied,
      listedForSale,
    } = req.query as any;

    const [allProperties, count] = await propertyStorage.getAllProperties({
      query:
        (search ? String(search) : undefined) ||
        (query ? String(query) : undefined),
      city: city ? String(city).toUpperCase() : undefined,
      state: state ? String(state).toUpperCase() : undefined,
      zipCode: zipCode ? String(zipCode) : undefined,
      propertyType: propertyType
        ? String(propertyType).toUpperCase()
        : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minBeds: minBeds ? Number(minBeds) : undefined,
      maxBeds: maxBeds ? Number(maxBeds) : undefined,
      minBaths: minBaths ? Number(minBaths) : undefined,
      maxBaths: maxBaths ? Number(maxBaths) : undefined,
      minSqFt: minSqFt ? Number(minSqFt) : undefined,
      maxSqFt: maxSqFt ? Number(maxSqFt) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      foreclosure: foreclosure ? Boolean(foreclosure) : undefined,
      ownerOccupied: ownerOccupied ? Boolean(ownerOccupied) : undefined,
      listedForSale: listedForSale ? Boolean(listedForSale) : undefined,
    });
    res.json({ properties: allProperties, total: count });
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
};

// Get single property by ID
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const property = await propertyStorage.getProperty(req.params.id);
    if (!property) {
      res.status(404).json({ error: "Property not found" });
      return;
    }
    res.json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ error: "Failed to fetch property" });
  }
};

// Update property by ID
export const updateProperty = async (req: Request, res: Response) => {
  try {
    const updated = await propertyStorage.updateProperty(
      req.params.id,
      req.body,
    );
    if (!updated) {
      res.status(404).json({ error: "Property not found" });
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).json({ error: "Failed to update property" });
  }
};

// Import properties from Excel file
export const importProperties = async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;

    if (!filePath || typeof filePath !== "string") {
      res.status(400).json({ error: "File path is required" });
      return;
    }

    const normalizedPath = path.normalize(filePath);
    const allowedPrefixes = ["attached_assets/", "attached_assets\\"];
    const isAllowed = allowedPrefixes.some((prefix) =>
      normalizedPath.startsWith(prefix),
    );

    if (!isAllowed || normalizedPath.includes("..")) {
      res.status(403).json({
        error: "Access denied: only files from attached_assets are allowed",
      });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet) as Array<
      Record<string, unknown>
    >;

    const toBoolean = (val: unknown): boolean => {
      if (!val) return false;
      if (typeof val === "boolean") return val;
      const s = String(val).toLowerCase().trim();
      return ["yes", "y", "true", "1"].includes(s);
    };

    const propertiesToInsert: Partial<
      Omit<Property, "id" | "createdAt" | "updatedAt">
    >[] = data.map((row) => ({
      propertyType: String(row["Type"] || ""),
      address: String(row["Address"] || ""),
      city: String(row["City"] || ""),
      state: "CA",
      sqFt: Number(row["Sq Ft"]) || null,
      beds: Number(row["Beds"]) || null,
      baths: Number(row["Baths"]) || null,
      estValue: Number(row["Est Value"]) || null,
      estEquity: Number(row["Est Equity $"]) || null,
      owner: String(row["Owner"] || ""),
      ownerOccupied: toBoolean(row["Owner Occ?"]),
      listedForSale: toBoolean(row["Listed for Sale?"]),
      foreclosure: toBoolean(row["Foreclosure?"]),
    }));

    const importedProperties =
      await propertyStorage.createProperties(propertiesToInsert);

    res.json({
      success: true,
      imported: importedProperties.length,
      properties: importedProperties,
    });
  } catch (error) {
    console.error("Error importing properties:", error);
    res.status(500).json({ error: "Failed to import properties" });
  }
};

// Enrich a single property with RentCast
export const enrichPropertyWithRentcastById = async (
  req: Request,
  res: Response,
) => {
  try {
    const property = await propertyStorage.getProperty(req.params.id);
    if (!property) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    if (property.rentcastStatus === "success") {
      res.json(property);
      return;
    }

    const syncedCount = await propertyStorage.countRentcastSyncedProperties();
    if (syncedCount >= 10) {
      res.status(429).json({
        error: "RentCast limit reached",
        message:
          "RentCast data is limited to 10 properties. You have already synced 10 properties.",
      });
      return;
    }

    await enrichPropertyWithRentcast(
      property.id,
      property.address,
      property.city || "",
      property.state || "CA",
      property.postalCode,
    );

    const updated = await propertyStorage.getProperty(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error("Error enriching property with RentCast:", error);
    res.status(500).json({ error: "Failed to enrich property with RentCast" });
  }
};

// Enrich properties with RentCast (batch)
export const enrichPropertiesWithRentcast = async (
  req: Request,
  res: Response,
) => {
  try {
    const syncedCount = await propertyStorage.countRentcastSyncedProperties();
    const remainingSlots = 10 - syncedCount;

    if (remainingSlots <= 0) {
      res.status(429).json({
        error: "RentCast limit reached",
        message:
          "RentCast data is limited to 10 properties. You have already synced 10 properties.",
      });
      return;
    }

    const [allProperties, total] = await propertyStorage.getAllProperties();
    const toEnrich = allProperties
      .filter((p) => p.rentcastStatus !== "success")
      .slice(0, remainingSlots);

    if (toEnrich.length === 0) {
      res.json({
        success: true,
        message: "No properties to enrich",
        enriched: 0,
      });
      return;
    }

    res.json({
      success: true,
      message: `RentCast enrichment started for ${
        toEnrich.length
      } properties (${syncedCount} already synced, ${
        10 - syncedCount
      } slots remaining)`,
      total: toEnrich.length,
    });

    for (const property of toEnrich) {
      if (property.address && property.city) {
        await enrichPropertyWithRentcast(
          property.id,
          property.address,
          property.city,
          property.state || "CA",
          property.postalCode,
        );
        await delay(1000);
      }
    }
  } catch (error) {
    console.error("Error batch enriching with RentCast:", error);
    res.status(500).json({ error: "Failed to batch enrich with RentCast" });
  }
};

// Get properties based on user location (IP/Geo)
export const getPropertiesBasedOnUserLocation = async (
  req: Request,
  res: Response,
) => {
  try {
    const location = req.location;
    const targetCount = 12;
    let properties: any[] = [];
    let locationData: any = null;

    if (location && location.ll && Array.isArray(location.ll)) {
      const [latitude, longitude] = location.ll;
      locationData = {
        latitude,
        longitude,
        city: location.city,
        state: location.region,
      };

      // 1. Try to get properties by location
      properties = await propertyStorage.getPropertiesByLocation(
        latitude,
        longitude,
        50, // default radius
        targetCount,
      );
    }

    // 2. If we don't have enough (or location was missing), fetch generic ones to fill the gaps
    if (properties.length < targetCount) {
      const needed = targetCount - properties.length;
      const existingIds = properties.map((p) => p.id);

      const [fallbackProperties] = await propertyStorage.getAllProperties({
        limit: needed,
        excludeIds: existingIds.length > 0 ? existingIds : undefined,
        orderBy: "createdAt",
        orderDirection: "DESC",
      });

      properties = [...properties, ...fallbackProperties];
    }

    res.json({
      properties,
      found: properties.length > 0,
      location: locationData,
    });
  } catch (error) {
    console.error("Error fetching properties by location:", error);
    res.status(500).json({ error: "Failed to fetch properties by location" });
  }
};
