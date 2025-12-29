import express from "express";
import { getMapsConfig, getStreetView } from "../controllers/config.controller";

const router = express.Router();

router.get("/config/maps", getMapsConfig);
router.get("/streetview", getStreetView);

export default router;
