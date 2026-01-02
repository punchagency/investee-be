import { propertyStorage } from "../storage/property.storage";

const ATTOM_API_BASE = "https://api.gateway.attomdata.com/propertyapi/v1.0.0";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enrichPropertyWithAttom(
  propertyId: string,
  address: string,
  city: string,
  state: string
): Promise<void> {
  const apiKey = process.env.ATTOM_API_KEY;
  if (!apiKey) {
    await propertyStorage.updateProperty(propertyId, {
      attomStatus: "failed",
      attomError: "ATTOM API key not configured",
    });
    return;
  }

  try {
    const address1 = encodeURIComponent(address);
    const address2 = encodeURIComponent(`${city}, ${state}`);

    const [basicResponse, assessmentResponse, avmResponse] = await Promise.all([
      fetch(
        `${ATTOM_API_BASE}/property/basicprofile?address1=${address1}&address2=${address2}`,
        {
          headers: {
            Accept: "application/json",
            apikey: apiKey,
          },
        }
      ),
      fetch(
        `${ATTOM_API_BASE}/assessment/detail?address1=${address1}&address2=${address2}`,
        {
          headers: {
            Accept: "application/json",
            apikey: apiKey,
          },
        }
      ),
      fetch(
        `${ATTOM_API_BASE}/attomavm/detail?address1=${address1}&address2=${address2}`,
        {
          headers: {
            Accept: "application/json",
            apikey: apiKey,
          },
        }
      ),
    ]);

    if (basicResponse.status === 429) {
      await propertyStorage.updateProperty(propertyId, {
        attomStatus: "rate_limited",
        attomError: "Rate limited - will retry later",
      });
      return;
    }

    if (!basicResponse.ok) {
      await propertyStorage.updateProperty(propertyId, {
        attomStatus: "failed",
        attomError: `API returned ${basicResponse.status}`,
      });
      return;
    }

    const basicData = (await basicResponse.json()) as any;
    const prop = basicData.property?.[0];

    if (!prop) {
      await propertyStorage.updateProperty(propertyId, {
        attomStatus: "failed",
        attomError: "No property data returned",
      });
      return;
    }

    let annualTaxes: number | null = null;
    let attomTaxAmount: number | null = null;
    let attomTaxYear: number | null = null;
    if (assessmentResponse.ok) {
      const assessmentData = (await assessmentResponse.json()) as any;
      const assessment = assessmentData.property?.[0]?.assessment;
      if (assessment?.tax?.taxamt) {
        annualTaxes = Math.round(assessment.tax.taxamt);
        attomTaxAmount = Math.round(assessment.tax.taxamt);
        attomTaxYear = assessment.tax.taxyear || null;
      }
    }

    let attomAvmValue: number | null = null;
    let attomAvmHigh: number | null = null;
    let attomAvmLow: number | null = null;
    let attomAvmConfidence: number | null = null;
    if (avmResponse.ok) {
      const avmData = (await avmResponse.json()) as any;
      const avm = avmData.property?.[0]?.avm?.amount;
      if (avm) {
        attomAvmValue = avm.value || null;
        attomAvmHigh = avm.high || null;
        attomAvmLow = avm.low || null;
        attomAvmConfidence = avm.scr || null;
      }
    }

    await propertyStorage.updateProperty(propertyId, {
      attomStatus: "success",
      attomMarketValue:
        prop.assessment?.market?.mktTotalValue ||
        prop.assessment?.market?.mktTtlValue,
      attomAssessedValue:
        prop.assessment?.assessed?.assdTotalValue ||
        prop.assessment?.assessed?.assdTtlValue,
      attomYearBuilt: prop.summary?.yearBuilt,
      attomBldgSize: prop.building?.size?.bldgSize,
      attomBeds: prop.building?.rooms?.beds,
      attomBaths: prop.building?.rooms?.bathsTotal,
      attomLotSize: prop.lot?.lotSize1,
      attomPropClass: prop.summary?.propClass,
      attomLastSalePrice: prop.sale?.amount?.saleamt,
      attomLastSaleDate: prop.sale?.saleTransDate,
      attomAvmValue,
      attomAvmHigh,
      attomAvmLow,
      attomAvmConfidence,
      attomTaxAmount,
      attomTaxYear,
      annualTaxes: annualTaxes,
      attomData: prop,
      attomSyncedAt: new Date(),
      attomError: null,
    });
  } catch (error) {
    await propertyStorage.updateProperty(propertyId, {
      attomStatus: "failed",
      attomError: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get property details from ATTOM API for AI tool calling
 * Returns formatted data optimized for AI consumption
 */
export async function getPropertyDetailsForAI(
  address: string,
  city: string,
  state: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const apiKey = process.env.ATTOM_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "ATTOM API key not configured",
    };
  }

  try {
    const address1 = encodeURIComponent(address);
    const address2 = encodeURIComponent(`${city}, ${state}`);

    const [basicResponse, assessmentResponse, avmResponse] = await Promise.all([
      fetch(
        `${ATTOM_API_BASE}/property/basicprofile?address1=${address1}&address2=${address2}`,
        {
          headers: {
            Accept: "application/json",
            apikey: apiKey,
          },
        }
      ),
      fetch(
        `${ATTOM_API_BASE}/assessment/detail?address1=${address1}&address2=${address2}`,
        {
          headers: {
            Accept: "application/json",
            apikey: apiKey,
          },
        }
      ),
      fetch(
        `${ATTOM_API_BASE}/attomavm/detail?address1=${address1}&address2=${address2}`,
        {
          headers: {
            Accept: "application/json",
            apikey: apiKey,
          },
        }
      ),
    ]);

    if (basicResponse.status === 429) {
      return {
        success: false,
        error: "Rate limited - please try again later",
      };
    }

    if (!basicResponse.ok) {
      return {
        success: false,
        error: `API returned ${basicResponse.status}`,
      };
    }

    const basicData = (await basicResponse.json()) as any;
    const prop = basicData.property?.[0];

    if (!prop) {
      return {
        success: false,
        error: "No property data found for this address",
      };
    }

    // Parse assessment data
    let annualTaxes: number | null = null;
    let taxYear: number | null = null;
    if (assessmentResponse.ok) {
      const assessmentData = (await assessmentResponse.json()) as any;
      const assessment = assessmentData.property?.[0]?.assessment;
      if (assessment?.tax?.taxamt) {
        annualTaxes = Math.round(assessment.tax.taxamt);
        taxYear = assessment.tax.taxyear || null;
      }
    }

    // Parse AVM data
    let avmValue: number | null = null;
    let avmHigh: number | null = null;
    let avmLow: number | null = null;
    let avmConfidence: number | null = null;
    if (avmResponse.ok) {
      const avmData = (await avmResponse.json()) as any;
      const avm = avmData.property?.[0]?.avm?.amount;
      if (avm) {
        avmValue = avm.value || null;
        avmHigh = avm.high || null;
        avmLow = avm.low || null;
        avmConfidence = avm.scr || null;
      }
    }

    // Format for AI consumption
    return {
      success: true,
      data: {
        address: `${address}, ${city}, ${state}`,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${address}, ${city}, ${state}`
        )}`,
        marketValue:
          prop.assessment?.market?.mktTotalValue ||
          prop.assessment?.market?.mktTtlValue ||
          null,
        assessedValue:
          prop.assessment?.assessed?.assdTotalValue ||
          prop.assessment?.assessed?.assdTtlValue ||
          null,
        avmValue,
        avmRange: avmLow && avmHigh ? `$${avmLow} - $${avmHigh}` : null,
        avmConfidence,
        yearBuilt: prop.summary?.yearBuilt || null,
        bedrooms: prop.building?.rooms?.beds || null,
        bathrooms: prop.building?.rooms?.bathsTotal || null,
        squareFeet: prop.building?.size?.bldgSize || null,
        lotSize: prop.lot?.lotSize1 || null,
        propertyType: prop.summary?.propClass || null,
        lastSalePrice: prop.sale?.amount?.saleamt || null,
        lastSaleDate: prop.sale?.saleTransDate || null,
        annualTaxes,
        taxYear,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export { delay };
