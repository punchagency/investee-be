import { propertyStorage } from "../storage/property.storage";
import { VendorStorage } from "../storage/vendor.storage";
import { ragService } from "../services/rag.service";

/**
 * Tool definitions for AI agent
 */
export const AI_TOOLS = [
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
          propertyType: {
            type: "string",
            enum: [
              "SFR",
              "MFR",
              "CND",
              "APT",
              "COM",
              "IND",
              "LND",
              "RES",
              "OTH",
              "REC",
              "UNK",
              "AGR",
            ],
            description:
              "Property Type Code. Map user request to code: Single Family->SFR, Multi-Family->MFR, Condo->CND, Apartment->APT, Commercial->COM, Industrial->IND, Land->LND, Residential->RES, Recreational->REC, Agricultural->AGR, Other->OTH, Unknown->UNK",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_knowledge_base",
      description:
        "Search the internal knowledge base for documents, guidelines, policies, and specific questions (e.g., 'LTV limits', 'appraisal requirements'). Use this when the user asks a question about rules, limits, or 'how to'.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The specific question or topic to search for (e.g., 'commercial property LTV limits').",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_vendors",
      description:
        "Search for service providers and vendors (e.g., plumbers, electricians, inspectors) in the Investee network. Filter by location, category, rating, and verification status.",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description:
              "General search term for name or description (e.g., 'contractor', 'roof repair').",
          },
          category: {
            type: "string",
            description:
              "Specific vendor category (e.g., 'Plumber', 'Electrician'). must be in all lowercase",
          },
          city: {
            type: "string",
            description: "City name.",
          },
          state: {
            type: "string",
            description: "State abbreviation (e.g., 'TX').",
          },
          verified: {
            type: "boolean",
            description: "Filter for verified vendors only.",
          },
          minRating: {
            type: "number",
            description: "Minimum rating (0-5).",
          },
          price: {
            type: "integer",
            enum: [1, 2, 3, 4],
            description: "Price range indicator. 1=$, 2=$$, 3=$$$, 4=$$$$",
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
  args: Record<string, any>,
): Promise<any> {
  try {
    switch (toolName) {
      case "search_local_properties": {
        // getAllProperties returns [properties, count]
        const [properties] = await propertyStorage.getAllProperties({
          query: args.query,
          city: args.city,
          state: args.state,
          zipCode: args.zipCode,
          propertyType: args.propertyType,
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
          owner: p.owner,
          propertyUrl: `${process.env.FRONTEND_URL}/property/${p.id}`,
        }));
      }

      case "search_vendors": {
        const vendors = await VendorStorage.getAllVendors({
          search: args.search,
          category: args.category ? args.category.toLowerCase() : undefined,
          city: args.city,
          state: args.state,
          verified: args.verified,
          minRating: args.minRating,
          price: args.price,
        });

        if (vendors.length === 0) {
          return {
            message: "No vendors found matching your criteria.",
          };
        }

        return vendors.map((v) => ({
          id: v.id,
          name: v.name,
          category: v.category,
          description: v.description,
          city: v.city,
          state: v.state,
          rating: v.rating,
          verified: v.verified,
          phone: v.phone,
          email: v.email,
        }));
      }

      case "search_knowledge_base": {
        const docs = await ragService.searchSimilarDocuments(args.query);
        if (docs.length === 0) {
          return {
            message: "No relevant documents found in the knowledge base.",
          };
        }
        return docs.map((d) => ({
          content: d.content,
          source: d.metadata?.source || "Internal Knowledge Base",
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
