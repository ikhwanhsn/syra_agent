import express from "express";
import { requirePayment } from "../utils/x402Payment.js";

export async function createCheckStatusRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: "0.0001",
      description: "Check status server",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
    }),
    async (req, res) => {
      res.status(200).json({
        status: "ok",
        message: "Check status server is running",
      });
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price: "0.0001",
      description: "Check status server",
      method: "POST",
      discoverable: true,
    }),
    async (req, res) => {
      res.status(200).json({
        status: "ok",
        message: "Check status server is running",
      });
    }
  );

  return router;
}
