import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import logger from "../utils/logger";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        type: "MISSING_TOKEN",
        error: "Authentication required",
      });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(error, "Authentication failed");

    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      return res.status(401).json({
        success: false,
        type: "INVALID_TOKEN",
        error: "Invalid or expired token",
      });
    }

    return res.status(500).json({
      success: false,
      type: "SERVER_ERROR",
      error: "Authentication failed",
    });
  }
};
