import { Router } from "express";
import {
  getAllProperties,
  getPropertyById,
  updateProperty,
  importProperties,
  enrichPropertyWithRentcastById,
  enrichPropertiesWithRentcast,
  getPropertiesBasedOnUserLocation,
} from "../controllers/property.controller";

const router = Router();

router.get("/properties/by-location", getPropertiesBasedOnUserLocation);

// Property CRUD
router.get("/properties", getAllProperties);
router.get("/properties/:id", getPropertyById);
router.put("/properties/:id", updateProperty);

// Import & Enrichment
router.post("/properties/import", importProperties);

router.post("/properties/:id/enrich-rentcast", enrichPropertyWithRentcastById);
router.post("/properties/enrich-rentcast-batch", enrichPropertiesWithRentcast);

export default router;
