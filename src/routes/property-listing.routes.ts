import express from "express";
import {
  createListing,
  getAllListings,
  getMyListings,
  getListingById,
  updateListing,
  deleteListing,
} from "../controllers/property-listing.controller";

const router = express.Router();

router.post("/listings", createListing);
router.get("/listings", getAllListings);
router.get("/listings/my", getMyListings);
router.get("/listings/:id", getListingById);
router.patch("/listings/:id", updateListing);
router.delete("/listings/:id", deleteListing);

export default router;
