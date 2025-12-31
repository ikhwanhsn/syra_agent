// routes/agent/create-signal.js
import express from "express";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { MongoClient } from "mongodb";
import bs58 from "bs58";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Devnet USDC
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// Server's wallet (receives payments)
const SERVER_WALLET = new PublicKey(
  "Cp5yFGYx88EEuUjhDAaQzXHrgxvVeYEWixtRnLFE81K4"
);

// Price per signal
const PRICE_PER_SIGNAL = 100; // 0.0001 USDC

// Agent authentication - use environment variable for security
const AGENT_SECRET_KEY = process.env.AGENT_SECRET_KEY || "your-secret-here";

// MongoDB connection helper
let cachedClient = null;
async function getMongoClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

// Shared handler function for both GET and POST
async function handleCreateSignal(req, res) {
  try {
    // 1. Authenticate the agent request
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${AGENT_SECRET_KEY}`) {
      return res.status(401).json({
        error: "Unauthorized - Invalid agent credentials",
      });
    }

    // 2. Parse request data (from body for POST, query for GET)
    const data = req.method === "GET" ? req.query : req.body;

    const {
      privateKey,
      signal,
      token,
      ticker,
      entryPrice,
      stopLoss,
      takeProfit,
    } = data;

    // 3. Validate required fields
    if (
      !privateKey ||
      !signal ||
      !token ||
      !ticker ||
      !entryPrice ||
      !stopLoss ||
      !takeProfit
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "privateKey",
          "signal",
          "token",
          "ticker",
          "entryPrice",
          "stopLoss",
          "takeProfit",
        ],
      });
    }

    // 4. Create keypair from private key
    let agentKeypair;
    try {
      // Support both base58 and array format
      const secretKey =
        typeof privateKey === "string"
          ? bs58.decode(privateKey)
          : new Uint8Array(privateKey);

      agentKeypair = Keypair.fromSecretKey(secretKey);
      console.log("🤖 Agent wallet:", agentKeypair.publicKey.toBase58());
    } catch (error) {
      return res.status(400).json({
        error: "Invalid private key format",
      });
    }

    // 5. Get token accounts
    const SERVER_TOKEN_ACCOUNT = await getAssociatedTokenAddress(
      USDC_MINT,
      SERVER_WALLET
    );

    const agentTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      agentKeypair.publicKey
    );

    console.log("🔍 Checking token accounts...");

    // 6. Create transaction
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    const tx = new Transaction({
      feePayer: agentKeypair.publicKey,
      blockhash,
      lastValidBlockHeight,
    });

    // 7. Check if agent's token account exists
    let agentAccountExists = false;
    try {
      await getAccount(connection, agentTokenAccount);
      agentAccountExists = true;
      console.log("✅ Agent USDC account exists");
    } catch (error) {
      console.log("⚠️ Agent USDC account doesn't exist - creating it");
      tx.add(
        createAssociatedTokenAccountInstruction(
          agentKeypair.publicKey,
          agentTokenAccount,
          agentKeypair.publicKey,
          USDC_MINT
        )
      );
    }

    // 8. Check balance
    if (agentAccountExists) {
      const accountInfo = await getAccount(connection, agentTokenAccount);
      const balance = Number(accountInfo.amount);
      console.log(`💰 Agent USDC balance: ${balance / 1000000} USDC`);

      if (balance < PRICE_PER_SIGNAL) {
        return res.status(400).json({
          error: `Insufficient USDC balance. Agent has ${
            balance / 1000000
          } USDC but needs ${
            PRICE_PER_SIGNAL / 1000000
          } USDC.\n\nGet devnet USDC from: https://spl-token-faucet.com/`,
        });
      }
    }

    // 9. Check if server's token account exists
    try {
      await getAccount(connection, SERVER_TOKEN_ACCOUNT);
      console.log("✅ Server USDC account exists");
    } catch (error) {
      console.log("⚠️ Server USDC account doesn't exist - creating it");
      tx.add(
        createAssociatedTokenAccountInstruction(
          agentKeypair.publicKey,
          SERVER_TOKEN_ACCOUNT,
          SERVER_WALLET,
          USDC_MINT
        )
      );
    }

    // 10. Add transfer instruction
    tx.add(
      createTransferInstruction(
        agentTokenAccount,
        SERVER_TOKEN_ACCOUNT,
        agentKeypair.publicKey,
        PRICE_PER_SIGNAL,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    console.log(`💸 Transfer amount: ${PRICE_PER_SIGNAL / 1000000} USDC`);

    // 11. Simulate transaction
    console.log("🧪 Simulating transaction...");
    const simulation = await connection.simulateTransaction(tx);

    if (simulation.value.err) {
      console.error("❌ Simulation failed:", simulation.value.err);
      return res.status(400).json({
        error: "Transaction simulation failed",
        details: simulation.value.err,
        logs: simulation.value.logs,
      });
    }

    console.log("✅ Simulation successful");

    // 12. Sign and send transaction
    console.log("✍️ Signing transaction...");
    tx.sign(agentKeypair);

    console.log("📤 Submitting transaction...");
    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    });

    console.log("📝 Transaction signature:", signature);

    // 13. Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    const confirmation = await connection.confirmTransaction(
      signature,
      "confirmed"
    );

    if (confirmation.value.err) {
      console.error("❌ Confirmation error:", confirmation.value.err);
      return res.status(400).json({
        error: "Transaction failed on-chain",
        details: confirmation.value.err,
      });
    }

    console.log("✅ Transaction confirmed");

    // 14. Verify balance change
    const confirmedTx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!confirmedTx) {
      return res.status(400).json({
        error: "Could not fetch confirmed transaction",
      });
    }

    const postTokenBalances = confirmedTx.meta?.postTokenBalances ?? [];
    const preTokenBalances = confirmedTx.meta?.preTokenBalances ?? [];

    let amountReceived = 0;
    for (const postBal of postTokenBalances) {
      const preBal = preTokenBalances.find(
        (pre) => pre.accountIndex === postBal.accountIndex
      );

      const accountKey =
        confirmedTx.transaction.message.staticAccountKeys[postBal.accountIndex];

      if (accountKey && accountKey.equals(SERVER_TOKEN_ACCOUNT)) {
        const postAmount = postBal.uiTokenAmount.amount;
        const preAmount = preBal?.uiTokenAmount.amount ?? "0";
        amountReceived = Number(postAmount) - Number(preAmount);
        break;
      }
    }

    console.log(`💰 Payment verified: ${amountReceived / 1000000} USDC`);

    // 15. Create signal in database
    const newSignal = {
      wallet: agentKeypair.publicKey.toBase58(),
      signal,
      token,
      ticker,
      entryPrice: Number(entryPrice),
      stopLoss: Number(stopLoss),
      takeProfit: Number(takeProfit),
      status: "Pending",
      createdAt: new Date(),
      paymentSignature: signature,
      paidAmount: amountReceived / 1000000,
      facilitator: "agent",
      isAutomated: true,
      requestMethod: req.method, // Track whether it was GET or POST
    };

    const client = await getMongoClient();
    const db = client.db("syra");
    const createSignal = await db.collection("signals").insertOne(newSignal);

    if (!createSignal.acknowledged) {
      return res.status(500).json({
        error: "Signal creation failed in database",
      });
    }

    console.log("🎯 Signal created successfully by agent");

    // 16. Return success
    return res.json({
      success: true,
      message: "Signal created successfully by agent!",
      signal: {
        ...newSignal,
        _id: createSignal.insertedId,
      },
      paymentDetails: {
        signature,
        amount: amountReceived,
        amountUSDC: amountReceived / 1000000,
        recipient: SERVER_TOKEN_ACCOUNT.toBase58(),
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      },
    });
  } catch (error) {
    console.error("❌ Agent error:", error);
    return res.status(500).json({
      error: "Agent signal creation failed",
      details: error instanceof Error ? error.message : "Unknown error",
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.stack
          : undefined,
    });
  }
}

export async function createAgentSignalRouter() {
  const router = express.Router();

  // GET endpoint - parameters passed via query string
  router.get("/", handleCreateSignal);

  // POST endpoint - parameters passed via request body
  router.post("/", handleCreateSignal);

  return router;
}
