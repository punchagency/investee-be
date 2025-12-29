import express from "express";
import {
  createOffer,
  getMyOffers,
  getOffersByListing,
  updateOffer,
} from "../controllers/property-offer.controller";

const router = express.Router();

router.post("/offers", createOffer);
router.get("/offers/my", getMyOffers);
router.get("/listings/:listingId/offers", getOffersByListing);
router.patch("/offers/:id", updateOffer);

export default router;
