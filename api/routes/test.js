import express from "express";
import { requirePayment } from "../utils/x402Payment.js";

export async function createTestRouter() {
  const router = express.Router();

  // GET endpoint - much simpler now!
  router.get(
    "/",
    requirePayment({
      price: "0.0001",
      description: "Weather information service - GET",
    }),
    (req, res) => {
      res.json({
        report: "test",
      });
    }
  );

  // POST endpoint - also much simpler!
  router.post(
    "/",
    requirePayment({
      price: "0.0001",
      description: "Weather information service - POST",
    }),
    (req, res) => {
      res.json({
        report: "test",
      });
    }
  );

  return router;
}
