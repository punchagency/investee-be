import type { Request, Response } from "express";
import { propertyFavoriteStorage } from "../storage/property-favorite.storage";
import logger from "../utils/logger";

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const favorites = await propertyFavoriteStorage.getFavorites(userId);
    return res.json(favorites);
  } catch (error) {
    logger.error({ error }, "Error fetching favorites");
    return res.status(500).json({ error: "Failed to fetch favorites" });
  }
};

export const checkIsFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { propertyId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isFavorite = await propertyFavoriteStorage.isFavorite(
      userId,
      propertyId
    );
    return res.json({ isFavorite });
  } catch (error) {
    logger.error({ error }, "Error checking favorite status");
    return res.status(500).json({ error: "Failed to check favorite status" });
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { propertyId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!propertyId) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    await propertyFavoriteStorage.addFavorite(userId, propertyId);
    return res.status(201).json({ success: true });
  } catch (error) {
    logger.error({ error }, "Error adding favorite");
    return res.status(500).json({ error: "Failed to add favorite" });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { propertyId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await propertyFavoriteStorage.removeFavorite(userId, propertyId);
    return res.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Error removing favorite");
    return res.status(500).json({ error: "Failed to remove favorite" });
  }
};
