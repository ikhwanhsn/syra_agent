/**
 * Tempo payout rail: send stablecoin (TIP-20) payouts on Tempo with optional memo.
 * Uses viem + viem/tempo for token.transferSync (and optional memo for reconciliation).
 *
 * Idempotency: pass `idempotencyKey` (or reuse memo) so replayed requests do not double-pay.
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
import TempoPayoutLedger from "../models/TempoPayoutLedger.js";
import { isMongooseConnected } from "../config/mongoose.js";

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
 * Normalize idempotency key from explicit key or memo.
 * @param {{ idempotencyKey?: string; memo?: string }} params
 * @returns {string | null}
 */
function resolveIdempotencyKey({ idempotencyKey, memo }) {
  const explicit = String(idempotencyKey || "").trim();
  if (explicit) return explicit.slice(0, 128);
  const memoKey = String(memo || "").trim();
  if (memoKey) return `memo:${memoKey.slice(0, 120)}`;
  return null;
}

/**
 * Claim ledger row before send. Returns existing confirmed result or null if we own the send.
 * @param {{
 *   key: string;
 *   to: string;
 *   amountUsd: number;
 *   memo?: string;
 *   source?: string;
 * }} opts
 */
async function claimTempoLedger({ key, to, amountUsd, memo, source }) {
  if (!isMongooseConnected()) {
    return { proceed: true, ledgerUnavailable: true };
  }

  const existing = await TempoPayoutLedger.findOne({ idempotencyKey: key }).lean();
  if (existing?.status === "confirmed" && existing.txHash) {
    return {
      proceed: false,
      result: {
        success: true,
        transactionHash: existing.txHash,
        deduped: true,
      },
    };
  }
  if (existing?.status === "sending") {
    if (existing.txHash) {
      return {
        proceed: false,
        result: {
          success: true,
          transactionHash: existing.txHash,
          deduped: true,
          pending: true,
        },
      };
    }
    return {
      proceed: false,
      result: { success: false, error: "payout_in_progress" },
    };
  }

  try {
    await TempoPayoutLedger.findOneAndUpdate(
      {
        idempotencyKey: key,
        status: { $nin: ["sending", "confirmed"] },
      },
      {
        $set: {
          to,
          amountUsd,
          memo: memo ?? null,
          status: "sending",
          error: null,
          source: source ?? null,
        },
        $setOnInsert: { idempotencyKey: key },
      },
      { upsert: true, new: true },
    );
    return { proceed: true };
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? e.code : null;
    if (code === 11000) {
      const again = await TempoPayoutLedger.findOne({ idempotencyKey: key }).lean();
      if (again?.status === "confirmed" && again.txHash) {
        return {
          proceed: false,
          result: {
            success: true,
            transactionHash: again.txHash,
            deduped: true,
          },
        };
      }
      return {
        proceed: false,
        result: { success: false, error: "payout_in_progress" },
      };
    }
    throw e;
  }
}

/**
 * @param {string} key
 * @param {{ txHash?: string; error?: string; status: "confirmed" | "failed" | "sending" }} update
 */
async function updateTempoLedger(key, update) {
  if (!isMongooseConnected() || !key) return;
  const $set = { status: update.status };
  if (update.txHash) $set.txHash = update.txHash;
  if (update.error != null) $set.error = update.error;
  await TempoPayoutLedger.updateOne({ idempotencyKey: key }, { $set });
}

/**
 * Send a stablecoin payout on Tempo.
 * @param {{
 *   to: string;
 *   amountUsd: number;
 *   memo?: string;
 *   idempotencyKey?: string;
 *   source?: string;
 * }} params - Recipient address (0x), amount in USD, optional memo / idempotency key.
 * @returns {Promise<{ success: boolean; transactionHash?: string; error?: string; deduped?: boolean; pending?: boolean }>}
 */
export async function sendTempoPayout({ to, amountUsd, memo, idempotencyKey, source }) {
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

  const key = resolveIdempotencyKey({ idempotencyKey, memo });
  if (key) {
    const claim = await claimTempoLedger({
      key,
      to: toAddress,
      amountUsd,
      memo,
      source,
    });
    if (!claim.proceed) {
      return claim.result;
    }
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
      if (key) {
        await updateTempoLedger(key, { status: "confirmed", txHash: String(txHash) });
      }
      return { success: true, transactionHash: txHash };
    }
    if (key) {
      await updateTempoLedger(key, {
        status: "failed",
        error: "No transaction hash returned",
      });
    }
    return { success: false, error: "No transaction hash returned" };
  } catch (err) {
    const message = err?.message ?? String(err);
    if (key) {
      await updateTempoLedger(key, { status: "failed", error: message });
    }
    return { success: false, error: message };
  }
}
