import "dotenv/config";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { initializeDatabase } from "./db";
import logger from "./utils/logger";
import authRoutes from "./routes/auth.routes";
import configRoutes from "./routes/config.routes";
import loanApplicationRoutes from "./routes/loan-application.routes";
import propertyRoutes from "./routes/property.routes";
import propertyListingRoutes from "./routes/property-listing.routes";
import propertyWatchlistRoutes from "./routes/property-watchlist.routes";
import propertyOfferRoutes from "./routes/property-offer.routes";
import propertyAlertRoutes from "./routes/property-alert.routes";
import aiRoutes from "./routes/ai.routes";
import vendorRoutes from "./routes/vendor.routes";
import propertyFavoriteRoutes from "./routes/property-favorite.routes";

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Log environment
if (NODE_ENV !== "production") {
  logger.info("Environment is not production");
  logger.info(`Environment is: ${NODE_ENV}`);
} else {
  logger.info("Environment is production");
  logger.info(`Environment is: ${NODE_ENV}`);
}

const app = express();

// Global error handlers
process.on("unhandledRejection", (error) => {
  logger.error(error, "unhandledRejection");
});

process.on("uncaughtException", (error) => {
  logger.error(error, "uncaughtException");
  process.exit(1);
});

// CORS configuration
let corsOptions;

if (NODE_ENV === "production") {
  corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
    preflightContinue: false,
    maxAge: 600,
    credentials: true,
    optionsSuccessStatus: 200,
  };
} else {
  corsOptions = {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
    ],
    credentials: true,
    preflightContinue: false,
    maxAge: 600,
    optionsSuccessStatus: 200,
  };
}

const morganFormat = NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api", authRoutes);
app.use("/api", configRoutes);
app.use("/api", loanApplicationRoutes);
app.use("/api", propertyRoutes);
app.use("/api", propertyListingRoutes);
app.use("/api", propertyWatchlistRoutes);
app.use("/api", propertyOfferRoutes);
app.use("/api", propertyAlertRoutes);
app.use("/api", aiRoutes);
app.use("/api", vendorRoutes);
app.use("/api", propertyFavoriteRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Investee Server is running",
    status: "ok",
    environment: NODE_ENV,
  });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(
      { err, path: req.path, method: req.method },
      `Error: ${message}`
    );
    res.status(status).json({ message });
  }
);

// Initialize database and start server
try {
  initializeDatabase();
  logger.info("Database connection initialized successfully");

  app.listen(PORT, () => {
    logger.info(`Server is running on port: ${PORT}`);
    logger.info(`Environment: ${NODE_ENV}`);
  });
} catch (error) {
  logger.error(error, "Error initializing database");
  process.exit(1);
}
