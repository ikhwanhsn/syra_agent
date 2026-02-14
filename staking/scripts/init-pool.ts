/**
 * Initialize staking pool script
 * 
 * Usage: ts-node scripts/init-pool.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import fs from "fs";

// Configuration
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const STAKING_MINT = new PublicKey(process.env.STAKING_MINT || "");
const REWARD_MINT = new PublicKey(process.env.REWARD_MINT || "");
const REWARD_PER_SECOND = Number(process.env.REWARD_PER_SECOND || "1000000");

async function main() {
  console.log("🚀 Initializing staking pool...\n");

  // Load wallet
  const walletPath = process.env.WALLET_PATH || `${process.env.HOME}/.config/solana/id.json`;
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );

  // Setup connection and provider
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new Wallet(walletKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load program (Anchor 0.30: Program(idl, provider); programId comes from idl.address)
  const idl = JSON.parse(
    fs.readFileSync("target/idl/staking.json", "utf-8")
  );
  const programId = new PublicKey(
    process.env.PROGRAM_ID || idl.address || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
  );
  const program = new Program(idl as any, provider) as anchor.Program;

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
      .initialize(new anchor.BN(REWARD_PER_SECOND))
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
