import type { Request, Response } from "express";
import { propertyWatchlistStorage } from "../storage/property-watchlist.storage";
import { propertyListingStorage } from "../storage/property-listing.storage";
import { propertyStorage } from "../storage/property.storage";

// Get user's watchlist
export const getWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = "default_user";
    const watchlist = await propertyWatchlistStorage.getWatchlistByUser(userId);
    const watchlistWithListings = await Promise.all(
      watchlist.map(async (item) => {
        const listing = await propertyListingStorage.getListing(item.listingId);
        const property = listing
          ? await propertyStorage.getProperty(listing.propertyId)
          : null;
        return { ...item, listing, property };
      })
    );
    res.json(watchlistWithListings);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
};

// Add to watchlist
export const addToWatchlist = async (req: Request, res: Response) => {
  try {
    const { listingId } = req.body;
    const userId = "default_user";

    const exists = await propertyWatchlistStorage.isInWatchlist(userId, listingId);
    if (exists) {
      res.status(400).json({ error: "Already in watchlist" });
      return;
    }

    const item = await propertyWatchlistStorage.addToWatchlist({ userId, listingId });
    res.status(201).json(item);
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
};

// Remove from watchlist
export const removeFromWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = "default_user";
    await propertyWatchlistStorage.removeFromWatchlist(userId, req.params.listingId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    res.status(500).json({ error: "Failed to remove from watchlist" });
  }
};

// Check if listing is in watchlist
export const checkWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = "default_user";
    const isWatched = await propertyWatchlistStorage.isInWatchlist(userId, req.params.listingId);
    res.json({ isWatched });
  } catch (error) {
    console.error("Error checking watchlist:", error);
    res.status(500).json({ error: "Failed to check watchlist" });
  }
};
