import "dotenv/config";
import { initializeDatabase } from "../src/db";
import { propertyStorage } from "../src/storage/property.storage";
import { enrichPropertyWithRentcast } from "../src/services/rentcast.service";
import { delay } from "../src/services/attom.service";
import { geocodeAddress } from "../src/services/google.service";

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
      let needsUpdate = false;
      const updates: any = {};

      // 1. Try to backfill from existing RentCast JSON data
      if (property.rentcastPropertyData) {
        const data = property.rentcastPropertyData;
        if ((!lat || !lon) && data.latitude && data.longitude) {
          lat = data.latitude;
          lon = data.longitude;
          needsUpdate = true;
        }
        if (!zip && data.zipCode) {
          zip = data.zipCode;
          updates.postalCode = zip;
          needsUpdate = true;
        }
      }

      // 2. Try to backfill from existing Attom JSON data
      if (property.attomData) {
        const data = property.attomData;
        if (
          (!lat || !lon) &&
          data.location?.latitude &&
          data.location?.longitude
        ) {
          lat = parseFloat(data.location.latitude);
          lon = parseFloat(data.location.longitude);
          if (!isNaN(lat) && !isNaN(lon)) {
            needsUpdate = true;
          }
        }
        if (!zip && data.address?.postal1) {
          zip = data.address.postal1;
          updates.postalCode = zip;
          needsUpdate = true;
        }
      }

      // 3. If we found data in JSON, update the DB record directly
      if (needsUpdate) {
        if (lat && lon) {
          updates.latitude = lat;
          updates.longitude = lon;
          updates.location = {
            type: "Point",
            coordinates: [lon, lat],
          };
        }

        console.log(
          `[${
            property.address
          }] Backfilling data (Lat/Lon: ${!!lat}, Zip: ${!!zip})`
        );
        await propertyStorage.updateProperty(property.id, updates);
        updatedCount++;
        continue; // Skip API call if we found data
      }

      // 4. If still missing spatial data OR zip code, call Google Maps API
      if ((!lat || !lon || !zip) && property.city && property.state) {
        console.log(`[${property.address}] Fetching from Google Maps...`);
        try {
          const result = await geocodeAddress(
            property.address,
            property.city,
            property.state,
            property.postalCode || undefined
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
