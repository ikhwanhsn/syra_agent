/**
 * Generate a new EVM keypair for Tempo (same format as Ethereum: 0x address + hex private key).
 *
 * Run from api/:  npm run generate-tempo-wallet
 *
 * Writes secrets to .tempo-wallet.local.json (gitignored). Prints address only to stdout.
 * Never commit the JSON file or share your private key.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "..", ".tempo-wallet.local.json");

function main() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const payload = {
    network: "tempo-evm",
    note: "Tempo uses EVM-style accounts. Same address works on Tempo mainnet (4217) and Moderato testnet (42431).",
    address: account.address,
    privateKey,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), { mode: 0o600 });

  console.log("\n✅ Tempo / EVM wallet generated\n");
  console.log("Public address (use as recipient or treasury payout wallet):");
  console.log(account.address);
  console.log("\nPrivate key: only in this file (not printed here — avoids screenshots/logs):");
  console.log(OUT_FILE);
  console.log("\nCopy `privateKey` from that JSON into api/.env as:");
  console.log("TEMPO_PAYOUT_PRIVATE_KEY=0x...");
  console.log("\n⚠️  Anyone with the private key controls this address. Never share or commit it.\n");
}

main();
