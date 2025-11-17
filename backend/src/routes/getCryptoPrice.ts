import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/", async (req, res) => {
  const pricesFetch = await fetch(
    `https://api.binance.com/api/v3/ticker/price`
  );
  const prices = await pricesFetch.json();
  res.json(prices);
});

export default router;
