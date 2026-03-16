/**
 * Script to generate x402 ownership proofs for discovery document
 * 
 * This generates ownership proofs for BOTH EVM (Base) and Solana addresses
 * to enable verification on x402scan for all supported networks.
 * 
 * Usage: node scripts/generateOwnershipProof.js
 * 
 * Prerequisites:
 *   npm install tweetnacl ethers
 * 
 * x402 V2 supports multiple payment networks, so we generate proofs for:
 * - EVM (Base Mainnet): eip155:8453
 * - Solana Mainnet: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
 */

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";
import { writeFile } from "fs/promises";

dotenv.config();

// The origin URL to sign (NO trailing slash)
const ORIGIN = "https://api.syraa.fun";

function maskValue(value) {
  if (!value || value.length < 18) return "***";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

/**
 * Generate Solana (SVM) ownership proof
 */
async function generateSolanaOwnershipProof() {
  const privateKey = process.env.SVM_PRIVATE_KEY || process.env.ADDRESS_PAYAI_PRIVATE_KEY;

  if (!privateKey) {
    console.log("⏭️  Skipping Solana proof: SVM_PRIVATE_KEY not set");
    return null;
  }

  try {
    // Decode the private key (base58 format)
    const secretKey = bs58.decode(privateKey);
    const keypair = Keypair.fromSecretKey(secretKey);

    console.log("🔑 [Solana] Signing origin URL:", ORIGIN);
    console.log("📍 [Solana] PayTo address:", keypair.publicKey.toBase58());

    // Sign the origin URL
    const message = new TextEncoder().encode(ORIGIN);

    let signature;
    try {
      const nacl = await import("tweetnacl");
      signature = nacl.default.sign.detached(message, keypair.secretKey);
    } catch (e) {
      console.error("\n❌ tweetnacl not installed. Please run: npm install tweetnacl\n");
      return null;
    }

    // Convert to hex format with 0x prefix
    const signatureHex = "0x" + Buffer.from(signature).toString("hex");

    console.log("✅ [Solana] Ownership proof generated successfully!");
    return {
      network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      address: keypair.publicKey.toBase58(),
      signature: signatureHex,
    };
  } catch (error) {
    console.error("❌ [Solana] Error generating ownership proof:", error.message);
    return null;
  }
}

/**
 * Generate EVM (Base) ownership proof
 */
async function generateEvmOwnershipProof() {
  const privateKey = process.env.EVM_PRIVATE_KEY;

  if (!privateKey) {
    console.log("⏭️  Skipping EVM proof: EVM_PRIVATE_KEY not set");
    return null;
  }

  try {
    // Dynamically import ethers
    const { Wallet } = await import("ethers");

    // Create wallet from private key
    const wallet = new Wallet(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);

    console.log("🔑 [EVM] Signing origin URL:", ORIGIN);
    console.log("📍 [EVM] PayTo address:", wallet.address);

    // Sign the origin URL
    const signature = await wallet.signMessage(ORIGIN);

    console.log("✅ [EVM] Ownership proof generated successfully!");
    return {
      network: "eip155:8453",
      address: wallet.address,
      signature: signature,
    };
  } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND") {
      console.log("⏭️  Skipping EVM proof: ethers not installed. Run: npm install ethers");
    } else {
      console.error("❌ [EVM] Error generating ownership proof:", error.message);
    }
    return null;
  }
}

async function generateOwnershipProofs() {
  console.log("\n" + "=".repeat(60));
  console.log("x402 Ownership Proof Generator (V2)");
  console.log("=".repeat(60) + "\n");

  const proofs = [];

  // Generate Solana proof
  const solanaProof = await generateSolanaOwnershipProof();
  if (solanaProof) proofs.push(solanaProof);

  console.log(""); // Spacing

  // Generate EVM proof
  const evmProof = await generateEvmOwnershipProof();
  if (evmProof) proofs.push(evmProof);

  if (proofs.length === 0) {
    console.error("\n❌ No ownership proofs could be generated!");
    console.log("\nTo generate ownership proofs, add these to your .env file:");
    console.log("  SVM_PRIVATE_KEY=your_solana_private_key_base58");
    console.log("  EVM_PRIVATE_KEY=your_evm_private_key_hex");
    console.log("\nThese should be the private keys for your payTo addresses:");
    console.log(`  SVM_ADDRESS=${process.env.SVM_ADDRESS ? "(set)" : "(not set)"}`);
    console.log(`  EVM_ADDRESS=${process.env.EVM_ADDRESS ? "(set)" : "(not set)"}`);
    process.exit(1);
  }

  const envOutput = [];
  for (const proof of proofs) {
    if (proof.network.startsWith("solana")) {
      envOutput.push(`X402_OWNERSHIP_PROOF_SVM=${proof.signature}`);
    } else if (proof.network.startsWith("eip155")) {
      envOutput.push(`X402_OWNERSHIP_PROOF_EVM=${proof.signature}`);
    }
  }

  const outputPath = ".x402-ownership-proof.env";
  await writeFile(outputPath, `${envOutput.join("\n")}\n`, "utf8");

  console.log("\n" + "=".repeat(60));
  console.log("Ownership proofs saved privately:");
  console.log("=".repeat(60) + "\n");
  console.log(`Saved to ${outputPath} (do not commit or share this file)\n`);

  for (const line of envOutput) {
    const [key, value] = line.split("=");
    console.log(`${key}=${maskValue(value)}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Verification details:");
  console.log("=".repeat(60) + "\n");

  console.log(`Origin signed: ${ORIGIN}\n`);
  for (const proof of proofs) {
    console.log(`Network: ${proof.network}`);
    console.log(`Address: ${proof.address}`);
    console.log(`Signature length: ${proof.signature.length} chars\n`);
  }

  console.log("The signatures will be automatically used in /.well-known/x402\n");

  return proofs;
}

generateOwnershipProofs();
