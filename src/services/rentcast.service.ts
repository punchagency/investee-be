import { propertyStorage } from "../storage/property.storage";

const RENTCAST_API_BASE = "https://api.rentcast.io/v1";

export async function enrichPropertyWithRentcast(
  propertyId: string,
  address: string,
  city: string,
  state: string,
  postalCode?: string | null
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

    const [propertyResponse, valueResponse, rentResponse] = await Promise.all([
      fetch(`${RENTCAST_API_BASE}/properties?address=${encodedAddress}`, {
        headers: { Accept: "application/json", "X-Api-Key": apiKey },
      }),
      fetch(
        `${RENTCAST_API_BASE}/avm/value?address=${encodedAddress}&compCount=10`,
        {
          headers: { Accept: "application/json", "X-Api-Key": apiKey },
        }
      ),
      fetch(
        `${RENTCAST_API_BASE}/avm/rent/long-term?address=${encodedAddress}&compCount=10`,
        {
          headers: { Accept: "application/json", "X-Api-Key": apiKey },
        }
      ),
    ]);

    if (propertyResponse.status === 429) {
      await propertyStorage.updateProperty(propertyId, {
        rentcastStatus: "rate_limited",
        rentcastError: "Rate limited - will retry later",
      });
      return;
    }

    let propertyData: any = null;
    let taxHistory: any = null;
    if (propertyResponse.ok) {
      const propData = await propertyResponse.json();
      if (Array.isArray(propData) && propData.length > 0) {
        propertyData = propData[0];
        taxHistory = propertyData.taxAssessments || null;
      }
    }

    let valueEstimate: number | null = null;
    let valueLow: number | null = null;
    let valueHigh: number | null = null;
    let saleComps: any = null;
    if (valueResponse.ok) {
      const valueData = await valueResponse.json();
      valueEstimate = valueData.price || null;
      valueLow = valueData.priceLow || null;
      valueHigh = valueData.priceHigh || null;
      saleComps = valueData.comparables || null;
    }

    let rentEstimate: number | null = null;
    let rentLow: number | null = null;
    let rentHigh: number | null = null;
    let rentComps: any = null;
    if (rentResponse.ok) {
      const rentData = await rentResponse.json();
      rentEstimate = rentData.rent || null;
      rentLow = rentData.rentRangeLow || null;
      rentHigh = rentData.rentRangeHigh || null;
      rentComps = rentData.comparables || null;
    }

    let marketData: any = null;
    if (postalCode) {
      const marketResponse = await fetch(
        `${RENTCAST_API_BASE}/markets?zipCode=${postalCode}`,
        { headers: { Accept: "application/json", "X-Api-Key": apiKey } }
      );
      if (marketResponse.ok) {
        marketData = await marketResponse.json();
      }
    }

    await propertyStorage.updateProperty(propertyId, {
      rentcastStatus: "success",
      rentcastValueEstimate: valueEstimate,
      rentcastValueLow: valueLow,
      rentcastValueHigh: valueHigh,
      rentcastRentEstimate: rentEstimate,
      rentcastRentLow: rentLow,
      rentcastRentHigh: rentHigh,
      rentcastPropertyData: propertyData,
      rentcastTaxHistory: taxHistory,
      rentcastSaleComps: saleComps,
      rentcastRentComps: rentComps,
      rentcastMarketData: marketData,
      rentcastError: null,
      rentcastSyncedAt: new Date(),
    });
  } catch (error) {
    await propertyStorage.updateProperty(propertyId, {
      rentcastStatus: "failed",
      rentcastError: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
