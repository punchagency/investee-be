import { Reader } from "@maxmind/geoip2-node";
import path from "path";

const dbPath = path.join(process.cwd(), "GeoLite2-City.mmdb");

async function testGeoIP() {
  try {
    const reader = await Reader.open(dbPath);
    const ip = "41.184.3.95";

    try {
      const response = reader.city(ip);
      console.log(`\nLookup for ${ip}:`);
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log(`\nLookup for ${ip} failed or not found.`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testGeoIP();
