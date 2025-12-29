import express from "express";
import {
  getAllAlerts,
  createAlert,
  getAlertById,
  updateAlert,
  deleteAlert,
} from "../controllers/property-alert.controller";

const router = express.Router();

router.get("/alerts", getAllAlerts);
router.post("/alerts", createAlert);
router.get("/alerts/:id", getAlertById);
router.patch("/alerts/:id", updateAlert);
router.delete("/alerts/:id", deleteAlert);

export default router;
