/**
 * Lazy singleton for Synapse Agent Protocol (SAP) SDK client.
 * Uses the same signer as on-chain registration (see scripts/register-sap-agent.js).
 */
import { createRequire } from "node:module";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const require = createRequire(import.meta.url);
const { SapConnection } = require("@oobe-protocol-labs/synapse-sap-sdk");

let _bundle = null;

function getSignerKeypair() {
  const raw = process.env.SOLANA_PRIVATE_KEY || process.env.PAYER_KEYPAIR;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch {
      /* fall through */
    }
  }
  const b58 = process.env.AGENT_PRIVATE_KEY || process.env.ZAUTH_SOLANA_PRIVATE_KEY;
  if (b58) {
    return Keypair.fromSecretKey(bs58.decode(b58));
  }
  return null;
}

/**
 * @returns {Promise<{ sap: import("@oobe-protocol-labs/synapse-sap-sdk").SapConnection; client: import("@oobe-protocol-labs/synapse-sap-sdk").SapClient; keypair: Keypair } | null>}
 */
export async function getSapClientBundle() {
  if (_bundle) return _bundle;
  const keypair = getSignerKeypair();
  if (!keypair) return null;
  const rpcUrl =
    process.env.SAP_RPC_URL?.trim() ||
    process.env.SOLANA_RPC_URL?.trim() ||
    "https://api.mainnet-beta.solana.com";
  const cluster = (process.env.SAP_CLUSTER || "mainnet-beta").replace(/^mainnet$/, "mainnet-beta");
  const sap = SapConnection.fromKeypair(rpcUrl, keypair, { cluster });
  _bundle = { sap, client: sap.client, keypair };
  return _bundle;
}

export function getExpectedSapAgentPdaBase58() {
  return (
    process.env.SYRA_SAP_AGENT_PDA?.trim() || "29Mw1QJRYb8BwiR4iPRYGp276PHeoCzSQMHxUYQd3o47"
  );
}
