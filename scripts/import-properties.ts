import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

import propertyData from "./properties.json";

async function importProperties() {
  const client = await pool.connect();

  try {
    // Create the properties table
    await client.query(`DROP TABLE IF EXISTS properties;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_type TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        sq_ft NUMERIC,
        beds NUMERIC,
        baths NUMERIC,
        est_value NUMERIC,
        est_equity NUMERIC,
        owner TEXT,
        owner_occupied BOOLEAN,
        listed_for_sale BOOLEAN,
        foreclosure BOOLEAN,
        attom_status TEXT DEFAULT 'pending',
        attom_market_value NUMERIC,
        attom_assessed_value NUMERIC,
        attom_year_built INTEGER,
        attom_bldg_size NUMERIC,
        attom_beds NUMERIC,
        attom_baths NUMERIC,
        attom_lot_size NUMERIC,
        attom_prop_class TEXT,
        attom_last_sale_price NUMERIC,
        attom_last_sale_date TEXT,
        attom_data JSONB,
        attom_error TEXT,
        attom_avm_value NUMERIC,
        attom_avm_high NUMERIC,
        attom_avm_low NUMERIC,
        attom_avm_confidence NUMERIC,
        attom_tax_amount NUMERIC,
        attom_tax_year INTEGER,
        annual_taxes NUMERIC,
        annual_insurance NUMERIC,
        monthly_hoa NUMERIC,
        attom_synced_at TIMESTAMP,
        rentcast_status TEXT DEFAULT 'pending',
        rentcast_value_estimate NUMERIC,
        rentcast_value_low NUMERIC,
        rentcast_value_high NUMERIC,
        rentcast_rent_estimate NUMERIC,
        rentcast_rent_low NUMERIC,
        rentcast_rent_high NUMERIC,
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

    // Insert properties
    let inserted = 0;
    for (const prop of propertyData) {
      await client.query(
        `INSERT INTO properties (property_type, address, city, state, sq_ft, beds, baths, est_value, est_equity, owner, owner_occupied, listed_for_sale, foreclosure)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          prop.type,
          prop.address,
          prop.city,
          prop.state,
          prop.sqFt,
          prop.beds,
          prop.baths,
          prop.estValue,
          prop.estEquity,
          prop.owner,
          prop.ownerOccupied,
          prop.listedForSale,
          prop.foreclosure,
        ]
      );
      inserted++;
    }

    console.log(`Successfully imported ${inserted} properties`);

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
