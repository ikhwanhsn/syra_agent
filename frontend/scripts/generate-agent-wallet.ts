// scripts/generate-agent-wallet.ts
// Run with: npx tsx scripts/generate-agent-wallet.ts

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";
import path from "path";

function generateAgentWallet() {
  // Generate new keypair
  const keypair = Keypair.generate();
  const privateKeyBase58 = bs58.encode(keypair.secretKey);
  const privateKeyArray = Array.from(keypair.secretKey);

  // Create wallet data
  const walletData = {
    publicKey: keypair.publicKey.toBase58(),
    privateKeyBase58: privateKeyBase58,
    privateKeyArray: privateKeyArray,
    createdAt: new Date().toISOString(),
    network: "solana-devnet",
  };

  // Save to file
  const filePath = path.join(process.cwd(), ".agent-wallet.json");
  fs.writeFileSync(filePath, JSON.stringify(walletData, null, 2));

  // Generate .env template
  const envTemplate = `
# ============================================
# Agent Configuration
# ============================================
# Copy these to your .env.local file

# Agent authentication secret (generate with: openssl rand -base64 32)
ADDRESS_PAYAI_PRIVATE_KEY=change-this-to-a-random-secret

# Agent wallet private key (Base58 format)
AGENT_PRIVATE_KEY=${privateKeyBase58}

# API Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
`.trim();

  const envFilePath = path.join(process.cwd(), ".agent-env-template.txt");
  fs.writeFileSync(envFilePath, envTemplate);

  // Check if .gitignore exists and update it
  const gitignorePath = path.join(process.cwd(), ".gitignore");
  try {
    let gitignoreContent = "";
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
    }

    const entriesToAdd = [".agent-wallet.json", ".agent-env-template.txt"];

    let updated = false;
    entriesToAdd.forEach((entry) => {
      if (!gitignoreContent.includes(entry)) {
        gitignoreContent += `\n${entry}`;
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(gitignorePath, gitignoreContent);
    }
  } catch (_err) {
    void _err;
  }
}

// Run the generator
try {
  generateAgentWallet();
} catch (error) {
  console.error("❌ Error generating wallet:", error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
}
