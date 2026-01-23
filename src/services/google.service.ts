import axios from "axios";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const GOOGLE_MAPS_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  postalCode?: string;
  formattedAddress: string;
}

export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip?: string,
): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    // Construct a robust address string
    let queryAddress = `${address}, ${city}, ${state}`;
    if (zip) queryAddress += ` ${zip}`;

    const response = await axios.get(GOOGLE_MAPS_API_URL, {
      params: {
        address: queryAddress,
        key: apiKey,
      },
    });

    if (response.data.status !== "OK") {
      console.warn(
        `Google Geocoding failed for ${queryAddress}: ${response.data.status} - ${response.data.error_message}`,
      );
      return null;
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    // Extract postal code from address components
    let postalCode = zip;
    if (!postalCode) {
      const zipComponent = result.address_components.find((c: any) =>
        c.types.includes("postal_code"),
      );
      if (zipComponent) {
        postalCode = zipComponent.long_name;
      } else {
        console.warn(
          `[GoogleService] No postal_code found for ${queryAddress}. Components:`,
          JSON.stringify(result.address_components),
        );
      }
    }

    return {
      latitude: location.lat,
      longitude: location.lng,
      postalCode,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

export async function verifyGoogleToken(token: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return null;
  }
}
