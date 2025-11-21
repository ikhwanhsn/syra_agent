import express from "express";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";

const { ADDRESS_PAYAI, PRIVATE_KEY_PAYAI, SOLANA_RPC_URL } = process.env;

if (!ADDRESS_PAYAI) {
  throw new Error("ADDRESS_PAYAI must be set");
}

if (!PRIVATE_KEY_PAYAI) {
  throw new Error("PRIVATE_KEY_PAYAI must be set for auto-payment route");
}

// USDC mint address on Solana mainnet
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// Initialize Solana connection
const connection = new Connection(
  SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  "confirmed"
);

// Load the payer keypair from private key
const payerKeypair = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY_PAYAI));

export async function createWeatherAutopayRouter() {
  const router = express.Router();

  // Auto-payment route
  router.get("/", async (req, res) => {
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
        return res.json({
          success: true,
          paymentRequired: false,
          data: data,
        });
      }

      // Step 2: Extract payment information from 402 response
      const paymentInfo = await initialResponse.json();
      console.log("Payment required:", paymentInfo);

      // Step 3: Parse x402 format
      if (!paymentInfo.accepts || paymentInfo.accepts.length === 0) {
        throw new Error(
          `No payment options found in response: ${JSON.stringify(paymentInfo)}`
        );
      }

      const paymentOption = paymentInfo.accepts[0];
      const amountUSDC = parseInt(paymentOption.maxAmountRequired);
      const recipientPubkey = new PublicKey(paymentOption.payTo);
      const usdcMint = new PublicKey(paymentOption.asset);

      console.log("Amount in USDC (smallest unit):", amountUSDC);
      console.log("Recipient:", recipientPubkey.toString());
      console.log("Asset (USDC mint):", usdcMint.toString());

      // Step 4: Get token accounts

      // Get associated token addresses for USDC
      const fromTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        payerKeypair.publicKey
      );

      const toTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        recipientPubkey
      );

      console.log("From token account:", fromTokenAccount.toString());
      console.log("To token account:", toTokenAccount.toString());

      // Step 5: Create USDC transfer transaction
      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          payerKeypair.publicKey,
          amountUSDC
        )
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

      console.log("USDC payment transaction sent:", signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
      console.log("Payment confirmed");

      // Step 6: Make the request again with payment proof
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
        paymentRequired: true,
        payment: {
          signature,
          amount: amountUSDC / 1e6,
          currency: "USDC",
          recipient: recipientPubkey.toString(),
          payer: payerKeypair.publicKey.toString(),
        },
        data: weatherData,
      });
    } catch (error) {
      console.error("Auto-payment error:", error);
      res.status(500).json({
        success: false,
        error: "Auto-payment failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}
