import { Router } from "express";
import { VendorController } from "../controllers/vendor.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Get all vendors
router.get("/vendors", VendorController.getAllVendors);

// Get vendor by ID
router.get("/vendors/:id", VendorController.getVendorById);

// Create vendor (protected)
router.post("/vendors", authenticate, VendorController.createVendor);

// Update vendor (protected)
router.patch("/vendors/:id", authenticate, VendorController.updateVendor);

// Delete vendor (protected)
router.delete("/vendors/:id", authenticate, VendorController.deleteVendor);

export default router;
