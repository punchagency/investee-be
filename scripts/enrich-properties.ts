import "dotenv/config";
import { initializeDatabase } from "../src/db";
import { propertyStorage } from "../src/storage/property.storage";
import { geocodeAddress } from "../src/services/google.service";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runEnrichment() {
  await initializeDatabase();
  console.log("Database initialized. Starting enrichment with Google Maps...");

  let offset = 0;
  const LIMIT = 100;
  let hasMore = true;

  let updatedCount = 0;
  let apiCallsCount = 0;

  while (hasMore) {
    console.log(`Fetching batch... Offset: ${offset}`);
    const [allProperties, total] = await propertyStorage.getAllProperties({
      limit: LIMIT,
      offset: offset,
      orderBy: "createdAt", // Ensure consistent order
      orderDirection: "ASC",
    });

    if (offset === 0) {
      console.log(`Found total ${total} properties.`);
    }

    if (allProperties.length === 0) {
      hasMore = false;
      break;
    }

    for (const property of allProperties) {
      let lat = property.latitude;
      let lon = property.longitude;
      let zip = property.postalCode;

      // If still missing spatial data OR zip code, call Google Maps API
      if ((!lat || !lon || !zip) && property.city && property.state) {
        console.log(`[${property.address}] Fetching from Google Maps...`);
        try {
          const result = await geocodeAddress(
            property.address,
            property.city,
            property.state,
            property.postalCode || undefined,
          );

          if (result) {
            const googleUpdates: any = {};
            if (result.latitude && result.longitude) {
              googleUpdates.latitude = result.latitude;
              googleUpdates.longitude = result.longitude;
              googleUpdates.location = {
                type: "Point",
                coordinates: [result.longitude, result.latitude],
              };
            }
            if (result.postalCode && !zip) {
              googleUpdates.postalCode = result.postalCode;
            }

            if (Object.keys(googleUpdates).length > 0) {
              await propertyStorage.updateProperty(property.id, googleUpdates);
              updatedCount++;
              apiCallsCount++;
              console.log(`[${property.address}] Enriched with Google Maps.`);
            }
          }

          // Respect rate limits (50 QPS is default, but let's be safe)
          await delay(100);
        } catch (err) {
          console.error(`[${property.address}] Failed to enrich:`, err);
        }
      }
    }

    offset += LIMIT;
  }

  console.log(`Enrichment complete.`);
  console.log(`Updated properties: ${updatedCount}`);
  console.log(`API calls made: ${apiCallsCount}`);
  process.exit(0);
}

runEnrichment().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
