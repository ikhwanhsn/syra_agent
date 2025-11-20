import express from "express";
import { createMiddleware } from "@faremeter/middleware/express";
import {
  lookupKnownSPLToken,
  x402Exact,
  xSolanaSettlement,
} from "@faremeter/info/solana";
import { Keypair } from "@solana/web3.js";

const { PAYER_KEYPAIR } = process.env;

if (!PAYER_KEYPAIR) {
  throw new Error("PAYER_KEYPAIR must be set in your environment");
}

const payToKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(PAYER_KEYPAIR))
);

const network = "mainnet-beta";
const asset = "USDC";

// Look up USDC
const usdcInfo = lookupKnownSPLToken(network, asset);
if (!usdcInfo)
  throw new Error(`Couldn't find SPL token ${asset} on ${network}!`);

const payTo = payToKeypair.publicKey.toBase58();

// ----------------------------------------------------
//  FIXED VERSION — RETURNS FUNCTION, NOT PROMISE
// ----------------------------------------------------
export async function createProtectedRouter() {
  const router = express.Router();

  const middleware = await createMiddleware({
    facilitatorURL:
      process.env.FAREMETER_FACILITATOR_URL ||
      "https://facilitator.corbits.dev",

    accepts: [
      xSolanaSettlement({
        network,
        payTo,
        asset: "USDC",
        amount: "100", // 0.01 USDC
      }),
      xSolanaSettlement({
        network,
        payTo,
        asset: "sol",
        amount: "1000000",
      }),
      x402Exact({
        network,
        asset: "USDC",
        amount: "100",
        payTo,
      }),
    ],
  });

  // GET route
  router.get("/", middleware, (_, res) => {
    res.json({ msg: "success" });
  });

  // POST route
  router.post("/", middleware, (_, res) => {
    res.json({ msg: "success" });
  });

  return router;
}
