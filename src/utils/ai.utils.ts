import { getPropertyDetailsForAI } from "../services/attom.service";
import {
  getPropertyValueForAI,
  getRentEstimateForAI,
} from "../services/rentcast.service";
import { propertyStorage } from "../storage/property.storage";

/**
 * Tool definitions for AI agent
 */
export const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_property_details_attom",
      description:
        "Get comprehensive property details from ATTOM API including market value, assessed value, property characteristics, and sale history. Use this for general property information.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Street address (e.g., '123 Main St')",
          },
          city: { type: "string", description: "City name (e.g., 'Austin')" },
          state: {
            type: "string",
            description: "State abbreviation (e.g., 'TX', 'CA')",
          },
        },
        required: ["address", "city", "state"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_property_value_estimate",
      description:
        "Get automated valuation model (AVM) estimate and comparable sales from RentCast. Use this for property value analysis and market comparisons.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Street address (e.g., '123 Main St')",
          },
          city: { type: "string", description: "City name (e.g., 'Austin')" },
          state: {
            type: "string",
            description: "State abbreviation (e.g., 'TX', 'CA')",
          },
          postalCode: {
            type: "string",
            description: "ZIP code (optional, improves accuracy)",
          },
        },
        required: ["address", "city", "state"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_rent_estimate",
      description:
        "Get rental income estimate and comparable rentals from RentCast for investment property analysis. Use this for DSCR calculations and rental income projections.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Street address (e.g., '123 Main St')",
          },
          city: { type: "string", description: "City name (e.g., 'Austin')" },
          state: {
            type: "string",
            description: "State abbreviation (e.g., 'TX', 'CA')",
          },
          postalCode: {
            type: "string",
            description: "ZIP code (optional, improves accuracy)",
          },
        },
        required: ["address", "city", "state"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_local_properties",
      description:
        "Search for properties within the Investee marketplace/database. Use this to find available properties by city, state, or general query.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "General search term (address or partial city)",
          },
          city: {
            type: "string",
            description: "City name (e.g., 'Los Angeles')",
          },
          state: {
            type: "string",
            description: "State abbreviation (e.g., 'CA')",
          },
          zipCode: { type: "string", description: "ZIP / Postal code" },
          minPrice: { type: "number", description: "Minimum price" },
          maxPrice: { type: "number", description: "Maximum price" },
          minBeds: { type: "number", description: "Minimum bedrooms" },
          maxBeds: { type: "number", description: "Maximum bedrooms" },
          minBaths: { type: "number", description: "Minimum bathrooms" },
          maxBaths: { type: "number", description: "Maximum bathrooms" },
          minSqFt: { type: "number", description: "Minimum square footage" },
          maxSqFt: { type: "number", description: "Maximum square footage" },
        },
        required: [],
      },
    },
  },
];

/**
 * Execute a tool call
 */
export async function executeTool(
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  try {
    switch (toolName) {
      case "get_property_details_attom": {
        const result = await getPropertyDetailsForAI(
          args.address,
          args.city,
          args.state
        );
        return result.success
          ? result.data
          : { error: result.error || "Failed to fetch property details" };
      }

      case "get_property_value_estimate": {
        const result = await getPropertyValueForAI(
          args.address,
          args.city,
          args.state,
          args.postalCode
        );
        return result.success
          ? result.data
          : { error: result.error || "Failed to fetch property value" };
      }

      case "get_rent_estimate": {
        const result = await getRentEstimateForAI(
          args.address,
          args.city,
          args.state,
          args.postalCode
        );
        return result.success
          ? result.data
          : { error: result.error || "Failed to fetch rent estimate" };
      }

      case "search_local_properties": {
        const properties = await propertyStorage.searchProperties({
          query: args.query,
          city: args.city,
          state: args.state,
          zipCode: args.zipCode,
          minPrice: args.minPrice,
          maxPrice: args.maxPrice,
          minBeds: args.minBeds,
          maxBeds: args.maxBeds,
          minBaths: args.minBaths,
          maxBaths: args.maxBaths,
          minSqFt: args.minSqFt,
          maxSqFt: args.maxSqFt,
        });

        if (properties.length === 0) {
          return {
            message:
              "No properties found in the Investee marketplace matching your criteria.",
          };
        }

        return properties.map((p) => ({
          id: p.id,
          address: p.address,
          city: p.city,
          state: p.state,
          zip: p.postalCode,
          price: p.estValue,
          beds: p.beds,
          baths: p.baths,
          sqft: p.sqFt,
          type: p.propertyType,
          owner: p.owner, // Expose owner info from local DB
          mapUrl: `${
            process.env.FRONTEND_URL
              ? `${process.env.FRONTEND_URL}/property/${p.id}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${p.address}, ${p.city}, ${p.state}`
                )}`
          }`,
        }));
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : `Failed to execute tool: ${toolName}`,
    };
  }
}
