// auto-payment-client.ts - Server-side x402 client for Node.js
import express from "express";
import { Keypair, Connection, PublicKey, VersionedTransaction, TransactionMessage, } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID, } from "@solana/spl-token";
import bs58 from "bs58";
const { SOLANA_PRIVATE_KEY, WEATHER_API_URL } = process.env;
if (!SOLANA_PRIVATE_KEY) {
    throw new Error("SOLANA_PRIVATE_KEY must be set (base58 format)");
}
if (!WEATHER_API_URL) {
    throw new Error("WEATHER_API_URL must be set");
}
// USDC mint addresses
const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
// Network config
const NETWORK = process.env.SOLANA_NETWORK || "devnet";
const RPC_URL = NETWORK === "mainnet"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";
const USDC_MINT = NETWORK === "mainnet" ? USDC_MAINNET : USDC_DEVNET;
// Create wallet from private key
function createWallet() {
    const keypair = Keypair.fromSecretKey(bs58.decode(SOLANA_PRIVATE_KEY));
    return keypair;
}
// Build USDC transfer transaction
async function buildPaymentTransaction(connection, payer, recipient, amount) {
    const payerPubkey = payer.publicKey;
    const recipientPubkey = new PublicKey(recipient);
    const mintPubkey = new PublicKey(USDC_MINT);
    // Get token accounts
    const payerAta = await getAssociatedTokenAddress(mintPubkey, payerPubkey);
    const recipientAta = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);
    // Create transfer instruction
    const transferIx = createTransferInstruction(payerAta, recipientAta, payerPubkey, amount, [], TOKEN_PROGRAM_ID);
    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    // Build transaction
    const message = new TransactionMessage({
        payerKey: payerPubkey,
        recentBlockhash: blockhash,
        instructions: [transferIx],
    }).compileToV0Message();
    const tx = new VersionedTransaction(message);
    tx.sign([payer]);
    return tx;
}
// Create x402 payment payload
async function createPaymentPayload(connection, wallet, requirement) {
    const amount = BigInt(requirement.maxAmountRequired);
    // Build the transaction
    const tx = await buildPaymentTransaction(connection, wallet, requirement.payTo, amount);
    // Serialize and encode
    const serialized = tx.serialize();
    const payload = {
        x402Version: 1,
        scheme: "exact",
        network: requirement.network,
        payload: {
            signature: "", // Will be filled by facilitator after settlement
            transaction: Buffer.from(serialized).toString("base64"),
        },
    };
    return Buffer.from(JSON.stringify(payload)).toString("base64");
}
// Parse 402 response to get payment requirements
function parse402Response(headers, body) {
    // Try to get from body first (standard x402)
    if (body?.accepts && Array.isArray(body.accepts) && body.accepts.length > 0) {
        // Find Solana payment option
        const solanaOption = body.accepts.find((a) => a.network === "solana-devnet" || a.network === "solana");
        return solanaOption || body.accepts[0];
    }
    // Try X-Payment header
    const xPayment = headers.get("x-payment");
    if (xPayment) {
        try {
            const decoded = JSON.parse(Buffer.from(xPayment, "base64").toString());
            if (decoded.accepts) {
                const solanaOption = decoded.accepts.find((a) => a.network === "solana-devnet" || a.network === "solana");
                return solanaOption || decoded.accepts[0];
            }
        }
        catch (e) {
            console.error("Failed to parse X-Payment header:", e);
        }
    }
    return null;
}
export async function createAutoPaymentRouter() {
    const router = express.Router();
    const wallet = createWallet();
    const connection = new Connection(RPC_URL, "confirmed");
    console.log(`Wallet address: ${wallet.publicKey.toBase58()}`);
    console.log(`Network: ${NETWORK}`);
    console.log(`RPC: ${RPC_URL}`);
    router.get("/", async (req, res) => {
        try {
            console.log(`\n--- Making request to ${WEATHER_API_URL} ---`);
            // Step 1: Make initial request
            const initialResponse = await fetch(WEATHER_API_URL, {
                method: "GET",
                headers: { Accept: "application/json" },
            });
            console.log(`Initial response status: ${initialResponse.status}`);
            // If not 402, return directly
            if (initialResponse.status !== 402) {
                const data = await initialResponse.json();
                return res.status(initialResponse.status).json(data);
            }
            // Step 2: Parse 402 response for payment requirements
            const body = await initialResponse.json().catch(() => ({}));
            console.log("402 Response body:", JSON.stringify(body, null, 2));
            const requirement = parse402Response(initialResponse.headers, body);
            if (!requirement) {
                return res.status(500).json({
                    error: "Could not parse payment requirements from 402 response",
                    body,
                });
            }
            console.log("Payment requirement:", {
                payTo: requirement.payTo,
                amount: requirement.maxAmountRequired,
                network: requirement.network,
                asset: requirement.asset,
            });
            // Step 3: Create payment payload
            console.log("Building payment transaction...");
            const paymentHeader = await createPaymentPayload(connection, wallet, requirement);
            console.log("Payment payload created");
            // Step 4: Retry request with payment
            console.log("Retrying request with X-PAYMENT header...");
            const paidResponse = await fetch(WEATHER_API_URL, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "X-PAYMENT": paymentHeader,
                },
            });
            console.log(`Paid response status: ${paidResponse.status}`);
            if (!paidResponse.ok) {
                const errorBody = await paidResponse.text();
                console.error("Payment failed:", errorBody);
                return res.status(paidResponse.status).json({
                    error: "Payment verification failed",
                    status: paidResponse.status,
                    details: errorBody,
                });
            }
            // Step 5: Return success response
            const data = await paidResponse.json();
            const paymentResponse = paidResponse.headers.get("x-payment-response");
            res.json({
                success: true,
                data,
                payment: {
                    paidTo: requirement.payTo,
                    amount: requirement.maxAmountRequired,
                    network: requirement.network,
                    wallet: wallet.publicKey.toBase58(),
                },
                receipt: paymentResponse,
            });
        }
        catch (error) {
            console.error("Error:", error);
            res.status(500).json({
                error: "Failed to complete request",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
    return router;
}
// Main app
const app = express();
app.use(express.json());
async function startServer() {
    const autoPaymentRouter = await createAutoPaymentRouter();
    app.use("/auto-weather", autoPaymentRouter);
    const PORT = process.env.CLIENT_PORT || 3001;
    app.listen(PORT, () => {
        console.log(`\nAuto-payment API running on port ${PORT}`);
        console.log(`GET /auto-weather - Fetches weather with automatic payment\n`);
    });
}
startServer().catch(console.error);
