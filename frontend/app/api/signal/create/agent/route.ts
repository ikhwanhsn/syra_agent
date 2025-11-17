// app/api/agent/create-signal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import clientPromise from "@/lib/mongodb";
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

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the agent request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${AGENT_SECRET_KEY}`) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid agent credentials" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const {
      privateKey,
      signal,
      token,
      ticker,
      entryPrice,
      stopLoss,
      takeProfit,
    } = await req.json();

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
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 4. Create keypair from private key
    let agentKeypair: Keypair;
    try {
      // Support both base58 and array format
      const secretKey =
        typeof privateKey === "string"
          ? bs58.decode(privateKey)
          : new Uint8Array(privateKey);

      agentKeypair = Keypair.fromSecretKey(secretKey);
      console.log("🤖 Agent wallet:", agentKeypair.publicKey.toBase58());
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid private key format" },
        { status: 400 }
      );
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
        return NextResponse.json(
          {
            error: `Insufficient USDC balance. Agent has ${
              balance / 1000000
            } USDC but needs ${
              PRICE_PER_SIGNAL / 1000000
            } USDC.\n\nGet devnet USDC from: https://spl-token-faucet.com/`,
          },
          { status: 400 }
        );
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
      return NextResponse.json(
        {
          error: "Transaction simulation failed",
          details: simulation.value.err,
          logs: simulation.value.logs,
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          error: "Transaction failed on-chain",
          details: confirmation.value.err,
        },
        { status: 400 }
      );
    }

    console.log("✅ Transaction confirmed");

    // 14. Verify balance change
    const confirmedTx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!confirmedTx) {
      return NextResponse.json(
        { error: "Could not fetch confirmed transaction" },
        { status: 400 }
      );
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
    };

    const client = await clientPromise;
    const db = client.db("syra");
    const createSignal = await db.collection("signals").insertOne(newSignal);

    if (!createSignal.acknowledged) {
      return NextResponse.json(
        { error: "Signal creation failed in database" },
        { status: 500 }
      );
    }

    console.log("🎯 Signal created successfully by agent");

    // 16. Return success
    return NextResponse.json({
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
    return NextResponse.json(
      {
        error: "Agent signal creation failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
