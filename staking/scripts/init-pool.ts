/**
 * Initialize staking pool script
 *
 * Uses .env.local if present (NEXT_PUBLIC_* and PROGRAM_ID/STAKING_MINT/REWARD_MINT/REWARD_PER_SECOND).
 *
 * Usage (from staking folder):
 *   npx ts-node scripts/init-pool.ts
 * Or with env:
 *   PROGRAM_ID=... STAKING_MINT=... REWARD_MINT=... REWARD_PER_SECOND=1000 npx ts-node scripts/init-pool.ts
 */

import anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Program, AnchorProvider, Wallet, BN } = anchor;

// ESM has no __dirname; derive from import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local from project root (staking folder)
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

// Configuration (env from .env.local or explicit)
const RPC_URL =
  process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const STAKING_MINT = new PublicKey(
  process.env.STAKING_MINT || process.env.NEXT_PUBLIC_STAKING_MINT || ""
);
const REWARD_MINT = new PublicKey(
  process.env.REWARD_MINT || process.env.NEXT_PUBLIC_REWARD_MINT || ""
);
const REWARD_PER_SECOND = Number(
  process.env.REWARD_PER_SECOND || process.env.NEXT_PUBLIC_REWARD_PER_SECOND || "1000"
);

async function main() {
  console.log("🚀 Initializing staking pool...\n");

  if (!STAKING_MINT.toBase58() || STAKING_MINT.toBase58() === "11111111111111111111111111111111") {
    console.error("Set STAKING_MINT or NEXT_PUBLIC_STAKING_MINT in .env.local");
    process.exit(1);
  }
  if (!REWARD_MINT.toBase58() || REWARD_MINT.toBase58() === "11111111111111111111111111111111") {
    console.error("Set REWARD_MINT or NEXT_PUBLIC_REWARD_MINT in .env.local");
    process.exit(1);
  }

  // Load wallet (default: same as solana CLI — Linux/Mac or Windows)
  const defaultPath =
    process.platform === "win32"
      ? path.join(process.env.APPDATA || "", "Solana", "id.json")
      : path.join(process.env.HOME || "", ".config", "solana", "id.json");
  const walletPath = process.env.WALLET_PATH || defaultPath;
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  // Setup connection and provider
  const connection = new Connection(RPC_URL, "confirmed");
  console.log("RPC URL:", RPC_URL);

  // Preflight: ensure RPC is reachable before sending tx
  try {
    await connection.getLatestBlockhash("confirmed");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("\n❌ Cannot reach Solana RPC. Check:");
    console.error("   1. Network connection and firewall (RPC URL:", RPC_URL, ")");
    console.error("   2. Try a different RPC in .env.local (e.g. Helius/QuickNode devnet)");
    console.error("   3. If using WSL or VPN, try from another network.\n");
    console.error("Original error:", msg);
    process.exit(1);
  }

  const wallet = new Wallet(walletKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load program — use PROGRAM_ID from env so it matches the deployed program (IDL may be stale)
  const idl = JSON.parse(
    fs.readFileSync("target/idl/staking.json", "utf-8")
  );
  const programId = new PublicKey(
    process.env.PROGRAM_ID || process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID || idl.address || ""
  );
  // Override IDL address so the client invokes the correct program (avoids DeclaredProgramIdMismatch if IDL was from another build)
  const idlWithProgramId = { ...idl, address: programId.toBase58() };
  const program = new Program(idlWithProgramId as any, provider) as anchor.Program;

  // Derive PDAs
  const [globalPool] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool")],
    programId
  );

  const stakingVault = await getAssociatedTokenAddress(
    STAKING_MINT,
    globalPool,
    true
  );

  const rewardVault = await getAssociatedTokenAddress(
    REWARD_MINT,
    globalPool,
    true
  );

  console.log("Configuration:");
  console.log("  Program ID:", programId.toBase58());
  console.log("  Authority:", wallet.publicKey.toBase58());
  console.log("  Staking Mint:", STAKING_MINT.toBase58());
  console.log("  Reward Mint:", REWARD_MINT.toBase58());
  console.log("  Reward Per Second:", REWARD_PER_SECOND);
  console.log("  Global Pool:", globalPool.toBase58());
  console.log("  Staking Vault:", stakingVault.toBase58());
  console.log("  Reward Vault:", rewardVault.toBase58());
  console.log("");

  try {
    const tx = await program.methods
      .initialize(new BN(REWARD_PER_SECOND))
      .accounts({
        globalPool,
        authority: wallet.publicKey,
        stakingMint: STAKING_MINT,
        rewardMint: REWARD_MINT,
        stakingVault,
        rewardVault,
      })
      .rpc();

    console.log("✅ Pool initialized successfully!");
    console.log("   Transaction:", tx);
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
