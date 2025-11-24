import express from "express";
import { X402PaymentHandler } from "x402-solana/server";
const { TREASURY_WALLET_ADDRESS } = process.env;
if (!TREASURY_WALLET_ADDRESS) {
    throw new Error("TREASURY_WALLET_ADDRESS must be set");
}
export async function createWeatherRouter() {
    const router = express.Router();
    const x402 = new X402PaymentHandler({
        network: "solana", // or "solana" for mainnet
        treasuryAddress: TREASURY_WALLET_ADDRESS,
        facilitatorUrl: "https://facilitator.payai.network",
    });
    // USDC devnet mint address
    //   const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
    const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    router.get("/", async (req, res) => {
        // 1. Extract payment header
        const paymentHeader = x402.extractPayment(req.headers);
        // 2. Create payment requirements
        const paymentRequirements = await x402.createPaymentRequirements({
            price: {
                amount: "100", // $0.0001 USDC = 100 micro-units (6 decimals)
                asset: {
                    address: USDC_MAINNET,
                    decimals: 6,
                },
            },
            network: "solana",
            config: {
                description: "Weather API Request",
                resource: `${process.env.BASE_URL ||
                    "http://localhost:4000"}/weather`,
            },
        });
        // 3. If no payment, return 402
        if (!paymentHeader) {
            const response = x402.create402Response(paymentRequirements);
            return res.status(response.status).json(response.body);
        }
        // 4. Verify payment with PayAI facilitator
        const verified = await x402.verifyPayment(paymentHeader, paymentRequirements);
        if (!verified) {
            return res.status(402).json({ error: "Invalid payment" });
        }
        // 5. Settle payment
        await x402.settlePayment(paymentHeader, paymentRequirements);
        // 6. Return weather data
        res.json({
            report: {
                weather: "sunny",
                temperature: 70,
            },
        });
    });
    return router;
}
