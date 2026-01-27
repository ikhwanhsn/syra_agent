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

// CAIP-2 Network identifiers
const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

export async function createWeatherRouter() {
  const router = express.Router();

  // Initialize x402 payment handler
  const x402 = new X402PaymentHandler({
    network: "solana",
    treasuryAddress: ADDRESS_PAYAI,
    facilitatorUrl: FACILITATOR_URL_PAYAI,
  });

  const PRICE_AMOUNT = "100"; // $0.0001 USDC in micro-units
  const RESOURCE_URL = `${BASE_URL}/weather`;

  // Payment configuration (internal use for verification)
  const createPaymentConfig = (method) => ({
    price: {
      amount: PRICE_AMOUNT,
      asset: {
        address: USDC_MAINNET,
      },
    },
    network: "solana",
    config: {
      description: `Weather information service - ${method}`,
      resource: RESOURCE_URL,
    },
  });

  // Create v2 402 response
  const createV2Response = (method) => ({
    x402Version: 2,
    accepts: [
      {
        scheme: "exact",
        network: SOLANA_MAINNET_CAIP2,
        amount: PRICE_AMOUNT,
        payTo: ADDRESS_PAYAI,
        maxTimeoutSeconds: 60,
        asset: USDC_MAINNET,
        extra: {
          method: method,
        },
      },
    ],
    resource: {
      url: RESOURCE_URL,
      description: `Weather information service - ${method}`,
      mimeType: "application/json",
    },
    extensions: {
      bazaar: {
        info: {
          input: { location: "New York" },
          output: {
            report: {
              weather: "sunny",
              temperature: 70,
              humidity: 65,
              location: "New York",
            },
          },
        },
        schema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "Location for weather data",
            },
          },
        },
      },
    },
  });

  // GET endpoint
  router.get("/", async (req, res) => {
    try {
      // 1. Extract payment header from request
      const paymentHeader = x402.extractPayment(req.headers);

      // 2. Create payment requirements (for internal verification)
      const paymentRequirements = await x402.createPaymentRequirements(
        createPaymentConfig("GET")
      );

      // 3. If no payment header, return 402 with v2 response
      if (!paymentHeader) {
        return res.status(402).json(createV2Response("GET"));
      }

      // 4. Verify the payment
      const verified = await x402.verifyPayment(
        paymentHeader,
        paymentRequirements
      );

      if (!verified) {
        return res.status(402).json({
          ...createV2Response("GET"),
          error: "Payment verification failed: Invalid or expired payment",
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

      // 2. Create payment requirements (for internal verification)
      const paymentRequirements = await x402.createPaymentRequirements(
        createPaymentConfig("POST")
      );

      // 3. If no payment header, return 402 with v2 response
      if (!paymentHeader) {
        return res.status(402).json(createV2Response("POST"));
      }

      // 4. Verify the payment
      const verified = await x402.verifyPayment(
        paymentHeader,
        paymentRequirements
      );

      if (!verified) {
        return res.status(402).json({
          ...createV2Response("POST"),
          error: "Payment verification failed: Invalid or expired payment",
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
