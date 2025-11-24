import express from "express";
import fetch from "node-fetch";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { lookupKnownSPLToken } from "@faremeter/info/solana";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { wrap as wrapFetch } from "@faremeter/fetch";

const { AGENT_KEYPAIR, BASE_URL } = process.env;

if (!AGENT_KEYPAIR) {
  throw new Error("AGENT_KEYPAIR must be set in your environment");
}

// Convert secret key string to keypair
const agentKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(AGENT_KEYPAIR))
);

const network = "mainnet-beta";
const splTokenName = "USDC";

const usdcInfo: any = lookupKnownSPLToken(network, splTokenName);
if (!usdcInfo) {
  throw new Error(`Couldn't look up SPLToken ${splTokenName} on ${network}!`);
}

// --------------------------------------------------------
//  MAIN: Create Router (ASYNC SAFELY)
// --------------------------------------------------------
export async function createAgentRouter() {
  const router = express.Router();

  const connection = new Connection(clusterApiUrl(network));
  const usdcMint = new PublicKey(usdcInfo.address);

  const wallet = await createLocalWallet(network, agentKeypair);
  const fetchWithPayer = wrapFetch(fetch as any, {
    handlers: [createPaymentHandler(wallet, usdcMint, connection)],
  });

  // Reusable request handler
  const handleRequest = async (
    req: express.Request,
    res: express.Response,
    method: "GET" | "POST"
  ) => {
    try {
      console.log(`🤖 Agent paying automatically (${method})...`);

      const response = await fetchWithPayer(`${BASE_URL}/protected`, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        ...(method === "POST" ? { body: JSON.stringify(req.body || {}) } : {}),
      });

      const txSignature =
        response.headers.get("x-solana-signature") ||
        response.headers.get("x-transaction-signature");

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `HTTP ${response.status} ${response.statusText} ${text}`
        );
      }

      const data: any = await response.json();

      const responseData = {
        ...data,
        transaction: txSignature
          ? {
              signature: txSignature,
              solscan: `https://solscan.io/tx/${txSignature}`,
            }
          : null,
      };

      res.status(200).json(responseData);
    } catch (err) {
      console.error("❌ Error:", err);
      res.status(500).json({ error: "Failed to fetch protected resource" });
    }
  };

  // GET route
  router.get("/", (req, res) => handleRequest(req, res, "GET"));

  // POST route
  router.post("/", (req, res) => handleRequest(req, res, "POST"));

  return router;
}
