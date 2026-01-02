import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const vendorData = [
  // General Contractors
  {
    name: "Pacific Coast Builders",
    category: "contractor",
    description: "Full-service general contractor specializing in residential renovations and new construction. Over 15 years of experience in the Los Angeles area.",
    phone: "(310) 555-0101",
    email: "info@pacificcoastbuilders.com",
    website: "https://pacificcoastbuilders.com",
    city: "Los Angeles",
    state: "CA",
    rating: 4.8,
    reviewCount: 127,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 15,
    specialties: ["Kitchen Remodeling", "Bathroom Renovation", "Room Additions", "ADU Construction"],
    serviceAreas: ["Los Angeles", "Santa Monica", "Beverly Hills", "Culver City"],
    priceRange: "$$$",
    availability: "within_week",
    contactName: "Michael Chen"
  },
  {
    name: "Summit Construction Group",
    category: "contractor",
    description: "Premier contractor for luxury home renovations and high-end commercial projects. Known for exceptional craftsmanship and attention to detail.",
    phone: "(323) 555-0102",
    email: "projects@summitcg.com",
    city: "Beverly Hills",
    state: "CA",
    rating: 4.9,
    reviewCount: 89,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 20,
    specialties: ["Luxury Renovations", "Historic Restoration", "Custom Homes"],
    serviceAreas: ["Beverly Hills", "Bel Air", "Holmby Hills", "Pacific Palisades"],
    priceRange: "$$$$",
    availability: "scheduled",
    contactName: "David Sterling"
  },

  // Home Inspectors
  {
    name: "LA Home Inspection Services",
    category: "inspector",
    description: "Certified home inspectors providing comprehensive property inspections for buyers, sellers, and investors. Same-day reports available.",
    phone: "(818) 555-0201",
    email: "inspect@lahomeinspection.com",
    website: "https://lahomeinspection.com",
    city: "Los Angeles",
    state: "CA",
    rating: 4.7,
    reviewCount: 234,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 12,
    specialties: ["Pre-Purchase Inspection", "Pre-Listing Inspection", "Investment Property Analysis"],
    serviceAreas: ["Los Angeles County", "Orange County", "Ventura County"],
    priceRange: "$$",
    availability: "immediate",
    contactName: "Robert Martinez"
  },
  {
    name: "Elite Property Inspections",
    category: "inspector",
    description: "Thorough property inspections with thermal imaging and drone assessments. Specialized in multi-family and commercial properties.",
    phone: "(310) 555-0202",
    email: "info@eliteinspect.com",
    city: "Santa Monica",
    state: "CA",
    rating: 4.6,
    reviewCount: 156,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 8,
    specialties: ["Thermal Imaging", "Drone Inspection", "Commercial Inspection", "Multi-Family"],
    serviceAreas: ["Los Angeles", "Santa Monica", "Malibu", "Venice"],
    priceRange: "$$$",
    availability: "within_week",
    contactName: "Jennifer Walsh"
  },

  // Appraisers
  {
    name: "Golden State Appraisal Group",
    category: "appraiser",
    description: "Licensed real estate appraisers providing accurate valuations for residential and commercial properties. FHA and VA approved.",
    phone: "(213) 555-0301",
    email: "appraisals@goldenstaterealty.com",
    city: "Los Angeles",
    state: "CA",
    rating: 4.5,
    reviewCount: 89,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 18,
    specialties: ["Residential Appraisal", "Commercial Appraisal", "FHA Appraisal", "Investment Analysis"],
    serviceAreas: ["Los Angeles County", "Orange County"],
    priceRange: "$$",
    availability: "within_week",
    contactName: "Thomas Greene"
  },

  // Real Estate Attorneys
  {
    name: "Pacific Legal Partners",
    category: "attorney",
    description: "Real estate attorneys specializing in transactions, disputes, and landlord-tenant law. Experienced with investment properties and 1031 exchanges.",
    phone: "(310) 555-0401",
    email: "info@pacificlegalpartners.com",
    website: "https://pacificlegalpartners.com",
    city: "Century City",
    state: "CA",
    rating: 4.8,
    reviewCount: 67,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 25,
    specialties: ["Real Estate Transactions", "1031 Exchanges", "Landlord-Tenant", "Title Issues"],
    serviceAreas: ["Los Angeles", "Orange County", "San Diego"],
    priceRange: "$$$",
    availability: "within_week",
    contactName: "Sarah Mitchell"
  },

  // Title Companies
  {
    name: "First American Title LA",
    category: "title",
    description: "Full-service title and escrow company with locations throughout Los Angeles. Fast closings and excellent customer service.",
    phone: "(323) 555-0501",
    email: "la@firstam.com",
    website: "https://firstam.com",
    city: "Los Angeles",
    state: "CA",
    rating: 4.4,
    reviewCount: 312,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 35,
    specialties: ["Title Insurance", "Escrow Services", "1031 Exchanges", "Commercial Closings"],
    serviceAreas: ["Los Angeles County", "Ventura County", "San Bernardino County"],
    priceRange: "$$",
    availability: "immediate",
    contactName: "Mark Thompson"
  },

  // Insurance Agents
  {
    name: "Westside Insurance Group",
    category: "insurance",
    description: "Independent insurance agency specializing in property and landlord insurance. Competitive rates for investment properties.",
    phone: "(310) 555-0601",
    email: "quotes@westsideinsurance.com",
    city: "West Los Angeles",
    state: "CA",
    rating: 4.6,
    reviewCount: 178,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 22,
    specialties: ["Landlord Insurance", "Property Insurance", "Umbrella Policies", "Investment Property"],
    serviceAreas: ["Los Angeles", "Santa Monica", "Culver City", "Marina del Rey"],
    priceRange: "$$",
    availability: "immediate",
    contactName: "Linda Park"
  },

  // Property Managers
  {
    name: "LA Property Management Co.",
    category: "property_manager",
    description: "Full-service property management for residential and commercial properties. Tenant screening, rent collection, and maintenance coordination.",
    phone: "(323) 555-0701",
    email: "manage@lapmco.com",
    website: "https://lapmco.com",
    city: "Los Angeles",
    state: "CA",
    rating: 4.3,
    reviewCount: 145,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 14,
    specialties: ["Single Family", "Multi-Family", "Commercial", "HOA Management"],
    serviceAreas: ["Los Angeles", "Pasadena", "Glendale", "Burbank"],
    priceRange: "$$",
    availability: "immediate",
    contactName: "Carlos Rodriguez"
  },

  // Plumbers
  {
    name: "Quick Flow Plumbing",
    category: "plumber",
    description: "24/7 emergency plumbing services. Specializing in residential repairs, water heater installation, and sewer line replacement.",
    phone: "(818) 555-0801",
    email: "service@quickflowplumbing.com",
    city: "North Hollywood",
    state: "CA",
    rating: 4.7,
    reviewCount: 267,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 10,
    specialties: ["Emergency Repairs", "Water Heaters", "Sewer Lines", "Repiping"],
    serviceAreas: ["Los Angeles", "San Fernando Valley", "Hollywood", "Glendale"],
    priceRange: "$$",
    availability: "immediate",
    contactName: "Tony Vasquez"
  },

  // Electricians
  {
    name: "Bright Spark Electric",
    category: "electrician",
    description: "Licensed electricians for residential and commercial projects. Panel upgrades, EV charger installation, and smart home wiring.",
    phone: "(310) 555-0901",
    email: "info@brightsparkelectric.com",
    city: "Culver City",
    state: "CA",
    rating: 4.8,
    reviewCount: 189,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 16,
    specialties: ["Panel Upgrades", "EV Chargers", "Smart Home", "Commercial Wiring"],
    serviceAreas: ["Los Angeles", "Culver City", "Santa Monica", "Venice"],
    priceRange: "$$$",
    availability: "within_week",
    contactName: "James Wilson"
  },

  // HVAC
  {
    name: "Cool Breeze HVAC",
    category: "hvac",
    description: "Heating, ventilation, and air conditioning installation and repair. Energy-efficient solutions and preventative maintenance programs.",
    phone: "(323) 555-1001",
    email: "service@coolbreezehvac.com",
    city: "Los Angeles",
    state: "CA",
    rating: 4.5,
    reviewCount: 134,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 12,
    specialties: ["AC Installation", "Heating Repair", "Duct Cleaning", "Mini-Split Systems"],
    serviceAreas: ["Los Angeles County"],
    priceRange: "$$",
    availability: "immediate",
    contactName: "Kevin Chang"
  },

  // Roofing
  {
    name: "Reliable Roofing LA",
    category: "roofing",
    description: "Complete roofing services including repairs, replacements, and new installations. Experienced with all roofing types.",
    phone: "(818) 555-1101",
    email: "estimate@reliableroofingla.com",
    website: "https://reliableroofingla.com",
    city: "Van Nuys",
    state: "CA",
    rating: 4.6,
    reviewCount: 98,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 20,
    specialties: ["Tile Roofing", "Shingle Roofing", "Flat Roofs", "Roof Repairs"],
    serviceAreas: ["Los Angeles", "San Fernando Valley", "Ventura County"],
    priceRange: "$$$",
    availability: "within_week",
    contactName: "Miguel Santos"
  },

  // Handyman
  {
    name: "Fix-It Pro Handyman",
    category: "handyman",
    description: "Reliable handyman services for all your home repair needs. Drywall, painting, carpentry, and general maintenance.",
    phone: "(213) 555-1201",
    email: "jobs@fixitprohandyman.com",
    city: "Los Angeles",
    state: "CA",
    rating: 4.4,
    reviewCount: 223,
    verified: true,
    licensed: false,
    insured: true,
    yearsInBusiness: 7,
    specialties: ["Drywall Repair", "Painting", "Carpentry", "General Repairs"],
    serviceAreas: ["Los Angeles", "Hollywood", "Silver Lake", "Echo Park"],
    priceRange: "$",
    availability: "immediate",
    contactName: "Steve Johnson"
  },

  // Landscaping
  {
    name: "Green Thumb Landscaping",
    category: "landscaping",
    description: "Professional landscaping design and maintenance. Drought-tolerant gardens, hardscaping, and irrigation systems.",
    phone: "(310) 555-1301",
    email: "design@greenthumbla.com",
    website: "https://greenthumbla.com",
    city: "Santa Monica",
    state: "CA",
    rating: 4.7,
    reviewCount: 156,
    verified: true,
    licensed: true,
    insured: true,
    yearsInBusiness: 11,
    specialties: ["Landscape Design", "Drought-Tolerant", "Hardscaping", "Irrigation"],
    serviceAreas: ["Santa Monica", "Venice", "Pacific Palisades", "Malibu"],
    priceRange: "$$$",
    availability: "within_week",
    contactName: "Maria Garcia"
  },

  // Cleaning Services
  {
    name: "Sparkle Clean Services",
    category: "cleaning",
    description: "Professional cleaning for residential and commercial properties. Move-in/move-out cleaning, deep cleaning, and regular maintenance.",
    phone: "(323) 555-1401",
    email: "book@sparklecleanla.com",
    city: "Los Angeles",
    state: "CA",
    rating: 4.5,
    reviewCount: 342,
    verified: true,
    licensed: false,
    insured: true,
    yearsInBusiness: 8,
    specialties: ["Move-In/Out Cleaning", "Deep Cleaning", "Regular Maintenance", "Post-Construction"],
    serviceAreas: ["Los Angeles", "Pasadena", "Glendale", "Burbank", "Hollywood"],
    priceRange: "$",
    availability: "immediate",
    contactName: "Ana Lopez"
  },
];

async function seedVendors() {
  const client = await pool.connect();

  try {
    // Create the vendors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        rating NUMERIC,
        review_count INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT false,
        licensed BOOLEAN DEFAULT false,
        insured BOOLEAN DEFAULT false,
        years_in_business INTEGER,
        specialties JSONB DEFAULT '[]'::jsonb,
        service_areas JSONB DEFAULT '[]'::jsonb,
        price_range TEXT,
        availability TEXT,
        contact_name TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("Created vendors table");

    // Clear existing vendors
    await client.query("DELETE FROM vendors");
    console.log("Cleared existing vendors");

    // Insert vendors
    let inserted = 0;
    for (const vendor of vendorData) {
      await client.query(
        `INSERT INTO vendors (
          name, category, description, phone, email, website, city, state,
          rating, review_count, verified, licensed, insured, years_in_business,
          specialties, service_areas, price_range, availability, contact_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          vendor.name,
          vendor.category,
          vendor.description,
          vendor.phone,
          vendor.email,
          vendor.website || null,
          vendor.city,
          vendor.state,
          vendor.rating,
          vendor.reviewCount,
          vendor.verified,
          vendor.licensed,
          vendor.insured,
          vendor.yearsInBusiness,
          JSON.stringify(vendor.specialties),
          JSON.stringify(vendor.serviceAreas),
          vendor.priceRange,
          vendor.availability,
          vendor.contactName,
        ]
      );
      inserted++;
    }

    console.log(`Successfully seeded ${inserted} vendors`);

    // Verify import
    const result = await client.query("SELECT COUNT(*) FROM vendors");
    console.log(`Total vendors in database: ${result.rows[0].count}`);

  } catch (error) {
    console.error("Error seeding vendors:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedVendors();
