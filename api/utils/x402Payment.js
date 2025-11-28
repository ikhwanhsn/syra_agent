import { X402PaymentHandler } from "x402-solana/server";
import dotenv from "dotenv";

dotenv.config();

const { FACILITATOR_URL_PAYAI, ADDRESS_PAYAI, BASE_URL } = process.env;

if (!FACILITATOR_URL_PAYAI || !ADDRESS_PAYAI || !BASE_URL) {
  throw new Error(
    "FACILITATOR_URL_PAYAI, ADDRESS_PAYAI, and BASE_URL must be set"
  );
}

// USDC token mint addresses
const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

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

      // 6. Build outputSchema for x402scan compatibility
      const outputSchema = {
        input: {
          type: "http",
          method: httpMethod,
          ...(options.inputSchema?.bodyType && {
            bodyType: options.inputSchema.bodyType,
          }),
          ...(options.inputSchema?.queryParams && {
            queryParams: options.inputSchema.queryParams,
          }),
          ...(options.inputSchema?.bodyFields && {
            bodyFields: options.inputSchema.bodyFields,
          }),
          ...(options.inputSchema?.headerFields && {
            headerFields: options.inputSchema.headerFields,
          }),
        },
        ...(options.outputSchema && { output: options.outputSchema }),
      };

      // 7. Create payment requirements with x402scan schema
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
          outputSchema: outputSchema, // Add the required schema
        },
      });

      // 8. If no payment header, return 402 with x402-compliant response
      if (!paymentHeader) {
        const x402Response = {
          x402Version: 1,
          accepts: [paymentRequirements],
        };
        return res.status(402).json(x402Response);
      }

      // 9. Verify the payment
      const verified = await x402.verifyPayment(
        paymentHeader,
        paymentRequirements
      );

      if (!verified) {
        const x402Response = {
          x402Version: 1,
          accepts: [paymentRequirements],
          error: "Payment verification failed: Invalid or expired payment",
        };
        return res.status(402).json(x402Response);
      }

      // 10. Settle the payment (complete the transaction)
      await x402.settlePayment(paymentHeader, paymentRequirements);

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
