import { X402PaymentHandler } from "x402-solana/server";
import dotenv from "dotenv";

dotenv.config();

const { FACILITATOR_URL_PAYAI, ADDRESS_PAYAI, BASE_URL } = process.env;

if (!FACILITATOR_URL_PAYAI || !ADDRESS_PAYAI || !BASE_URL) {
  throw new Error(
    "FACILITATOR_URL_PAYAI, ADDRESS_PAYAI, and BASE_URL must be set",
  );
}

// USDC token mint addresses
const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// CAIP-2 Network identifiers
const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
const SOLANA_DEVNET_CAIP2 = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

// Initialize x402 payment handler (singleton)
const x402 = new X402PaymentHandler({
  network: "solana",
  treasuryAddress: ADDRESS_PAYAI,
  facilitatorUrl: FACILITATOR_URL_PAYAI,
});

/**
 * Create x402 payment middleware for any route
 *
 * @param options - Payment configuration options
 * @returns Express middleware function
 *
 * @example
 * // Simple GET endpoint
 * router.get("/weather",
 *   requirePayment({
 *     price: "0.0001",
 *     description: "Weather API",
 *     method: "GET",
 *     queryParams: {
 *       location: { type: "string", required: true, description: "City name" }
 *     }
 *   }),
 *   (req, res) => res.json({ weather: "sunny" })
 * );
 *
 * @example
 * // POST endpoint with body
 * router.post("/ai-chat",
 *   requirePayment({
 *     price: "0.10",
 *     description: "AI Chat API",
 *     method: "POST",
 *     inputSchema: {
 *       bodyType: "json",
 *       bodyFields: {
 *         message: { type: "string", required: true, description: "User message" }
 *       }
 *     },
 *     outputSchema: {
 *       response: { type: "string" },
 *       model: { type: "string" }
 *     }
 *   }),
 *   async (req, res) => {
 *     const response = await processChat(req.body);
 *     res.json(response);
 *   }
 * );
 */
export function requirePayment(options) {
  return async (req, res, next) => {
    try {
      // 1. Extract payment header from request
      const paymentHeader = x402.extractPayment(req.headers);

      // 2. Calculate amount in micro-units
      const priceUSD = parseFloat(options.price);
      const microUnits = Math.floor(priceUSD * 1_000_000).toString();

      // 3. Determine network and token
      const network = options.network || "solana";
      const tokenMint =
        options.tokenMint ||
        (network === "solana" ? USDC_MAINNET : USDC_DEVNET);

      // 4. Build resource URL
      const resourceUrl = options.resource
        ? `${BASE_URL}${options.resource}`
        : `${BASE_URL}${req.path}`;

      // 5. Determine HTTP method
      const httpMethod = options.method || req.method.toUpperCase();

      // 6. Build CAIP-2 network identifier for v2
      const caip2Network =
        network === "solana" ? SOLANA_MAINNET_CAIP2 : SOLANA_DEVNET_CAIP2;

      // 7. Build schema for x402scan (Bazaar extension)
      const inputSchema = {
        type: "object",
        properties: {},
        required: [],
      };

      // Add query params to schema
      if (options.inputSchema?.queryParams) {
        for (const [key, value] of Object.entries(
          options.inputSchema.queryParams,
        )) {
          inputSchema.properties[key] = {
            type: value.type || "string",
            description: value.description,
          };
          if (value.required === true) {
            inputSchema.required.push(key);
          }
        }
      }

      // Add body fields to schema
      if (options.inputSchema?.bodyFields) {
        for (const [key, value] of Object.entries(
          options.inputSchema.bodyFields,
        )) {
          inputSchema.properties[key] = {
            type: value.type || "string",
            description: value.description,
          };
          if (value.required === true) {
            inputSchema.required.push(key);
          }
        }
      }

      // 8. Build example info for Bazaar extension
      const exampleInput = {};
      if (options.inputSchema?.queryParams) {
        for (const [key, value] of Object.entries(
          options.inputSchema.queryParams,
        )) {
          exampleInput[key] = value.example || `example_${key}`;
        }
      }
      if (options.inputSchema?.bodyFields) {
        for (const [key, value] of Object.entries(
          options.inputSchema.bodyFields,
        )) {
          exampleInput[key] = value.example || `example_${key}`;
        }
      }

      // 9. Create payment requirements (internal use for verification)
      const paymentRequirements = await x402.createPaymentRequirements({
        price: {
          amount: microUnits,
          asset: {
            address: tokenMint,
          },
        },
        network: network,
        config: {
          description: options.description,
          resource: resourceUrl,
          discoverable: options.discoverable || false,
        },
      });

      // 10. Build v2 accepts array
      const v2Accepts = [
        {
          scheme: "exact",
          network: caip2Network,
          amount: microUnits,
          payTo: ADDRESS_PAYAI,
          maxTimeoutSeconds: options.maxTimeoutSeconds || 60,
          asset: tokenMint,
          extra: {
            method: httpMethod,
            ...(options.inputSchema?.bodyType && {
              bodyType: options.inputSchema.bodyType,
            }),
          },
        },
      ];

      // 11. Build v2 resource object
      const v2Resource = {
        url: resourceUrl,
        description: options.description,
        mimeType: options.mimeType || "application/json",
      };

      // 12. Build v2 extensions (Bazaar for x402scan UI)
      const v2Extensions = {
        bazaar: {
          info: {
            input: Object.keys(exampleInput).length > 0 ? exampleInput : null,
            output: options.outputSchema || null,
          },
          schema: inputSchema,
        },
      };

      // 13. If no payment header, return 402 with v2-compliant response
      if (!paymentHeader) {
        const x402Response = {
          x402Version: 2,
          accepts: v2Accepts,
          resource: v2Resource,
          extensions: v2Extensions,
        };
        return res.status(402).json(x402Response);
      }

      // 14. Verify the payment
      const verified = await x402.verifyPayment(
        paymentHeader,
        paymentRequirements,
      );

      if (!verified) {
        const x402Response = {
          x402Version: 2,
          accepts: v2Accepts,
          resource: v2Resource,
          extensions: v2Extensions,
          error: "Payment verification failed: Invalid or expired payment",
        };
        return res.status(402).json(x402Response);
      }

      // 10. Settle the payment (complete the transaction)
      // await x402.settlePayment(paymentHeader, paymentRequirements);

      // Store payment info for later settlement
      req.x402Payment = { paymentHeader, paymentRequirements };

      // 11. Payment successful - continue to route handler
      next();
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

/**
 * Helper function to convert USD to USDC micro-units
 */
export function usdToMicroUsdc(usd) {
  return Math.floor(usd * 1_000_000).toString();
}

/**
 * Helper function to convert USDC micro-units to USD
 */
export function microUsdcToUsd(microUsdc) {
  return parseInt(microUsdc) / 1_000_000;
}

/**
 * Get the x402 handler instance (for advanced use cases)
 */
export function getX402Handler() {
  return x402;
}
