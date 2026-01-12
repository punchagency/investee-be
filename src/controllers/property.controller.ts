import type { Request, Response } from "express";
import { propertyStorage } from "../storage/property.storage";
import { enrichPropertyWithAttom, delay } from "../services/attom.service";
import { enrichPropertyWithRentcast } from "../services/rentcast.service";
import { Property } from "../entities/Property.entity";
import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

const ATTOM_API_BASE = "https://api.gateway.attomdata.com/propertyapi/v1.0.0";

// ATTOM Property Search API proxy
export const searchProperty = async (req: Request, res: Response) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== "string") {
      res.status(400).json({ error: "Address is required" });
      return;
    }

    const apiKey = process.env.ATTOM_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "ATTOM API key not configured" });
      return;
    }

    const response = await axios.get(
      `${ATTOM_API_BASE}/property/basicprofile?address=${encodeURIComponent(
        address
      )}`,
      {
        headers: {
          Accept: "application/json",
          apikey: apiKey,
        },
        validateStatus: () => true,
      }
    );

    if (response.status !== 200) {
      if (response.status === 404) {
        res.status(404).json({ error: "Property not found" });
        return;
      }
      throw new Error(`ATTOM API returned ${response.status}`);
    }

    res.json(response.data);
  } catch (error) {
    console.error("Error searching property:", error);
    res.status(500).json({ error: "Failed to search property" });
  }
};

// ATTOM Radius Search API proxy
export const searchPropertiesByRadius = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius, minbeds, maxbeds, propertytype } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: "Latitude and longitude are required" });
      return;
    }

    const apiKey = process.env.ATTOM_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "ATTOM API key not configured" });
      return;
    }

    let url = `${ATTOM_API_BASE}/property/snapshot?latitude=${lat}&longitude=${lng}&radius=${
      radius || 1
    }`;
    if (minbeds) url += `&minbeds=${minbeds}`;
    if (maxbeds) url += `&maxbeds=${maxbeds}`;
    if (propertytype) url += `&propertytype=${propertytype}`;

    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
        apikey: apiKey,
      },
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      throw new Error(`ATTOM API returned ${response.status}`);
    }

    res.json(response.data);
  } catch (error) {
    console.error("Error searching properties by radius:", error);
    res.status(500).json({ error: "Failed to search properties" });
  }
};

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
    } = req.query as any;

    const [allProperties, count] = await propertyStorage.getAllProperties({
      query:
        (search ? String(search) : undefined) ||
        (query ? String(query) : undefined),
      city: city ? String(city) : undefined,
      state: state ? String(state) : undefined,
      zipCode: zipCode ? String(zipCode) : undefined,
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
      req.body
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
      normalizedPath.startsWith(prefix)
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
      ownerOccupied: row["Owner Occ?"] ? "Yes" : "No",
      listedForSale: row["Listed for Sale?"] ? "Yes" : "No",
      foreclosure: row["Foreclosure?"] ? "Yes" : "No",
      attomStatus: "pending",
    }));

    const importedProperties = await propertyStorage.createProperties(
      propertiesToInsert
    );

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

// Enrich all properties with ATTOM data
export const enrichPropertiesWithAttom = async (
  req: Request,
  res: Response
) => {
  try {
    const { force } = req.body || {};
    let toEnrich;
    let total;

    if (force) {
      [toEnrich, total] = await propertyStorage.getAllProperties();
    } else {
      const pendingProperties = await propertyStorage.getPropertiesByStatus(
        "pending"
      );
      const rateLimitedProperties = await propertyStorage.getPropertiesByStatus(
        "rate_limited"
      );
      toEnrich = [...pendingProperties, ...rateLimitedProperties];
      total = toEnrich.length;
    }

    if (total === 0) {
      res.json({
        success: true,
        message: "No properties to enrich",
        enriched: 0,
      });
      return;
    }

    res.json({
      success: true,
      message: `Enrichment started for ${toEnrich.length} properties`,
      total: toEnrich.length,
    });

    for (const property of toEnrich) {
      if (property.address && property.city) {
        await enrichPropertyWithAttom(
          property.id,
          property.address,
          property.city,
          property.state || "CA"
        );
        await delay(500);
      }
    }
  } catch (error) {
    console.error("Error enriching properties:", error);
    res.status(500).json({ error: "Failed to enrich properties" });
  }
};

// Enrich a single property with ATTOM
export const enrichPropertyWithAttomById = async (
  req: Request,
  res: Response
) => {
  try {
    const property = await propertyStorage.getProperty(req.params.id);
    if (!property) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    await enrichPropertyWithAttom(
      property.id,
      property.address,
      property.city || "",
      property.state || "CA"
    );

    const updated = await propertyStorage.getProperty(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error("Error enriching property:", error);
    res.status(500).json({ error: "Failed to enrich property" });
  }
};

// Enrich a single property with RentCast
export const enrichPropertyWithRentcastById = async (
  req: Request,
  res: Response
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
      property.postalCode
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
  res: Response
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
          property.postalCode
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
  res: Response
) => {
  try {
    const location = req.location;

    if (!location) {
      // If no location found, return empty list or maybe defaults
      // For now, return empty to indicate no location context
      res.json({
        properties: [],
        location: null,
        message: "No location data available",
      });
      return;
    }

    const { ll } = location;

    if (!ll || ll === "Unknown" || !Array.isArray(ll)) {
      res.json({
        properties: [],
        location: null,
        message: "No specific location coordinates available",
      });
      return;
    }

    const [latitude, longitude] = ll;

    const property = await propertyStorage.getPropertyByLocation(
      latitude,
      longitude
    );

    res.json({
      property,
      found: !!property,
    });
  } catch (error) {
    console.error("Error fetching properties by location:", error);
    res.status(500).json({ error: "Failed to fetch properties by location" });
  }
};
