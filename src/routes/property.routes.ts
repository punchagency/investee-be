import express from "express";
import {
  searchProperty,
  searchPropertiesByRadius,
  getAllProperties,
  getPropertyById,
  updateProperty,
  importProperties,
  enrichPropertiesWithAttom,
  enrichPropertyWithAttomById,
  enrichPropertyWithRentcastById,
  enrichPropertiesWithRentcast,
  getPropertiesBasedOnUserLocation,
} from "../controllers/property.controller";

const router = express.Router();

// ATTOM API proxies
router.get("/property/search", searchProperty);
router.get("/property/radius", searchPropertiesByRadius);
router.get("/properties/by-location", getPropertiesBasedOnUserLocation);

// Property CRUD
router.get("/properties", getAllProperties);
router.get("/properties/:id", getPropertyById);
router.put("/properties/:id", updateProperty);

// Import & Enrichment
router.post("/properties/import", importProperties);
router.post("/properties/enrich", enrichPropertiesWithAttom);
router.post("/properties/:id/enrich", enrichPropertyWithAttomById);
router.post("/properties/:id/enrich-rentcast", enrichPropertyWithRentcastById);
router.post("/properties/enrich-rentcast-batch", enrichPropertiesWithRentcast);

export default router;
