// import express from "express";
// import fetch from "node-fetch";
// import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
// import { createLocalWallet } from "@faremeter/wallet-solana";
// import { wrap as wrapFetch } from "@faremeter/fetch";
// import { createPaymentHandler } from "@faremeter/payment-solana/exact";

// const { AGENT_KEYPAIR, BASE_URL } = process.env;

// if (!AGENT_KEYPAIR || !BASE_URL) {
//   throw new Error("AGENT_KEYPAIR and BASE_URL must be set in your environment");
// }

// const agentKeypair = Keypair.fromSecretKey(
//   Uint8Array.from(JSON.parse(AGENT_KEYPAIR))
// );

// const network = "mainnet-beta"; // or "devnet" for testing

// export async function createWeatherAgentPayAIRouter() {
//   const router = express.Router();

//   const connection = new Connection(clusterApiUrl(network));

//   // PayAI facilitator expects USDC payments
//   // USDC mint address on Solana mainnet
//   const usdcMint = new PublicKey(
//     "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
//   );

//   const wallet = await createLocalWallet(network, agentKeypair);
//   const fetchWithPayer = wrapFetch(fetch as any, {
//     handlers: [createPaymentHandler(wallet, usdcMint, connection)],
//   });

//   // Reusable request handler
//   const handleRequest = async (
//     req: express.Request,
//     res: express.Response,
//     method: "GET" | "POST"
//   ) => {
//     try {
//       console.log(
//         `🤖 Agent paying automatically via PayAI facilitator (${method})...`
//       );

//       const response = await fetchWithPayer(`${BASE_URL}/weather`, {
//         method,
//         headers: {
//           Accept: "application/json",
//           "Content-Type": "application/json",
//         },
//         ...(method === "POST" ? { body: JSON.stringify(req.body || {}) } : {}),
//       });

//       const txSignature =
//         response.headers.get("x-solana-signature") ||
//         response.headers.get("x-transaction-signature") ||
//         response.headers.get("x-payment-response");

//       if (!response.ok) {
//         const text = await response.text().catch(() => "");
//         throw new Error(
//           `HTTP ${response.status} ${response.statusText} ${text}`
//         );
//       }

//       const data = await response.json();

//       const responseData = {
//         ...data,
//         transaction: txSignature
//           ? {
//               signature: txSignature,
//               solscan: `https://solscan.io/tx/${txSignature}`,
//             }
//           : null,
//       };

//       res.status(200).json(responseData);
//     } catch (err) {
//       console.error("❌ Error:", err);
//       res.status(500).json({ error: "Failed to fetch weather resource" });
//     }
//   };

//   // GET route
//   router.get("/", (req, res) => handleRequest(req, res, "GET"));

//   // POST route
//   router.post("/", (req, res) => handleRequest(req, res, "POST"));

//   return router;
// }
