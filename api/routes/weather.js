// routes/weather.js
import express from "express";
import { createPaymentMiddleware, schemas } from "../utils/x402Payment.js";

export async function createWeatherRouter() {
  const router = express.Router();

  // Create payment middleware with simple configuration
  const middleware = createPaymentMiddleware({
    route: "/weather",
    price: "$0.0001",
    description: "Weather information service",
    outputSchema: schemas.report({
      weather: { type: "string" },
      temperature: { type: "number" },
    }),
    methods: ["GET", "POST"], // Optional, defaults to ["GET", "POST"]
  });

  // Apply middleware to routes
  router.get("/", middleware, (req, res) => {
    res.json({
      report: {
        weather: "sunny",
        temperature: 70,
      },
    });
  });

  router.post("/", middleware, (req, res) => {
    res.json({
      report: {
        weather: "sunny",
        temperature: 70,
      },
    });
  });

  return router;
}
