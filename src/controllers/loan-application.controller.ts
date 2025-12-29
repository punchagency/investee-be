import type { Request, Response } from "express";
import { loanApplicationStorage } from "../storage/loan-application.storage";

// Create a new loan application
export const createLoanApplication = async (req: Request, res: Response) => {
  try {
    const application = await loanApplicationStorage.createLoanApplication(
      req.body
    );
    res.status(201).json(application);
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(500).json({ error: "Failed to create application" });
  }
};

// Get all loan applications
export const getAllLoanApplications = async (req: Request, res: Response) => {
  try {
    const applications = await loanApplicationStorage.getAllLoanApplications();
    res.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

// Get a specific loan application
export const getLoanApplicationById = async (req: Request, res: Response) => {
  try {
    const application = await loanApplicationStorage.getLoanApplication(
      req.params.id
    );
    if (!application) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ error: "Failed to fetch application" });
  }
};

// Update application status
export const updateLoanApplicationStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { status } = req.body;
    if (!status || typeof status !== "string") {
      res.status(400).json({ error: "Status is required" });
      return;
    }
    const updated = await loanApplicationStorage.updateLoanApplicationStatus(
      req.params.id,
      status
    );
    if (!updated) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
};

// Update application
export const updateLoanApplication = async (req: Request, res: Response) => {
  try {
    const updated = await loanApplicationStorage.updateLoanApplication(
      req.params.id,
      req.body
    );
    if (!updated) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({ error: "Failed to update application" });
  }
};
