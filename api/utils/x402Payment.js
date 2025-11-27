// utils/x402Payment.js
import { paymentMiddleware } from "x402-express";
import dotenv from "dotenv";

dotenv.config();

const { FACILITATOR_URL_PAYAI, ADDRESS_PAYAI } = process.env;

if (!FACILITATOR_URL_PAYAI || !ADDRESS_PAYAI) {
  throw new Error("FACILITATOR_URL_PAYAI and ADDRESS_PAYAI must be set");
}

/**
 * Creates a reusable x402 payment middleware
 * @param {Object} config - Payment configuration
 * @param {string} config.route - The route path (e.g., "/weather", "/signal/create")
 * @param {string} config.price - Price in USD (e.g., "$0.0001")
 * @param {string} config.description - Human-readable description of the service
 * @param {Object} config.outputSchema - JSON schema for response format
 * @param {string} [config.network="solana"] - Blockchain network
 * @param {string} [config.mimeType="application/json"] - Response MIME type
 * @param {Array<string>} [config.methods=["GET", "POST"]] - HTTP methods to support
 * @returns {Function} Express middleware
 */
export function createPaymentMiddleware(config) {
  const {
    route,
    price,
    description,
    outputSchema,
    network = "solana",
    mimeType = "application/json",
    methods = ["GET", "POST"],
  } = config;

  // Build payment requirements for each HTTP method
  const paymentRequirements = {};

  methods.forEach((method) => {
    paymentRequirements[`${method} ${route}`] = {
      price,
      network,
      config: {
        description,
        mimeType,
        outputSchema,
      },
    };
  });

  // Create and return the middleware
  return paymentMiddleware(ADDRESS_PAYAI, paymentRequirements, {
    url: FACILITATOR_URL_PAYAI,
  });
}

/**
 * Helper to create common output schemas
 */
export const schemas = {
  // Simple object response
  object: (properties) => ({
    type: "object",
    properties,
    required: Object.keys(properties),
  }),

  // Nested report structure
  report: (reportProperties) => ({
    type: "object",
    properties: {
      report: {
        type: "object",
        properties: reportProperties,
        required: Object.keys(reportProperties),
      },
    },
    required: ["report"],
  }),

  // Array response
  array: (itemSchema) => ({
    type: "array",
    items: itemSchema,
  }),

  // Success/error response
  standardResponse: () => ({
    type: "object",
    properties: {
      success: { type: "boolean" },
      data: { type: "object" },
      error: { type: "string" },
    },
    required: ["success"],
  }),
};
