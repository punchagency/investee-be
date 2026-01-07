import { Request, Response, NextFunction } from "express";
import requestIp from "request-ip";
import geoip from "geoip-lite";
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

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientIp = requestIp.getClientIp(req);

    // Lookup geo info
    const geo = clientIp ? geoip.lookup(clientIp) : null;

    const locationData = geo
      ? {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          ll: geo.ll, // [latitude, longitude]
        }
      : {
          country: "Unknown",
          region: "Unknown",
          city: "Unknown",
          ll: "Unknown",
        };

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
