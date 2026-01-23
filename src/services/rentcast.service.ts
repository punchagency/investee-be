import axios from "axios";
import { propertyStorage } from "../storage/property.storage";

const RENTCAST_API_BASE = "https://api.rentcast.io/v1";

/**
 * Generate Google Maps URL for an address
 */
function generateGoogleMapsUrl(
  address: string,
  city?: string,
  state?: string,
): string {
  const fullAddress = city && state ? `${address}, ${city}, ${state}` : address;
  const encoded = encodeURIComponent(fullAddress);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

export async function enrichPropertyWithRentcast(
  propertyId: string,
  address: string,
  city: string,
  state: string,
  postalCode?: string | null,
): Promise<void> {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    await propertyStorage.updateProperty(propertyId, {
      rentcastStatus: "failed",
      rentcastError: "RentCast API key not configured",
    });
    return;
  }

  try {
    const fullAddress = `${address}, ${city}, ${state}${
      postalCode ? ` ${postalCode}` : ""
    }`;
    const encodedAddress = encodeURIComponent(fullAddress);

    const requestConfig = {
      headers: { Accept: "application/json", "X-Api-Key": apiKey },
      validateStatus: () => true,
    };

    const [propertyResponse, valueResponse, rentResponse] = await Promise.all([
      axios.get(
        `${RENTCAST_API_BASE}/properties?address=${encodedAddress}`,
        requestConfig,
      ),
      axios.get(
        `${RENTCAST_API_BASE}/avm/value?address=${encodedAddress}&compCount=0`,
        requestConfig,
      ),
      axios.get(
        `${RENTCAST_API_BASE}/avm/rent/long-term?address=${encodedAddress}&compCount=0`,
        requestConfig,
      ),
    ]);

    if (propertyResponse.status === 429) {
      await propertyStorage.updateProperty(propertyId, {
        rentcastStatus: "rate_limited",
        rentcastError: "Rate limited - will retry later",
      });
      return;
    }

    let latitude: number | null = null;
    let longitude: number | null = null;
    let zip: string | null = null;
    let annualTaxes: number | null = null;

    if (propertyResponse.status === 200) {
      const propData = propertyResponse.data;
      if (Array.isArray(propData) && propData.length > 0) {
        const propertyData = propData[0];
        latitude = propertyData.latitude || null;
        longitude = propertyData.longitude || null;
        zip = propertyData.zipCode || null;

        if (propertyData.taxAssessments) {
          const assessments = propertyData.taxAssessments;
          const entries = Object.values(assessments) as any[];
          if (entries.length > 0) {
            const sorted = entries.sort(
              (a, b) => (b.year || 0) - (a.year || 0),
            );
            if (sorted.length > 0 && sorted[0].taxAmount) {
              annualTaxes = sorted[0].taxAmount;
            }
          }
        }
      }
    }

    let valueEstimate: number | null = null;
    let valueLow: number | null = null;
    let valueHigh: number | null = null;
    if (valueResponse.status === 200) {
      const valueData: any = valueResponse.data;
      valueEstimate = valueData.price || null;
      valueLow = valueData.priceLow || null;
      valueHigh = valueData.priceHigh || null;
    }

    let rentEstimate: number | null = null;
    let rentLow: number | null = null;
    let rentHigh: number | null = null;
    if (rentResponse.status === 200) {
      const rentData: any = rentResponse.data;
      rentEstimate = rentData.rent || null;
      rentLow = rentData.rentRangeLow || null;
      rentHigh = rentData.rentRangeHigh || null;
    }

    const updates: any = {
      rentcastStatus: "success",
      rentcastValueEstimate: valueEstimate,
      rentcastValueLow: valueLow,
      rentcastValueHigh: valueHigh,
      rentcastRentEstimate: rentEstimate,
      rentcastRentLow: rentLow,
      rentcastRentHigh: rentHigh,
      annualTaxes: annualTaxes,

      rentcastError: null,
      rentcastSyncedAt: new Date(),
    };

    if (zip) {
      updates.postalCode = zip;
    }

    if (latitude && longitude) {
      updates.latitude = latitude;
      updates.longitude = longitude;
      updates.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    await propertyStorage.updateProperty(propertyId, updates);
  } catch (error) {
    await propertyStorage.updateProperty(propertyId, {
      rentcastStatus: "failed",
      rentcastError: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get property value estimate from RentCast API for AI tool calling
 * Returns formatted AVM data optimized for AI consumption
 */
export async function getPropertyValueForAI(
  address: string,
  city: string,
  state: string,
  postalCode?: string,
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "RentCast API key not configured",
    };
  }

  try {
    const fullAddress = `${address}, ${city}, ${state}${
      postalCode ? ` ${postalCode}` : ""
    }`;
    const encodedAddress = encodeURIComponent(fullAddress);

    const response = await axios.get(
      `${RENTCAST_API_BASE}/avm/value?address=${encodedAddress}&compCount=10`,
      {
        headers: { Accept: "application/json", "X-Api-Key": apiKey },
        validateStatus: () => true,
      },
    );

    if (response.status === 429) {
      return {
        success: false,
        error: "Rate limited - please try again later",
      };
    }

    if (response.status !== 200) {
      return {
        success: false,
        error: `API returned ${response.status}`,
      };
    }

    const data = response.data as any;

    return {
      success: true,
      data: {
        address: fullAddress,
        propertyUrl: generateGoogleMapsUrl(address, city, state),
        estimatedValue: data.price || null,
        valueLow: data.priceLow || null,
        valueHigh: data.priceHigh || null,
        valueRange:
          data.priceLow && data.priceHigh
            ? `$${data.priceLow.toLocaleString()} - $${data.priceHigh.toLocaleString()}`
            : null,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get rent estimate from RentCast API for AI tool calling
 * Returns formatted rental data optimized for AI consumption
 */
export async function getRentEstimateForAI(
  address: string,
  city: string,
  state: string,
  postalCode?: string,
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "RentCast API key not configured",
    };
  }

  try {
    const fullAddress = `${address}, ${city}, ${state}${
      postalCode ? ` ${postalCode}` : ""
    }`;
    const encodedAddress = encodeURIComponent(fullAddress);

    const response = await axios.get(
      `${RENTCAST_API_BASE}/avm/rent/long-term?address=${encodedAddress}&compCount=10`,
      {
        headers: { Accept: "application/json", "X-Api-Key": apiKey },
        validateStatus: () => true,
      },
    );

    if (response.status === 429) {
      return {
        success: false,
        error: "Rate limited - please try again later",
      };
    }

    if (response.status !== 200) {
      return {
        success: false,
        error: `API returned ${response.status}`,
      };
    }

    const data = response.data as any;

    return {
      success: true,
      data: {
        address: fullAddress,
        propertyUrl: generateGoogleMapsUrl(address, city, state),
        estimatedRent: data.rent || null,
        rentLow: data.rentRangeLow || null,
        rentHigh: data.rentRangeHigh || null,
        rentRange:
          data.rentRangeLow && data.rentRangeHigh
            ? `$${data.rentRangeLow.toLocaleString()} - $${data.rentRangeHigh.toLocaleString()}`
            : null,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get market overview for a ZIP code area
 */
export async function getMarketOverviewForAI(zipCode: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey)
    return { success: false, error: "RentCast API key not configured" };

  try {
    const response = await axios.get(
      `${RENTCAST_API_BASE}/markets/sale/stats?zipCode=${zipCode}&historyRange=12`,
      {
        headers: { Accept: "application/json", "X-Api-Key": apiKey },
        validateStatus: () => true,
      },
    );

    if (response.status !== 200) {
      return { success: false, error: `API returned ${response.status}` };
    }

    const data = response.data as any;

    return {
      success: true,
      data: {
        zipCode,
        averagePrice: data.averagePrice,
        medianPrice: data.medianPrice,
        averagePricePerSqFt: data.averagePricePerSqFt,
        totalListings: data.totalListings,
        daysOnMarket: data.averageDaysOnMarket,
        trend: "Data reflects market averages over the last 12 months",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
