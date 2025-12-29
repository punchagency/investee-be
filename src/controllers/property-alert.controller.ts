import type { Request, Response } from "express";
import { propertyAlertStorage } from "../storage/property-alert.storage";

// Get all alerts for current user
export const getAllAlerts = async (req: Request, res: Response) => {
  try {
    const userId = "default_user";
    const alerts = await propertyAlertStorage.getAlertsByUser(userId);
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

// Create a new alert
export const createAlert = async (req: Request, res: Response) => {
  try {
    const userId = "default_user";
    const alert = await propertyAlertStorage.createAlert({
      ...req.body,
      userId,
    });
    res.status(201).json(alert);
  } catch (error) {
    console.error("Error creating alert:", error);
    res.status(500).json({ error: "Failed to create alert" });
  }
};

// Get single alert
export const getAlertById = async (req: Request, res: Response) => {
  try {
    const alert = await propertyAlertStorage.getAlert(req.params.id);
    if (!alert) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }
    res.json(alert);
  } catch (error) {
    console.error("Error fetching alert:", error);
    res.status(500).json({ error: "Failed to fetch alert" });
  }
};

// Update an alert
export const updateAlert = async (req: Request, res: Response) => {
  try {
    const updated = await propertyAlertStorage.updateAlert(
      req.params.id,
      req.body
    );
    if (!updated) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating alert:", error);
    res.status(500).json({ error: "Failed to update alert" });
  }
};

// Delete an alert
export const deleteAlert = async (req: Request, res: Response) => {
  try {
    await propertyAlertStorage.deleteAlert(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting alert:", error);
    res.status(500).json({ error: "Failed to delete alert" });
  }
};
