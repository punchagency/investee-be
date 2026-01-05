import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { userStorage } from "../storage/user.storage";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt";
import logger from "../utils/logger";

const SALT_ROUNDS = 10;

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        type: "MISSING_FIELDS",
        error: "Email and password are required",
      });
    }

    logger.info({ email }, "Starting user registration");

    // Check if user already exists
    const existingUser = await userStorage.getUserByEmail(email);
    if (existingUser) {
      logger.warn({ email }, "Email already registered");
      return res.status(400).json({
        success: false,
        type: "EMAIL_EXISTS",
        error: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await userStorage.upsertUser({
      // id will be auto-generated
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      profileImageUrl: null,
      role: "user", // Default role
    });

    logger.info({ email, userId: user.id }, "User registered successfully");

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    logger.error({ error }, "Registration failed");
    return res.status(500).json({
      success: false,
      type: "REGISTRATION_ERROR",
      error: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        type: "MISSING_FIELDS",
        error: "Email and password are required",
      });
    }

    logger.info({ email }, "Starting user login");

    // Get user with password
    const user = await userStorage.getUserByEmailWithPassword(email);

    if (!user) {
      logger.warn({ email }, "User not found");
      return res.status(401).json({
        success: false,
        type: "INVALID_CREDENTIALS",
        error: "Invalid email or password",
      });
    }

    if (!user.password) {
      logger.warn({ email }, "User has no password set");
      return res.status(401).json({
        success: false,
        type: "INVALID_CREDENTIALS",
        error: "Invalid email or password",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn({ email }, "Invalid password attempt");
      return res.status(401).json({
        success: false,
        type: "INVALID_CREDENTIALS",
        error: "Invalid email or password",
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email!, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email!, user.role);

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? "lax" : undefined,
      path: "/",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.COOKIE_DOMAIN
          : undefined,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: process.env.NODE_ENV === "production" ? "lax" : undefined,
      path: "/api/auth/refresh-token",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.COOKIE_DOMAIN
          : undefined,
    });

    logger.info({ email, userId: user.id }, "User logged in successfully");

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error({ error }, "Login failed");
    return res.status(500).json({
      success: false,
      type: "SERVER_ERROR",
      error: error instanceof Error ? error.message : "Login failed",
    });
  }
};

// Refresh access token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    logger.info("Starting refresh token process");

    if (!refreshToken) {
      logger.warn("No refresh token provided");
      return res.status(400).json({
        success: false,
        type: "MISSING_TOKEN",
        error: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const user = await userStorage.getUser(decoded.userId);

    if (!user) {
      logger.warn({ userId: decoded.userId }, "User not found");
      return res.status(401).json({
        success: false,
        type: "INVALID_TOKEN",
        error: "Invalid refresh token",
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user.id, user.email!, user.role);

    // Set new access token cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "lax" : undefined,
      path: "/",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.COOKIE_DOMAIN
          : undefined,
    });

    logger.info({ userId: user.id }, "Access token refreshed");

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
    });
  } catch (error) {
    logger.error({ error }, "Refresh token failed");

    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError")
    ) {
      return res.status(401).json({
        success: false,
        type: "INVALID_TOKEN",
        error: "Invalid or expired refresh token",
      });
    }

    return res.status(500).json({
      success: false,
      type: "SERVER_ERROR",
      error: "Token refresh failed",
    });
  }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
  try {
    // Clear cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : undefined,
      path: "/",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.COOKIE_DOMAIN
          : undefined,
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : undefined,
      path: "/api/auth/refresh-token",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.COOKIE_DOMAIN
          : undefined,
    });

    logger.info("User logged out");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error({ error }, "Logout failed");
    return res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const decoded = verifyAccessToken(token);
    const user = await userStorage.getUser(decoded.userId);

    if (user) {
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
  } catch (error) {
    logger.error({ error }, "Error fetching user");
    res.status(500).json({
      success: false,
      error: "Failed to fetch user",
    });
  }
};
