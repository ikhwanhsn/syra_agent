/**
 * Tempo payout rail: send stablecoin (TIP-20) payouts on Tempo with optional memo.
 * Uses viem + viem/tempo for token.transferSync (and optional memo for reconciliation).
 *
 * Env:
 * - TEMPO_RPC_URL: RPC endpoint (default https://rpc.tempo.xyz for mainnet)
 * - TEMPO_CHAIN_ID: chain id (default 4217 mainnet; use testnet id for Moderato)
 * - TEMPO_PAYOUT_PRIVATE_KEY: hex private key of the payout wallet
 * - TEMPO_PAYOUT_TOKEN: TIP-20 token address (default AlphaUSD on testnet 0x20c0...0001)
 */
import { createWalletClient, http, parseUnits, stringToHex, pad } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

const DECIMALS = 6;
const MEMO_SIZE = 32;

function env(name, fallback = "") {
  return String(process.env[name] ?? fallback).trim();
}

/** Tempo mainnet (chain id 4217). */
export const tempoMainnet = defineChain({
  id: 4217,
  name: "Tempo",
  nativeCurrency: { name: "USD", symbol: "USD", decimals: 18 },
  rpcUrls: {
    default: { http: [env("TEMPO_RPC_URL", "https://rpc.tempo.xyz")] },
  },
});

/** AlphaUSD on Tempo testnet (Moderato). Mainnet may use a different address. */
const DEFAULT_TEMPO_TOKEN = "0x20c0000000000000000000000000000000000001";

/** Gas limit for TIP-20 transferWithMemo (intrinsic ~272k; use 350k to be safe). Plain transfer ~50k. */
const GAS_LIMIT_TRANSFER = 100_000n;
const GAS_LIMIT_TRANSFER_WITH_MEMO = 350_000n;

let cachedClient = null;

/**
 * Get viem wallet client extended with Tempo token actions (transferSync, etc.).
 * Uses TEMPO_PAYOUT_PRIVATE_KEY and TEMPO_RPC_URL / TEMPO_CHAIN_ID.
 * @returns {Promise<import('viem').WalletClient | null>} Client or null if not configured.
 */
export async function getTempoPayoutClient() {
  const privateKeyHex = env("TEMPO_PAYOUT_PRIVATE_KEY");
  if (!privateKeyHex) return null;

  if (cachedClient) return cachedClient;

  const rpcUrl = env("TEMPO_RPC_URL", "https://rpc.tempo.xyz");
  const chainId = Number(env("TEMPO_CHAIN_ID", "4217")) || 4217;

  const chain =
    chainId === 4217
      ? tempoMainnet
      : defineChain({
          id: chainId,
          name: "Tempo",
          nativeCurrency: { name: "USD", symbol: "USD", decimals: 18 },
          rpcUrls: { default: { http: [rpcUrl] } },
        });

  const account = privateKeyToAccount(
    privateKeyHex.startsWith("0x") ? privateKeyHex : `0x${privateKeyHex}`
  );

  const { tempoActions } = await import("viem/tempo");

  const client = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  }).extend(tempoActions());

  cachedClient = client;
  return client;
}

/**
 * Send a stablecoin payout on Tempo.
 * @param {{
 *   to: string;
 *   amountUsd: number;
 *   memo?: string;
 * }} params - Recipient address (0x), amount in USD, optional memo (max 32 bytes for reconciliation).
 * @returns {Promise<{ success: boolean; transactionHash?: string; error?: string }>}
 */
export async function sendTempoPayout({ to, amountUsd, memo }) {
  const client = await getTempoPayoutClient();
  if (!client) {
    return {
      success: false,
      error: "Tempo payout not configured (set TEMPO_PAYOUT_PRIVATE_KEY and TEMPO_RPC_URL)",
    };
  }

  const tokenAddress = env("TEMPO_PAYOUT_TOKEN", DEFAULT_TEMPO_TOKEN);
  const toAddress = to.startsWith("0x") ? to : `0x${to}`;

  if (amountUsd <= 0 || !Number.isFinite(amountUsd)) {
    return { success: false, error: "Invalid amountUsd" };
  }

  const amountRaw = parseUnits(Number(amountUsd).toFixed(DECIMALS), DECIMALS);

  try {
    const hasMemo = memo != null && String(memo).trim();
    const options = {
      amount: amountRaw,
      to: toAddress,
      token: tokenAddress,
      gas: hasMemo ? GAS_LIMIT_TRANSFER_WITH_MEMO : GAS_LIMIT_TRANSFER,
    };
    if (hasMemo) {
      const memoStr = String(memo).trim().slice(0, MEMO_SIZE);
      options.memo = pad(stringToHex(memoStr), { size: MEMO_SIZE });
    }

    const result = await client.token.transferSync(options);
    const txHash = result?.receipt?.transactionHash ?? result?.transactionHash;

    if (txHash) {
      return { success: true, transactionHash: txHash };
    }
    return { success: false, error: "No transaction hash returned" };
  } catch (err) {
    const message = err?.message ?? String(err);
    return { success: false, error: message };
  }
}
