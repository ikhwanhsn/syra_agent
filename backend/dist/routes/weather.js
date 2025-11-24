import express from "express";
import { paymentMiddleware } from "x402-express";
const { FACILITATOR_URL_PAYAI, ADDRESS_PAYAI } = process.env;
if (!FACILITATOR_URL_PAYAI || !ADDRESS_PAYAI) {
    throw new Error("FACILITATOR_URL_PAYAI and ADDRESS_PAYAI must be set");
}
export async function createWeatherRouter() {
    const router = express.Router();
    const middleware = paymentMiddleware(ADDRESS_PAYAI, {
        "GET /": {
            price: "$0.0001",
            network: "solana", // or "base" for mainnet
        },
    }, {
        url: FACILITATOR_URL_PAYAI,
    });
    router.get("/", middleware, (req, res) => {
        res.json({
            report: {
                weather: "sunny",
                temperature: 70,
            },
        });
    });
    return router;
}
