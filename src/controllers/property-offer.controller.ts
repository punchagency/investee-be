import type { Request, Response } from "express";
import { propertyOfferStorage } from "../storage/property-offer.storage";
import { propertyListingStorage } from "../storage/property-listing.storage";
import { propertyStorage } from "../storage/property.storage";

// Create offer
export const createOffer = async (req: Request, res: Response) => {
  try {
    const userId = "default_user";
    const offerData = {
      ...req.body,
      buyerUserId: userId,
    };
    const offer = await propertyOfferStorage.createOffer(offerData);
    res.status(201).json(offer);
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({ error: "Failed to create offer" });
  }
};

// Get my offers (as buyer)
export const getMyOffers = async (req: Request, res: Response) => {
  try {
    const userId = "default_user";
    const offers = await propertyOfferStorage.getOffersByBuyer(userId);
    const offersWithListings = await Promise.all(
      offers.map(async (offer) => {
        const listing = await propertyListingStorage.getListing(offer.listingId);
        const property = listing
          ? await propertyStorage.getProperty(listing.propertyId)
          : null;
        return { ...offer, listing, property };
      })
    );
    res.json(offersWithListings);
  } catch (error) {
    console.error("Error fetching my offers:", error);
    res.status(500).json({ error: "Failed to fetch my offers" });
  }
};

// Get offers for a listing
export const getOffersByListing = async (req: Request, res: Response) => {
  try {
    const offers = await propertyOfferStorage.getOffersByListing(req.params.listingId);
    res.json(offers);
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
};

// Update offer status
export const updateOffer = async (req: Request, res: Response) => {
  try {
    const updated = await propertyOfferStorage.updateOffer(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Offer not found" });
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({ error: "Failed to update offer" });
  }
};
