import express from "express";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist,
} from "../controllers/property-watchlist.controller";

const router = express.Router();

router.get("/watchlist", getWatchlist);
router.post("/watchlist", addToWatchlist);
router.delete("/watchlist/:listingId", removeFromWatchlist);
router.get("/watchlist/check/:listingId", checkWatchlist);

export default router;
