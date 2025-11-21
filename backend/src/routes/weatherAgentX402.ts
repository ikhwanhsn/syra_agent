// import express from "express";
// import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";
// import fetch from "node-fetch";

// const { AGENT_KEYPAIR, BASE_URL } = process.env;

// if (!AGENT_KEYPAIR || !BASE_URL) {
//   throw new Error("AGENT_KEYPAIR and BASE_URL must be set");
// }

// const agentKeypair = Keypair.fromSecretKey(
//   Uint8Array.from(JSON.parse(AGENT_KEYPAIR))
// );

// const network = "solana"; // or "solana" for mainnet
// const connection = new Connection(
//   network === "solana"
//     ? "https://api.mainnet-beta.solana.com"
//     : "https://api.devnet.solana.com"
// );

// // Helper to handle 402 payment flow
// async function fetchWithPayment(url: string, options: any = {}) {
//   let response = await fetch(url, options);

//   // If 402, handle payment
//   if (response.status === 402) {
//     const paymentRequired = await response.json();

//     console.log("💳 Payment required, processing...");

//     // Get payment details from response
//     const { price, facilitatorUrl } = paymentRequired;

//     // Create payment transaction via facilitator
//     const paymentResponse = await fetch(`${facilitatorUrl}/create-payment`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         price,
//         payerAddress: agentKeypair.publicKey.toBase58(),
//       }),
//     });

//     const { transaction: txBase64 } = await paymentResponse.json();

//     // Decode and sign transaction
//     const txBuffer = Buffer.from(txBase64, "base64");
//     const transaction = VersionedTransaction.deserialize(txBuffer);
//     transaction.sign([agentKeypair]);

//     // Send transaction
//     const signature = await connection.sendTransaction(transaction);
//     await connection.confirmTransaction(signature);

//     console.log("✅ Payment sent:", signature);

//     // Retry original request with payment proof
//     response = await fetch(url, {
//       ...options,
//       headers: {
//         ...options.headers,
//         "X-Payment": signature,
//       },
//     });
//   }

//   return response;
// }

// export async function createWeatherAgentX402Router() {
//   const router = express.Router();

//   // Reusable request handler
//   const handleRequest = async (
//     req: express.Request,
//     res: express.Response,
//     method: "GET" | "POST"
//   ) => {
//     try {
//       console.log(`🤖 Agent paying automatically (${method})...`);

//       const response = await fetchWithPayment(`${BASE_URL}/weather`, {
//         method,
//         headers: {
//           Accept: "application/json",
//           "Content-Type": "application/json",
//         },
//         ...(method === "POST" ? { body: JSON.stringify(req.body || {}) } : {}),
//       });

//       if (!response.ok) {
//         const text = await response.text().catch(() => "");
//         throw new Error(
//           `HTTP ${response.status} ${response.statusText} ${text}`
//         );
//       }

//       const data = await response.json();

//       res.status(200).json(data);
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

import express from "express";
import { paymentMiddleware } from "x402-express";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import bs58 from "bs58";

const {
  FACILITATOR_URL_PAYAI,
  ADDRESS_PAYAI,
  PRIVATE_KEY_PAYAI,
  SOLANA_RPC_URL,
} = process.env;

if (!FACILITATOR_URL_PAYAI || !ADDRESS_PAYAI) {
  throw new Error("FACILITATOR_URL_PAYAI and ADDRESS_PAYAI must be set");
}

if (!PRIVATE_KEY_PAYAI) {
  throw new Error("PRIVATE_KEY_PAYAI must be set for auto-payment route");
}

// Initialize Solana connection
const connection = new Connection(
  SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  "confirmed"
);

// Load the payer keypair from private key
const payerKeypair = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_PAYAI));

export async function createWeatherRouter() {
  const router = express.Router();

  // Original protected route
  const middleware = paymentMiddleware(
    ADDRESS_PAYAI as `0x${string}`,
    {
      "GET /": {
        price: "$0.0001",
        network: "solana",
      },
    },
    {
      url: FACILITATOR_URL_PAYAI as `https://${string}`,
    }
  );

  router.get("/", middleware, (req, res) => {
    res.json({
      report: {
        weather: "sunny",
        temperature: 70,
      },
    });
  });

  // New auto-payment route
  router.get("/autopay", async (req, res) => {
    try {
      console.log("Auto-payment route called");

      // Step 1: Make initial request to get payment details
      const initialResponse = await fetch(
        `${req.protocol}://${req.get("host")}/weather`,
        {
          method: "GET",
        }
      );

      if (initialResponse.status !== 402) {
        // If no payment required, return the response directly
        const data = await initialResponse.json();
        return res.json(data);
      }

      // Step 2: Extract payment information from 402 response
      const paymentInfo = await initialResponse.json();
      console.log("Payment required:", paymentInfo);

      // Step 3: Create and send payment transaction
      const recipientPubkey = new PublicKey(ADDRESS_PAYAI as `0x${string}`);
      const amountLamports = Math.floor(parseFloat(paymentInfo.price) * 1e9); // Convert SOL to lamports

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payerKeypair.publicKey,
          toPubkey: recipientPubkey,
          lamports: amountLamports,
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payerKeypair.publicKey;

      // Sign and send transaction
      transaction.sign(payerKeypair);
      const signature = await connection.sendRawTransaction(
        transaction.serialize()
      );

      console.log("Payment transaction sent:", signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
      console.log("Payment confirmed");

      // Step 4: Make the request again with payment proof
      const paidResponse = await fetch(
        `${req.protocol}://${req.get("host")}/weather`,
        {
          method: "GET",
          headers: {
            "X-Payment-Signature": signature,
            "X-Payment-Network": "solana",
          },
        }
      );

      const weatherData = await paidResponse.json();

      res.json({
        success: true,
        payment: {
          signature,
          amount: amountLamports / 1e9,
          recipient: ADDRESS_PAYAI,
        },
        data: weatherData,
      });
    } catch (error) {
      console.error("Auto-payment error:", error);
      res.status(500).json({
        error: "Auto-payment failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}
