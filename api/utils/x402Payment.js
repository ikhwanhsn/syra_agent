// import { X402PaymentHandler } from "x402-solana/server";
// import dotenv from "dotenv";

// dotenv.config();

// const { FACILITATOR_URL_PAYAI, ADDRESS_PAYAI, BASE_URL } = process.env;

// if (!FACILITATOR_URL_PAYAI || !ADDRESS_PAYAI || !BASE_URL) {
//   throw new Error(
//     "FACILITATOR_URL_PAYAI, ADDRESS_PAYAI, and BASE_URL must be set"
//   );
// }

// // USDC token mint addresses
// const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
// const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// // Initialize x402 payment handler (singleton)
// const x402 = new X402PaymentHandler({
//   network: "solana",
//   treasuryAddress: ADDRESS_PAYAI,
//   facilitatorUrl: FACILITATOR_URL_PAYAI,
// });

// /**
//  * Create x402 payment middleware for any route
//  *
//  * @param options - Payment configuration options
//  * @returns Express middleware function
//  *
//  * @example
//  * // Simple usage with just price and description
//  * router.get("/weather",
//  *   requirePayment({ price: "0.0001", description: "Weather API" }),
//  *   (req, res) => res.json({ weather: "sunny" })
//  * );
//  *
//  * @example
//  * // Advanced usage with all options
//  * router.post("/ai-chat",
//  *   requirePayment({
//  *     price: "0.10",
//  *     description: "AI Chat API - GPT-4 powered responses",
//  *     discoverable: true,
//  *     resource: "/api/ai-chat"
//  *   }),
//  *   async (req, res) => {
//  *     const response = await processChat(req.body);
//  *     res.json(response);
//  *   }
//  * );
//  */
// export function requirePayment(options) {
//   return async (req, res, next) => {
//     try {
//       // 1. Extract payment header from request
//       const paymentHeader = x402.extractPayment(req.headers);

//       // 2. Calculate amount in micro-units
//       const priceUSD = parseFloat(options.price);
//       const microUnits = Math.floor(priceUSD * 1_000_000).toString();

//       // 3. Determine network and token
//       const network = options.network || "solana";
//       const tokenMint =
//         options.tokenMint ||
//         (network === "solana" ? USDC_MAINNET : USDC_DEVNET);

//       // 4. Build resource URL
//       const resourceUrl = options.resource
//         ? `${BASE_URL}${options.resource}`
//         : `${BASE_URL}${req.path}`;

//       // 5. Create payment requirements
//       const paymentRequirements = await x402.createPaymentRequirements({
//         price: {
//           amount: microUnits,
//           asset: {
//             address: tokenMint,
//           },
//         },
//         network: network,
//         config: {
//           description: options.description,
//           resource: resourceUrl,
//           discoverable: options.discoverable || false,
//         },
//       });

//       // 6. If no payment header, return 402 with payment requirements
//       if (!paymentHeader) {
//         const response = x402.create402Response(paymentRequirements);
//         return res.status(response.status).json(response.body);
//       }

//       // 7. Verify the payment
//       const verified = await x402.verifyPayment(
//         paymentHeader,
//         paymentRequirements
//       );

//       if (!verified) {
//         return res.status(402).json({
//           error: "Payment verification failed",
//           message: "Invalid or expired payment",
//         });
//       }

//       // 8. Settle the payment (complete the transaction)
//       await x402.settlePayment(paymentHeader, paymentRequirements);

//       // 9. Payment successful - continue to route handler
//       next();
//     } catch (error) {
//       console.error("Payment processing error:", error);
//       res.status(500).json({
//         error: "Internal server error",
//         message: error instanceof Error ? error.message : "Unknown error",
//       });
//     }
//   };
// }

// /**
//  * Helper function to convert USD to USDC micro-units
//  */
// export function usdToMicroUsdc(usd) {
//   return Math.floor(usd * 1_000_000).toString();
// }

// /**
//  * Helper function to convert USDC micro-units to USD
//  */
// export function microUsdcToUsd(microUsdc) {
//   return parseInt(microUsdc) / 1_000_000;
// }

// /**
//  * Get the x402 handler instance (for advanced use cases)
//  */
// export function getX402Handler() {
//   return x402;
// }

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
 * // Simple usage with just price and description
 * router.get("/weather",
 *   requirePayment({ price: "0.0001", description: "Weather API" }),
 *   (req, res) => res.json({ weather: "sunny" })
 * );
 *
 * @example
 * // Advanced usage with all options
 * router.post("/ai-chat",
 *   requirePayment({
 *     price: "0.10",
 *     description: "AI Chat API - GPT-4 powered responses",
 *     discoverable: true,
 *     resource: "/api/ai-chat"
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

      // 5. Create payment requirements
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

      // 6. If no payment header, return 402 with payment requirements
      if (!paymentHeader) {
        // CRITICAL FIX: x402 protocol requires "accepts" array
        const x402Response = {
          x402Version: 1,
          accepts: [paymentRequirements], // Must be an array!
        };
        return res.status(402).json(x402Response);
      }

      // 7. Verify the payment
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

      // 8. Settle the payment (complete the transaction)
      await x402.settlePayment(paymentHeader, paymentRequirements);

      // 9. Payment successful - continue to route handler
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
