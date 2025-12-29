import type { Request, Response } from "express";

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

  const { address, size = "400x300" } = req.query;
  if (!address || typeof address !== "string") {
    res.status(400).json({ error: "Address is required" });
    return;
  }

  try {
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${encodeURIComponent(
      address
    )}&pitch=0&fov=90&source=outdoor&key=${apiKey}`;
    const response = await fetch(streetViewUrl);

    if (!response.ok) {
      res
        .status(response.status)
        .json({ error: "Failed to fetch Street View image" });
      return;
    }

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    res.setHeader("Cache-Control", "public, max-age=86400");

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Street View proxy error:", error);
    res.status(500).json({ error: "Failed to fetch Street View image" });
  }
};
