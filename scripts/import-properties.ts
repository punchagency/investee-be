import pg from "pg";
import "dotenv/config";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importProperties() {
  const client = await pool.connect();

  try {
    // Create the properties table
    console.log("Recreating properties table...");
    await client.query(`DROP TABLE IF EXISTS properties CASCADE;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_type TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        sq_ft INTEGER,
        beds INTEGER,
        baths REAL,
        est_value INTEGER,
        est_equity INTEGER,
        owner TEXT,
        owner_occupied TEXT,
        listed_for_sale TEXT,
        foreclosure TEXT,
        attom_status TEXT DEFAULT 'pending',
        attom_market_value INTEGER,
        attom_assessed_value INTEGER,
        attom_year_built INTEGER,
        attom_bldg_size INTEGER,
        attom_beds INTEGER,
        attom_baths REAL,
        attom_lot_size REAL,
        attom_prop_class TEXT,
        attom_last_sale_price INTEGER,
        attom_last_sale_date TEXT,
        attom_data JSONB,
        attom_error TEXT,
        attom_avm_value INTEGER,
        attom_avm_high INTEGER,
        attom_avm_low INTEGER,
        attom_avm_confidence INTEGER,
        attom_tax_amount INTEGER,
        attom_tax_year INTEGER,
        annual_taxes INTEGER,
        annual_insurance INTEGER,
        monthly_hoa INTEGER,
        attom_synced_at TIMESTAMP,
        rentcast_status TEXT DEFAULT 'pending',
        rentcast_value_estimate INTEGER,
        rentcast_value_low INTEGER,
        rentcast_value_high INTEGER,
        rentcast_rent_estimate INTEGER,
        rentcast_rent_low INTEGER,
        rentcast_rent_high INTEGER,
        rentcast_property_data JSONB,
        rentcast_tax_history JSONB,
        rentcast_sale_comps JSONB,
        rentcast_rent_comps JSONB,
        rentcast_market_data JSONB,
        rentcast_error TEXT,
        rentcast_synced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("Created properties table");

    const seedDir = path.join(__dirname, "seed-data");
    const files = fs
      .readdirSync(seedDir)
      .filter((file) => file.endsWith(".xlsx"));

    if (files.length === 0) {
      console.warn("No .xlsx files found in scripts/seed-data");
      return;
    }

    let totalInserted = 0;

    for (const file of files) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(seedDir, file);
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(sheet);

      console.log(`Found ${data.length} records in ${file}`);

      for (const row of data) {
        // Map Excel headers to DB columns
        const propertyType = row["Type"];
        const address = row["Address"];
        const city = row["City"];
        const state = row["State"];
        const sqFt = row["Sq Ft"];
        const beds = row["Beds"];
        const baths = row["Baths"];
        const estValue = row["Est Value"];
        const estEquity = row["Est Equity $"];
        const owner = row["Owner"];
        // Convert booleans/strings to "Yes"/"No" strings to match Entity text type
        const ownerOccupied =
          row["Owner Occ?"] === "Yes" || row["Owner Occ?"] === true
            ? "Yes"
            : "No";
        const listedForSale =
          row["Listed for Sale?"] === "Yes" || row["Listed for Sale?"] === true
            ? "Yes"
            : "No";
        const foreclosure =
          row["Foreclosure?"] === "Yes" || row["Foreclosure?"] === true
            ? "Yes"
            : "No";

        if (!address) {
          console.warn(`Skipping row with missing address in ${file}`);
          continue;
        }

        await client.query(
          `INSERT INTO properties (
            property_type, address, city, state, sq_ft, beds, baths, 
            est_value, est_equity, owner, owner_occupied, listed_for_sale, foreclosure
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            propertyType,
            address,
            city,
            state,
            sqFt,
            beds,
            baths,
            estValue,
            estEquity,
            owner,
            ownerOccupied,
            listedForSale,
            foreclosure,
          ]
        );
        totalInserted++;
      }
    }

    console.log(
      `Successfully imported total ${totalInserted} properties from ${files.length} files`
    );

    // Verify import
    const result = await client.query("SELECT COUNT(*) FROM properties");
    console.log(`Total properties in database: ${result.rows[0].count}`);
  } catch (error) {
    console.error("Error importing properties:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importProperties();
