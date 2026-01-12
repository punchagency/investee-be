import { Request, Response, NextFunction } from "express";
import requestIp from "request-ip";
import { Reader, ReaderModel } from "@maxmind/geoip2-node";
import path from "path";
import logger from "./logger";

// Extend Express Request interface to include location
declare global {
  namespace Express {
    interface Request {
      location?: {
        country: string;
        region: string;
        city: string;
        ll: number[] | string;
      } | null;
    }
  }
}

let reader: ReaderModel | null = null;

// Initialize MaxMind Reader
Reader.open(path.join(process.cwd(), "GeoLite2-City.mmdb"))
  .then((r) => {
    reader = r;
    logger.info("MaxMind GeoIP database loaded successfully");
  })
  .catch((err) => {
    logger.error(err, "Failed to load MaxMind GeoIP database");
  });

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientIp = requestIp.getClientIp(req);
    let locationData = {
      country: "Unknown",
      region: "Unknown",
      city: "Unknown",
      ll: "Unknown" as number[] | string,
    };

    if (clientIp && reader) {
      try {
        const response = reader.city(clientIp);

        locationData = {
          country: response.country?.isoCode || "Unknown",
          region:
            response.subdivisions && response.subdivisions.length > 0
              ? response.subdivisions[0].isoCode || "Unknown"
              : "Unknown",
          city: response.city?.names?.en || "Unknown",
          ll:
            response.location &&
            response.location.latitude &&
            response.location.longitude
              ? [response.location.latitude, response.location.longitude]
              : "Unknown",
        };
      } catch (geoError) {
        // IP not found in DB or invalid
        // Keep defaults
      }
    }

    // Attach to request
    req.location = locationData;

    logger.info(
      {
        method: req.method,
        url: req.url,
        ip: clientIp,
        userAgent: req.get("User-Agent"),
        location: locationData,
      },
      "Incoming request"
    );
  } catch (error) {
    logger.error(error, "Request Logger error");
  }

  next();
};
