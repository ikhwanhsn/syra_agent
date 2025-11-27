// utils/x402Payment.js - FIXED VERSION
import { paymentMiddleware } from "x402-express";
import dotenv from "dotenv";

dotenv.config();

const { FACILITATOR_URL_PAYAI, ADDRESS_PAYAI } = process.env;

if (!FACILITATOR_URL_PAYAI || !ADDRESS_PAYAI) {
  throw new Error("FACILITATOR_URL_PAYAI and ADDRESS_PAYAI must be set");
}

console.log("=== x402 Configuration ===");
console.log("Facilitator URL:", FACILITATOR_URL_PAYAI);
console.log("Receiver Address:", ADDRESS_PAYAI);
console.log("========================\n");

/**
 * Creates a reusable x402 payment middleware
 * This returns the middleware that should be applied at APP level, not router level
 */
export function createPaymentMiddleware(config) {
  const {
    mountPath,
    routePath = "/",
    price,
    description,
    outputSchema,
    network = "solana",
    mimeType = "application/json",
    methods = ["GET", "POST"],
  } = config;

  // Validation
  if (!mountPath) {
    throw new Error(
      "createPaymentMiddleware: 'mountPath' is required. " +
        "Example: createPaymentMiddleware({ mountPath: '/weather', ... })"
    );
  }

  if (!price) {
    throw new Error("createPaymentMiddleware: 'price' is required");
  }

  if (!description) {
    throw new Error("createPaymentMiddleware: 'description' is required");
  }

  if (!outputSchema) {
    throw new Error("createPaymentMiddleware: 'outputSchema' is required");
  }

  // Combine mount path and route path to get full path
  // Remove trailing slashes from BOTH mountPath and routePath
  const cleanMountPath = mountPath.replace(/\/$/, "");
  const cleanRoutePath = routePath.replace(/\/$/, "");

  // Add leading slash to routePath if needed
  const normalizedRoutePath =
    cleanRoutePath.startsWith("/") || cleanRoutePath === ""
      ? cleanRoutePath
      : `/${cleanRoutePath}`;

  // Combine paths
  const fullPath = cleanMountPath + normalizedRoutePath;

  // Build payment requirements for each HTTP method
  const paymentRequirements = {};

  methods.forEach((method) => {
    // THIS IS THE KEY: Use just the path as the key, not "METHOD /path"
    const routeKey = fullPath;

    paymentRequirements[routeKey] = {
      price,
      network,
      config: {
        description,
        mimeType,
        outputSchema,
      },
    };
  });

  console.log(`\n🔒 [x402] Payment protection configured for:`);
  Object.keys(paymentRequirements).forEach((key) => {
    console.log(`   ${methods.join(", ")} ${key} - ${price} USDC`);
  });
  console.log("");

  // Return the payment middleware directly
  // It should be applied at APP level: app.use(createPaymentMiddleware(...))
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
