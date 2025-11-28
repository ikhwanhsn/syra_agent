// import express from "express";
// import { paymentMiddleware } from "x402-express";
// import dotenv from "dotenv";

// dotenv.config();

// const { FACILITATOR_URL_PAYAI, ADDRESS_PAYAI } = process.env;

// if (!FACILITATOR_URL_PAYAI || !ADDRESS_PAYAI) {
//   throw new Error("FACILITATOR_URL_PAYAI and ADDRESS_PAYAI must be set");
// }

// export async function createWeatherRouter() {
//   const router = express.Router();

//   const middleware = paymentMiddleware(
//     ADDRESS_PAYAI,
//     {
//       "GET /": {
//         price: "$0.0001",
//         network: "solana",
//         config: {
//           resource: `${process.env.BASE_URL}/weather`,
//           description: "Weather information service",
//         },
//       },
//       "POST /": {
//         // ← ADD THIS for POST support
//         price: "$0.0001",
//         network: "solana",
//         config: {
//           resource: `${process.env.BASE_URL}/weather`,
//           description: "Weather information service",
//         },
//       },
//     },
//     {
//       url: FACILITATOR_URL_PAYAI,
//     }
//   );

//   router.get("/", middleware, (req, res) => {
//     res.json({
//       report: {
//         weather: "sunny",
//         temperature: 70,
//       },
//     });
//   });

//   router.post("/", middleware, (req, res) => {
//     res.json({
//       report: {
//         weather: "sunny",
//         temperature: 70,
//       },
//     });
//   });

//   return router;
// }

import express from "express";
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

export async function createWeatherRouter() {
  const router = express.Router();

  // Initialize x402 payment handler
  const x402 = new X402PaymentHandler({
    network: "solana-devnet", // Change to 'solana' for mainnet
    treasuryAddress: ADDRESS_PAYAI,
    facilitatorUrl: FACILITATOR_URL_PAYAI,
  });

  // Payment configuration
  const createPaymentConfig = (method) => ({
    price: {
      amount: "100", // $0.0001 USDC in micro-units (0.0001 * 1,000,000 = 100)
      asset: {
        address: USDC_MAINNET, // Change to USDC_MAINNET for production
      },
    },
    network: "solana", // Change to 'solana' for mainnet
    config: {
      description: `Weather information service - ${method}`,
      resource: `${BASE_URL}/weather`,
    },
  });

  // GET endpoint
  router.get("/", async (req, res) => {
    try {
      // 1. Extract payment header from request
      const paymentHeader = x402.extractPayment(req.headers);

      // 2. Create payment requirements
      const paymentRequirements = await x402.createPaymentRequirements(
        createPaymentConfig("GET")
      );

      // 3. If no payment header, return 402 with payment requirements
      if (!paymentHeader) {
        const response = x402.create402Response(paymentRequirements);
        return res.status(response.status).json(response.body);
      }

      // 4. Verify the payment
      const verified = await x402.verifyPayment(
        paymentHeader,
        paymentRequirements
      );

      if (!verified) {
        return res.status(402).json({
          error: "Payment verification failed",
          message: "Invalid or expired payment",
        });
      }

      // 5. Process the request (your business logic)
      const weatherData = {
        report: {
          weather: "sunny",
          temperature: 70,
          humidity: 65,
          location: req.query.location || "Unknown",
        },
      };

      // 6. Settle the payment (complete the transaction)
      await x402.settlePayment(paymentHeader, paymentRequirements);

      // 7. Return the response
      res.json(weatherData);
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST endpoint
  router.post("/", async (req, res) => {
    try {
      // 1. Extract payment header from request
      const paymentHeader = x402.extractPayment(req.headers);

      // 2. Create payment requirements
      const paymentRequirements = await x402.createPaymentRequirements(
        createPaymentConfig("POST")
      );

      // 3. If no payment header, return 402 with payment requirements
      if (!paymentHeader) {
        const response = x402.create402Response(paymentRequirements);
        return res.status(response.status).json(response.body);
      }

      // 4. Verify the payment
      const verified = await x402.verifyPayment(
        paymentHeader,
        paymentRequirements
      );

      if (!verified) {
        return res.status(402).json({
          error: "Payment verification failed",
          message: "Invalid or expired payment",
        });
      }

      // 5. Process the request (your business logic)
      const weatherData = {
        report: {
          weather: "sunny",
          temperature: 70,
          humidity: 65,
          location: req.body?.location || "Unknown",
          requestData: req.body,
        },
      };

      // 6. Settle the payment (complete the transaction)
      await x402.settlePayment(paymentHeader, paymentRequirements);

      // 7. Return the response
      res.json(weatherData);
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}
