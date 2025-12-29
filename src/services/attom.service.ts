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

    const basicData = await basicResponse.json();
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
      const assessmentData = await assessmentResponse.json();
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
      const avmData = await avmResponse.json();
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

export { delay };
