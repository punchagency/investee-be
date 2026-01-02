import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../db";
import { AuthRequest } from "./auth.middleware";

/**
 * Sets PostgreSQL session variables for RLS policies
 * Must be called after authentication middleware
 */
export const setRLSContext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the current user from auth middleware
    const userId = req.user?.userId;
    const userRole = req.user?.role || "user"; // Default to 'user' role

    // Set session variables for RLS
    // These will be used by the RLS policies
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      if (userId) {
        await queryRunner.query(`SELECT set_config('app.user_id', $1, true)`, [
          userId,
        ]);
        await queryRunner.query(
          `SELECT set_config('app.user_role', $1, true)`,
          [userRole]
        );
      } else {
        // Clear session variables for unauthenticated requests
        await queryRunner.query(`SELECT set_config('app.user_id', '', true)`);
        await queryRunner.query(`SELECT set_config('app.user_role', '', true)`);
      }
    } finally {
      await queryRunner.release();
    }

    next();
  } catch (error) {
    console.error("Error setting RLS context:", error);
    // Don't fail the request if RLS context setting fails
    // Just log it and continue
    next();
  }
};

/**
 * Bypass RLS for admin operations
 * Use this middleware for admin-only routes
 */
export const bypassRLS = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Set role to service_role to bypass RLS
      await queryRunner.query(
        `SELECT set_config('app.user_role', 'service_role', true)`
      );
    } finally {
      await queryRunner.release();
    }

    next();
  } catch (error) {
    console.error("Error bypassing RLS:", error);
    next();
  }
};
