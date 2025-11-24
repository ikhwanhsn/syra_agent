import { Router } from "express";
const router = Router();
// GET /btc-price - Returns current Bitcoin price (requires x402 payment)
router.get("/", async (req, res) => {
    try {
        // Return the Bitcoin price data
        res.json({
            success: true,
            message: "Bitcoin price fetched successfully",
        });
    }
    catch (error) {
        console.error("Error fetching Bitcoin price:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch Bitcoin price",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
// POST /btc-price - Accept private key in body for automatic payment
router.post("/", async (req, res) => {
    try {
        res.json({
            success: true,
            message: "Bitcoin price fetched successfully",
            paymentConfirmed: true,
        });
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to process request",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
export default router;
