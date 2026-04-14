/**
 * Derives the reward vault ATA from .env.local (program ID + reward mint).
 * Exits 0 if configuration is valid; use explorer or tooling to read the derived vault if needed.
 *
 * Usage (from staking folder):
 *   npx ts-node scripts/get-reward-vault-address.ts
 */

import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
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

// loadEnvLocal maps NEXT_PUBLIC_* to env without prefix (e.g. STAKING_PROGRAM_ID, REWARD_MINT)
const programIdStr =
  process.env.PROGRAM_ID ||
  process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID ||
  process.env.STAKING_PROGRAM_ID ||
  "";
const rewardMintStr =
  process.env.REWARD_MINT ||
  process.env.NEXT_PUBLIC_REWARD_MINT ||
  "";

async function main() {
  if (!programIdStr || programIdStr === "11111111111111111111111111111111") {
    console.error("Set NEXT_PUBLIC_STAKING_PROGRAM_ID in .env.local");
    process.exit(1);
  }
  if (!rewardMintStr || rewardMintStr === "11111111111111111111111111111111") {
    console.error("Set NEXT_PUBLIC_REWARD_MINT in .env.local");
    process.exit(1);
  }

  const PROGRAM_ID = new PublicKey(programIdStr);
  const REWARD_MINT = new PublicKey(rewardMintStr);

  const [globalPool] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool")],
    PROGRAM_ID
  );
  await getAssociatedTokenAddress(
    REWARD_MINT,
    globalPool,
    true
  );
}

main().catch((e) => {
  console.error(e?.message ?? String(e));
  process.exit(1);
});
