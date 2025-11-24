import express from "express";
import fetch from "node-fetch";
const router = express.Router();
router.get("/", async (_, res) => {
    try {
        const result = await fetch("https://api.binance.com/api/v3/ticker/price");
        const json = await result.json();
        res.json(json);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch" });
    }
});
export default router;
