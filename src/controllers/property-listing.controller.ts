import type { Request, Response } from "express";
import { propertyListingStorage } from "../storage/property-listing.storage";
import { propertyStorage } from "../storage/property.storage";
import { propertyOfferStorage } from "../storage/property-offer.storage";

//Create a new listing
export const createListing = async (req: Request, res: Response) => {
  try {
    const userId = "default_user";
    const listingData = {
      ...req.body,
      ownerUserId: userId,
    };
    const listing = await propertyListingStorage.createListing(listingData);
    res.status(201).json(listing);
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({ error: "Failed to create listing" });
  }
};

// Get all active listings (marketplace)
export const getAllListings = async (req: Request, res: Response) => {
  try {
    const listings = await propertyListingStorage.getAllListings();
    const listingsWithProperties = await Promise.all(
      listings.map(async (listing) => {
        const property = await propertyStorage.getProperty(listing.propertyId);
        return { ...listing, property };
      })
    );
    res.json(listingsWithProperties);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
};

// Get listings by owner (my listings)
export const getMyListings = async (req: Request, res: Response) => {
  try {
    const userId = "default_user";
    const listings = await propertyListingStorage.getListingsByOwner(userId);
    const listingsWithProperties = await Promise.all(
      listings.map(async (listing) => {
        const property = await propertyStorage.getProperty(listing.propertyId);
        const offers = await propertyOfferStorage.getOffersByListing(listing.id);
        return { ...listing, property, offers };
      })
    );
    res.json(listingsWithProperties);
  } catch (error) {
    console.error("Error fetching my listings:", error);
    res.status(500).json({ error: "Failed to fetch my listings" });
  }
};

// Get single listing
export const getListingById = async (req: Request, res: Response) => {
  try {
    const listing = await propertyListingStorage.getListing(req.params.id);
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    const property = await propertyStorage.getProperty(listing.propertyId);
    const offers = await propertyOfferStorage.getOffersByListing(listing.id);
    res.json({ ...listing, property, offers });
  } catch (error) {
    console.error("Error fetching listing:", error);
    res.status(500).json({ error: "Failed to fetch listing" });
  }
};

// Update listing
export const updateListing = async (req: Request, res: Response) => {
  try {
    const updated = await propertyListingStorage.updateListing(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating listing:", error);
    res.status(500).json({ error: "Failed to update listing" });
  }
};

// Delete listing
export const deleteListing = async (req: Request, res: Response) => {
  try {
    await propertyListingStorage.deleteListing(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({ error: "Failed to delete listing" });
  }
};
