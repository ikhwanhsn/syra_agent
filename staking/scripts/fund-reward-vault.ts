/**
 * Fund the staking pool's reward vault so users can claim rewards.
 *
 * The pool authority (or anyone with reward tokens) sends reward tokens
 * to the reward vault ATA. Run this when you see "Reward vault has insufficient balance".
 *
 * Uses .env.local for RPC, program ID, reward mint, and decimals.
 *
 * Usage (from staking folder):
 *   npx ts-node scripts/fund-reward-vault.ts [amount]
 *   # amount = reward tokens in human form (e.g. 1000 = 1000 tokens). Default: 10000
 *
 * Or with env:
 *   AMOUNT=5000 npx ts-node scripts/fund-reward-vault.ts
 */

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getMint,
} from "@solana/spl-token";
import { Transaction } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const i = trimmed.indexOf("=");
      if (i > 0) {
        const key = trimmed.slice(0, i).trim();
        let val = trimmed.slice(i + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
          val = val.slice(1, -1);
        if (key.startsWith("NEXT_PUBLIC_")) {
          const envKey = key.replace("NEXT_PUBLIC_", "");
          if (!process.env[envKey]) process.env[envKey] = val;
        } else if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnvLocal();

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID || ""
);
const REWARD_MINT = new PublicKey(
  process.env.REWARD_MINT || process.env.NEXT_PUBLIC_REWARD_MINT || ""
);
const REWARD_DECIMALS = Number(
  process.env.NEXT_PUBLIC_REWARD_DECIMALS || "6"
);
const AMOUNT_HUMAN = Number(process.env.AMOUNT || process.argv[2] || "10000");

async function main() {
  console.log("💰 Fund reward vault\n");

  if (!PROGRAM_ID.toBase58() || PROGRAM_ID.toBase58() === "11111111111111111111111111111111") {
    console.error("Set NEXT_PUBLIC_STAKING_PROGRAM_ID in .env.local");
    process.exit(1);
  }
  if (!REWARD_MINT.toBase58() || REWARD_MINT.toBase58() === "11111111111111111111111111111111") {
    console.error("Set NEXT_PUBLIC_REWARD_MINT in .env.local");
    process.exit(1);
  }

  const amountRaw = BigInt(Math.floor(AMOUNT_HUMAN * 10 ** REWARD_DECIMALS));
  if (amountRaw <= 0n) {
    console.error("Provide a positive amount (e.g. 10000 or AMOUNT=5000)");
    process.exit(1);
  }

  const defaultPath =
    process.platform === "win32"
      ? path.join(process.env.APPDATA || "", "Solana", "id.json")
      : path.join(process.env.HOME || "", ".config", "solana", "id.json");
  const walletPath = process.env.WALLET_PATH || defaultPath;
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  const connection = new Connection(RPC_URL, "confirmed");
  const [globalPool] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool")],
    PROGRAM_ID
  );

  const rewardVault = await getAssociatedTokenAddress(
    REWARD_MINT,
    globalPool,
    true
  );
  const sourceAta = await getAssociatedTokenAddress(
    REWARD_MINT,
    walletKeypair.publicKey,
    false
  );

  console.log("Configuration:");
  console.log("  RPC:", RPC_URL);
  console.log("  Program ID:", PROGRAM_ID.toBase58());
  console.log("  Reward mint:", REWARD_MINT.toBase58());
  console.log("  Amount (human):", AMOUNT_HUMAN, "tokens");
  console.log("  Amount (raw):", amountRaw.toString());
  console.log("  Reward vault (destination):", rewardVault.toBase58());
  console.log("  Your reward ATA (source):", sourceAta.toBase58());
  console.log("");

  const sourceInfo = await connection.getAccountInfo(sourceAta);
  if (!sourceInfo) {
    console.error("❌ Your wallet has no reward token ATA. Create one and receive reward tokens first.");
    process.exit(1);
  }

  const mintInfo = await getMint(connection, REWARD_MINT);
  if (mintInfo.decimals !== REWARD_DECIMALS) {
    console.warn("⚠️  Mint decimals:", mintInfo.decimals, "vs config NEXT_PUBLIC_REWARD_DECIMALS:", REWARD_DECIMALS);
  }

  const ix = createTransferInstruction(
    sourceAta,
    rewardVault,
    walletKeypair.publicKey,
    Number(amountRaw)
  );
  const tx = new Transaction().add(ix);
  const sig = await connection.sendTransaction(tx, [walletKeypair], {
    skipPreflight: false,
    preflightCommitment: "confirmed",
    maxRetries: 3,
  });
  console.log("✅ Sent", AMOUNT_HUMAN, "reward tokens to the vault.");
  console.log("   Signature:", sig);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
