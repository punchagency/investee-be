import type { Request, Response } from "express";

import axios from "axios";

// Get Google Maps API key
export const getMapsConfig = (req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Google Maps API key not configured" });
    return;
  }
  res.json({ apiKey });
};

// Proxy Street View images
export const getStreetView = async (req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Google Maps API key not configured" });
    return;
  }

  const { address, size = "400x300", heading } = req.query;
  if (!address || typeof address !== "string") {
    res.status(400).json({ error: "Address is required" });
    return;
  }

  try {
    const encodedLocation = encodeURIComponent(address);
    // Check metadata first to avoid paying for non-existent images
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodedLocation}&key=${apiKey}`;

    const metadataResponse = await axios.get(metadataUrl);

    // If status is not OK, no street view exists
    if (metadataResponse.data.status !== "OK") {
      const path = await import("path");
      const fallbackImage = path.resolve(process.cwd(), "streetview.jpeg");
      res.sendFile(fallbackImage);
      return;
    }

    let streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${encodedLocation}&pitch=0&fov=90&source=outdoor&key=${apiKey}`;

    if (heading) {
      streetViewUrl += `&heading=${heading}`;
    }

    // Use axios to fetch image buffer
    const response = await axios.get(streetViewUrl, {
      responseType: "arraybuffer",
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      res
        .status(response.status)
        .json({ error: "Failed to fetch Street View image" });
      return;
    }

    const contentType = response.headers["content-type"];
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    res.setHeader("Cache-Control", "public, max-age=86400");

    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error("Street View proxy error:", error);
    res.status(500).json({ error: "Failed to fetch Street View image" });
  }
};
