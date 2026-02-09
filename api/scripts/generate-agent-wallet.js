// scripts/generate-agent-wallet.ts
// Run with: npx tsx scripts/generate-agent-wallet.ts

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";
import path from "path";

function generateAgentWallet() {
  console.log("🔐 Generating Agent Wallet...\n");

  // Generate new keypair
  const keypair = Keypair.generate();
  const privateKeyBase58 = bs58.encode(keypair.secretKey);
  const privateKeyArray = Array.from(keypair.secretKey);

  // Display information (private key is never printed to console to avoid log/screenshot exposure)
  console.log("✅ Wallet Generated Successfully!\n");
  console.log("📍 Public Key (Wallet Address):");
  console.log(keypair.publicKey.toBase58());
  console.log("\n🔑 Private key saved to files only (see below). Do not share or log it.");

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

  console.log("\n💾 Saved wallet to: .agent-wallet.json");

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

  console.log("📝 Saved .env template to: .agent-env-template.txt");

  // Security warnings
  console.log("\n⚠️  SECURITY WARNINGS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. NEVER commit .agent-wallet.json to git");
  console.log("2. NEVER share your private key with anyone");
  console.log("3. Add .agent-wallet.json to .gitignore");
  console.log("4. Store private key in environment variables only");
  console.log("5. Use different wallets for dev/staging/production");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Next steps
  console.log("\n📋 Next Steps:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. Add .agent-wallet.json to your .gitignore");
  console.log("2. Copy the environment variables to .env.local");
  console.log("3. Fund your wallet:");
  console.log("   • Get SOL: https://faucet.solana.com/");
  console.log("   • Get USDC: https://spl-token-faucet.com/");
  console.log("4. Test the agent with: npx tsx scripts/signal-agent.ts");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

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
      console.log("✅ Updated .gitignore with agent wallet files\n");
    }
  } catch (error) {
    console.log("⚠️  Could not update .gitignore automatically");
    console.log("   Please add these manually:");
    console.log("   - .agent-wallet.json");
    console.log("   - .agent-env-template.txt\n");
  }
}

// Run the generator
try {
  generateAgentWallet();
} catch (error) {
  console.error("❌ Error generating wallet:", error?.message || "Unknown error");
  process.exit(1);
}
