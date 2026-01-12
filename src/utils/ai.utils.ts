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
        "ENRICHMENT ONLY. Get details for a specific property that you have ALREADY found in the local database. WARNING: DO NOT use this tool to search for properties. Only use it to get more details on a known address.",
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
        "ENRICHMENT ONLY. Get value estimate for a property ALREADY found in the database. DO NOT use for search.",
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
        "ENRICHMENT ONLY. Get rent estimate for a property ALREADY found in the database. DO NOT use for search.",
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
            description:
              "Broad search term. Use this for ANY location, address, or name if you are not 100% sure it is a specific City/State field.",
          },
          city: {
            type: "string",
            description:
              "City name. Use ONLY if user explicitly defines the city.",
          },
          state: {
            type: "string",
            description:
              "State abbreviation (e.g., 'CA'). Use ONLY if explicitly defined.",
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
          limit: {
            type: "number",
            description: "Number of properties to return (default 5)",
          },
          offset: {
            type: "number",
            description: "Number of properties to skip (default 0)",
          },
          orderBy: {
            type: "string",
            enum: ["estValue", "createdAt", "beds", "baths", "sqFt"],
            description: "Field to sort by (default: createdAt)",
          },
          orderDirection: {
            type: "string",
            enum: ["ASC", "DESC"],
            description: "Sort direction (default: DESC)",
          },
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
        // getAllProperties returns [properties, count]
        const [properties] = await propertyStorage.getAllProperties({
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
          limit: args.limit || 5,
          offset: args.offset,
          skipCount: true,
          orderBy: args.orderBy,
          orderDirection: args.orderDirection,
          select: [
            "id",
            "address",
            "city",
            "state",
            "postalCode",
            "estValue",
            "beds",
            "baths",
            "sqFt",
            "propertyType",
            "owner",
          ],
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
          propertyUrl: `${
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
