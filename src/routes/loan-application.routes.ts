import express from "express";
import {
  createLoanApplication,
  getAllLoanApplications,
  getLoanApplicationById,
  updateLoanApplicationStatus,
  updateLoanApplication,
} from "../controllers/loan-application.controller";

const router = express.Router();

router.post("/applications", createLoanApplication);
router.get("/applications", getAllLoanApplications);
router.get("/applications/:id", getLoanApplicationById);
router.patch("/applications/:id/status", updateLoanApplicationStatus);
router.patch("/applications/:id", updateLoanApplication);

export default router;
