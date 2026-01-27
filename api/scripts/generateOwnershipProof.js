// Script to generate x402 ownership proof for discovery document
// Usage: node scripts/generateOwnershipProof.js
//
// First install tweetnacl: npm install tweetnacl
// Or run: npm install && node scripts/generateOwnershipProof.js

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

// The origin URL to sign (NO trailing slash)
const ORIGIN = "https://api.syraa.fun";

// ed25519 signing using Keypair's secretKey
// The secretKey contains both private key (32 bytes) + public key (32 bytes)
function signMessage(message, secretKey) {
  // Import nacl dynamically to handle if not installed
  return import("tweetnacl")
    .then((nacl) => {
      return nacl.default.sign.detached(message, secretKey);
    })
    .catch(() => {
      // Fallback: use the sign from @solana/web3.js internal
      // This is a simplified ed25519 signature
      console.log("Note: tweetnacl not found, attempting alternative signing...");
      const { sign } = require("@noble/ed25519");
      const privateKey = secretKey.slice(0, 32);
      return sign(message, privateKey);
    });
}

async function generateOwnershipProof() {
  // Get the private key from environment variable
  // This should be the private key corresponding to your ADDRESS_PAYAI (payTo address)
  const privateKey = process.env.ADDRESS_PAYAI_PRIVATE_KEY;

  if (!privateKey) {
    console.error("❌ ADDRESS_PAYAI_PRIVATE_KEY environment variable not set");
    console.log("\nTo generate the ownership proof, you need to:");
    console.log(
      "1. Add ADDRESS_PAYAI_PRIVATE_KEY to your .env file (base58 format)",
    );
    console.log(
      "2. This is the private key for your payTo address:",
      process.env.ADDRESS_PAYAI,
    );
    console.log("3. Run this script again\n");
    console.log("\nExample .env entry:");
    console.log("ADDRESS_PAYAI_PRIVATE_KEY=your_base58_encoded_private_key_here\n");
    process.exit(1);
  }

  try {
    // Decode the private key (base58 format)
    const secretKey = bs58.decode(privateKey);
    const keypair = Keypair.fromSecretKey(secretKey);

    console.log("🔑 Signing origin URL:", ORIGIN);
    console.log("📍 Using payTo address:", keypair.publicKey.toBase58());

    // Sign the origin URL
    const message = new TextEncoder().encode(ORIGIN);

    let signature;
    try {
      // Try to import tweetnacl
      const nacl = await import("tweetnacl");
      signature = nacl.default.sign.detached(message, keypair.secretKey);
    } catch (e) {
      console.error(
        "\n❌ tweetnacl not installed. Please install it first:\n",
      );
      console.log("   npm install tweetnacl\n");
      console.log("Then run this script again.");
      process.exit(1);
    }

    // Convert to hex format with 0x prefix
    const signatureHex = "0x" + Buffer.from(signature).toString("hex");

    console.log("\n✅ Ownership proof generated successfully!\n");
    console.log("=".repeat(60));
    console.log("Add this to your .env file:\n");
    console.log(`X402_OWNERSHIP_PROOF=${signatureHex}`);
    console.log("\n" + "=".repeat(60));
    console.log("\nThe signature will be automatically used in /.well-known/x402");
    console.log("\nVerification details:");
    console.log(`  Origin signed: ${ORIGIN}`);
    console.log(`  PayTo address: ${keypair.publicKey.toBase58()}`);
    console.log(`  Signature length: ${signatureHex.length} chars`);

    return signatureHex;
  } catch (error) {
    console.error("❌ Error generating ownership proof:", error.message);
    process.exit(1);
  }
}

generateOwnershipProof();
