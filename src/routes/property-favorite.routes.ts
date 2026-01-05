import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

import {
  getFavorites,
  checkIsFavorite,
  addFavorite,
  removeFavorite,
} from "../controllers/property-favorite.controller";

const router = Router();

router.use(authenticate);

router.get("/favorites", getFavorites);
router.get("/favorites/:propertyId", checkIsFavorite);
router.post("/favorites", addFavorite);
router.delete("/favorites/:propertyId", removeFavorite);

export default router;
