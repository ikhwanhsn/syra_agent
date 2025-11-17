// scripts/signal-agent.ts
// Run this with: npx tsx scripts/signal-agent.ts
// Or use with cron/n8n

// ✅ Load environment variables FIRST
import dotenv from "dotenv";
import path from "path";

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

// Configuration
const API_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const AGENT_SECRET_KEY = process.env.AGENT_SECRET_KEY || "your-secret-here";
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY!; // Base58 encoded private key

// Supported trading pairs
const TRADING_PAIRS = [
  { token: "Bitcoin", ticker: "BTC" },
  { token: "Ethereum", ticker: "ETH" },
  { token: "Solana", ticker: "SOL" },
  { token: "Cardano", ticker: "ADA" },
  { token: "Binance Coin", ticker: "BNB" },
];

interface SignalData {
  signal: "Buy" | "Sell";
  token: string;
  ticker: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
}

/**
 * Fetch current market price from Binance
 */
async function fetchMarketPrice(ticker: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${ticker}USDT`
    );
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`❌ Error fetching price for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Generate a trading signal based on technical analysis
 * This is a simple example - you should implement your actual trading strategy
 */
async function generateSignal(): Promise<SignalData> {
  // Select random trading pair
  const pair = TRADING_PAIRS[Math.floor(Math.random() * TRADING_PAIRS.length)];

  console.log(`📊 Analyzing ${pair.token} (${pair.ticker})...`);

  // Fetch current price
  const currentPrice = await fetchMarketPrice(pair.ticker);
  console.log(`💵 Current price: $${currentPrice.toFixed(2)}`);

  // Generate random signal type (in production, use real analysis)
  const signalType: "Buy" | "Sell" = Math.random() > 0.5 ? "Buy" : "Sell";

  let signal: SignalData;

  if (signalType === "Buy") {
    // Buy signal: entry below current price
    const entryPrice = currentPrice * (0.95 + Math.random() * 0.04); // 1-5% below
    const stopLoss = entryPrice * (0.95 - Math.random() * 0.04); // 4-5% below entry
    const takeProfit = entryPrice * (1.02 + Math.random() * 0.05); // 2-7% above entry

    signal = {
      signal: "Buy",
      token: pair.token,
      ticker: pair.ticker,
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      takeProfit: parseFloat(takeProfit.toFixed(2)),
    };
  } else {
    // Sell signal: entry above current price
    const entryPrice = currentPrice * (1.01 + Math.random() * 0.04); // 1-5% above
    const stopLoss = entryPrice * (1.01 + Math.random() * 0.04); // 1-5% above entry
    const takeProfit = entryPrice * (0.95 - Math.random() * 0.04); // 4-5% below entry

    signal = {
      signal: "Sell",
      token: pair.token,
      ticker: pair.ticker,
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      takeProfit: parseFloat(takeProfit.toFixed(2)),
    };
  }

  console.log(`🎯 Generated ${signal.signal} signal:`);
  console.log(`   Entry: $${signal.entryPrice}`);
  console.log(`   Stop Loss: $${signal.stopLoss}`);
  console.log(`   Take Profit: $${signal.takeProfit}`);

  return signal;
}

/**
 * Create signal via API
 */
async function createSignal(signalData: SignalData): Promise<void> {
  try {
    console.log("\n🚀 Creating signal via agent API...");

    const response = await fetch(`${API_URL}/api/signal/create/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AGENT_SECRET_KEY}`,
      },
      body: JSON.stringify({
        privateKey: AGENT_PRIVATE_KEY,
        ...signalData,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Signal created successfully!");
      console.log(`📝 Transaction: ${result.paymentDetails.explorerUrl}`);
      console.log(`💰 Paid: ${result.paymentDetails.amountUSDC} USDC`);
      console.log(`🆔 Signal ID: ${result.signal._id}`);
    } else {
      console.error("❌ Failed to create signal:", result.error);
      if (result.details) {
        console.error("Details:", result.details);
      }
    }
  } catch (error) {
    console.error("❌ Error creating signal:", error);
    throw error;
  }
}

/**
 * Main agent function
 */
async function runAgent() {
  console.log("🤖 Trading Signal Agent Starting...");
  console.log(`⏰ Time: ${new Date().toISOString()}\n`);

  try {
    // Validate private key
    if (!AGENT_PRIVATE_KEY) {
      throw new Error("AGENT_PRIVATE_KEY environment variable is required");
    }

    // Verify keypair can be created
    const keypair = Keypair.fromSecretKey(bs58.decode(AGENT_PRIVATE_KEY));
    console.log(`🔑 Agent wallet: ${keypair.publicKey.toBase58()}\n`);

    // Generate signal
    const signal = await generateSignal();

    // Create signal
    await createSignal(signal);

    console.log("\n✅ Agent execution completed successfully");
  } catch (error) {
    console.error("\n❌ Agent execution failed:", error);
    process.exit(1);
  }
}

// Run the agent
runAgent();
