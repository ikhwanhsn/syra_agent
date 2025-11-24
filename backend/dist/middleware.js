import { paymentMiddleware } from "x402-express";
// import { facilitator } from '@coinbase/x402'; // For mainnet
// Load environment variables
const WALLET_ADDRESS = process.env.PAYTO_ADDRESS || "0xYourWalletAddress";
const NETWORK = process.env.FAREMETER_NETWORKS || "solana-devnet";
const PRICE = process.env.PAYMENT_AMOUNT || "0.01";
const FACILITATOR_URL = process.env.FAREMETER_FACILITATOR_URL || "https://x402.org/facilitator";
// Configure x402 payment middleware
export const x402Middleware = paymentMiddleware(WALLET_ADDRESS, // Your receiving wallet address
{
    // Protected routes configuration
    "GET /btc-price": {
        price: `${PRICE}`, // Price in USD
        network: NETWORK, // 'base-sepolia', 'base', 'solana', 'ethereum'
    },
    // POST endpoint - accepts private key for automatic payment
    "POST /btc-price": {
        price: `${PRICE}`,
        network: NETWORK,
    },
}, {
    // TESTNET: Use x402.org facilitator
    url: FACILITATOR_URL,
    // MAINNET: Use Coinbase facilitator (uncomment when ready for production)
    // facilitator
});
// Optional: Custom middleware to log payment attempts
export const logPaymentMiddleware = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    // Check if x402 payment headers are present
    if (req.headers["x-payment"]) {
        console.log("💳 Payment header detected");
    }
    next();
};
