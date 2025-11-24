import express from "express";
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";
const { PRIVATE_KEY_PAYAI, WEATHER_API_URL = "http://localhost:4000/weather" } = process.env;
if (!PRIVATE_KEY_PAYAI) {
    throw new Error("PRIVATE_KEY_PAYAI must be set (base58 format)");
}
if (!WEATHER_API_URL) {
    throw new Error("WEATHER_API_URL must be set (e.g., http://localhost:3000/weather)");
}
export async function createAutoPaymentRouter() {
    const router = express.Router();
    // Create Solana signer from private key (base58 encoded 64-byte key)
    const signer = await createKeyPairSignerFromBytes(base58.decode(PRIVATE_KEY_PAYAI));
    // Wrap fetch with automatic x402 payment handling
    const fetchWithPayment = wrapFetchWithPayment(fetch, signer);
    router.get("/", async (req, res) => {
        try {
            console.log("Making request to weather API with auto-payment...");
            // This will automatically:
            // 1. Make initial request
            // 2. If 402 received, parse payment requirements
            // 3. Sign payment transaction with Solana wallet
            // 4. Retry request with X-PAYMENT header
            const response = await fetchWithPayment(WEATHER_API_URL, {
                method: "GET",
            });
            if (!response.ok) {
                return res.status(response.status).json({
                    error: "Failed to get weather data",
                    status: response.status,
                });
            }
            const data = await response.json();
            // Optionally decode payment response for logging/receipts
            const paymentResponseHeader = response.headers.get("x-payment-response");
            let paymentInfo = null;
            if (paymentResponseHeader) {
                paymentInfo = decodeXPaymentResponse(paymentResponseHeader);
                console.log("Payment settled:", paymentInfo);
            }
            res.json({
                success: true,
                data,
                payment: paymentInfo,
            });
        }
        catch (error) {
            console.error("Error fetching weather with payment:", error);
            res.status(500).json({
                error: "Failed to complete payment or fetch weather",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
    return router;
}
