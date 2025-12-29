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
} from "../controllers/property.controller";

const router = express.Router();

// ATTOM API proxies
router.get("/property/search", searchProperty);
router.get("/property/radius", searchPropertiesByRadius);

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
