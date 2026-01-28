/**
 * x402 V1 Payment Utilities (x402scan compatible)
 * 
 * This utility provides x402 V1 compliant responses that work with x402scan.
 * 
 * x402 V1 Format:
 * - Uses "X-PAYMENT" header for payment signatures
 * - Network is simple string (e.g., "solana")
 * - Uses "maxAmountRequired" for price in micro-units
 * - outputSchema contains input/output schema definitions
 * - extra.feePayer for fee payer address
 */
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

// Fee payer address (same as treasury for now)
const FEE_PAYER = process.env.FEE_PAYER_ADDRESS || ADDRESS_PAYAI;

// Initialize x402 payment handler (singleton)
const x402 = new X402PaymentHandler({
  network: "solana",
  treasuryAddress: ADDRESS_PAYAI,
  facilitatorUrl: FACILITATOR_URL_PAYAI,
});

/**
 * Create x402 V1 payment middleware for any route (x402scan compatible)
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
 *     inputSchema: {
 *       queryParams: {
 *         location: { type: "string", required: true, description: "City name" }
 *       }
 *     },
 *     outputSchema: {
 *       weather: { type: "string", description: "Weather condition" }
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
 *       response: { type: "string", description: "AI response" },
 *       model: { type: "string", description: "Model used" }
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
      // 1. Extract payment header from request (V1 uses X-PAYMENT)
      const paymentHeader = req.headers["x-payment"] || x402.extractPayment(req.headers);

      // 2. Calculate amount in micro-units (USDC has 6 decimals)
      const priceUSD = parseFloat(options.price);
      const microUnits = Math.floor(priceUSD * 1_000_000).toString();

      // 3. Determine network and token (V1 uses simple network name)
      const network = options.network || "solana";
      const tokenMint = options.tokenMint || USDC_MAINNET;

      // 4. Build resource URL (full URL for V1)
      const resourceUrl = options.resource
        ? `${BASE_URL}${options.resource}`
        : `${BASE_URL}${req.path}`;

      // 5. Determine HTTP method
      const httpMethod = options.method || req.method.toUpperCase();

      // 6. Build V1 outputSchema with input and output structure
      const v1OutputSchema = {
        input: {
          type: "http",
          method: httpMethod,
        },
        output: options.outputSchema || {},
      };

      // Add query params to input schema
      if (options.inputSchema?.queryParams) {
        v1OutputSchema.input.queryParams = {};
        for (const [key, value] of Object.entries(options.inputSchema.queryParams)) {
          v1OutputSchema.input.queryParams[key] = {
            type: value.type || "string",
            required: value.required || false,
            description: value.description || "",
          };
        }
      }

      // Add body fields to input schema (for POST requests)
      if (options.inputSchema?.bodyFields) {
        v1OutputSchema.input.bodyFields = {};
        for (const [key, value] of Object.entries(options.inputSchema.bodyFields)) {
          v1OutputSchema.input.bodyFields[key] = {
            type: value.type || "string",
            required: value.required || false,
            description: value.description || "",
          };
        }
      }

      // 7. Create payment requirements (internal use for verification)
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

      // 8. Build V1 accepts array (x402scan compatible format)
      const v1Accepts = [
        {
          scheme: "exact",
          network: network, // Simple network name for V1 (e.g., "solana")
          maxAmountRequired: microUnits, // V1 uses maxAmountRequired
          resource: resourceUrl, // Full URL in accepts for V1
          description: options.description,
          mimeType: options.mimeType || "",
          payTo: ADDRESS_PAYAI,
          maxTimeoutSeconds: options.maxTimeoutSeconds || 60,
          asset: tokenMint,
          outputSchema: v1OutputSchema, // V1 schema format with input/output
          extra: {
            feePayer: FEE_PAYER, // Required for V1
          },
        },
      ];

      // 9. If no payment header, return 402 with V1-compliant response
      if (!paymentHeader) {
        const x402Response = {
          x402Version: 1,
          error: "X-PAYMENT header is required",
          accepts: v1Accepts,
        };
        
        return res.status(402).json(x402Response);
      }

      // 10. Verify the payment
      const verified = await x402.verifyPayment(
        paymentHeader,
        paymentRequirements,
      );

      if (!verified) {
        const x402Response = {
          x402Version: 1,
          error: "Payment verification failed: Invalid or expired payment",
          accepts: v1Accepts,
        };
        
        return res.status(402).json(x402Response);
      }

      // 11. Store payment info for later settlement
      req.x402Payment = { 
        paymentHeader, 
        paymentRequirements,
        network: network,
        amount: microUnits,
      };

      // 12. Payment successful - continue to route handler
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
