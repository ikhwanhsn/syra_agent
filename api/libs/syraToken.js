/**
 * SYRA token utility: balance checks + holder eligibility for free agent/tools.
 * Holder thresholds are intentionally accessible — not whale-only.
 */
import { Connection, PublicKey } from '@solana/web3.js';

export const SYRA_TOKEN_MINT =
  process.env.SYRA_TOKEN_MINT || '8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump';
const RPC_URL = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || 'https://rpc.ankr.com/solana';
const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 30_000;

/**
 * Minimum SYRA balance (human-readable) for free agent/tool usage (treasury pays).
 * Lowered from 1M so ordinary holders can qualify — override via env.
 */
export const SYRA_HOLDER_THRESHOLD =
  Number(process.env.SYRA_HOLDER_THRESHOLD) > 0
    ? Number(process.env.SYRA_HOLDER_THRESHOLD)
    : 100_000;

/** Pricing / utility tiers (human-readable $SYRA — wallet balance OR active stake). */
export const SYRA_UTILITY_TIERS = Object.freeze([
  { id: 'bronze', min: 10_000, discount: 0.05, label: '5% x402 discount' },
  { id: 'silver', min: 100_000, discount: 0.1, label: '10% x402 discount + free agent tools' },
  { id: 'gold', min: 1_000_000, discount: 0.2, label: '20% x402 discount' },
  { id: 'whale', min: 10_000_000, discount: 0.3, label: '30% x402 discount + unlimited scans' },
]);

function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  return fetch(url, { ...init, signal: init.signal || controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

/**
 * Get SYRA token balance for a wallet (human-readable amount).
 * @param {string} walletAddress - Solana wallet public key (base58)
 * @returns {Promise<{ balance: number; isEligible: boolean; tier: string | null } | null>}
 */
export async function getSyraBalance(walletAddress) {
  if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.trim()) {
    return null;
  }
  // EVM addresses cannot hold SPL $SYRA
  if (walletAddress.trim().startsWith('0x')) {
    return { balance: 0, isEligible: false, tier: null };
  }
  try {
    const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
    const mintPubkey = new PublicKey(SYRA_TOKEN_MINT);
    const ownerPubkey = new PublicKey(walletAddress.trim());
    const accounts = await connection.getParsedTokenAccountsByOwner(ownerPubkey, {
      mint: mintPubkey,
    });
    const balance = (accounts.value || []).reduce((sum, acc) => {
      const amt = acc.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
      return sum + (Number(amt) || 0);
    }, 0);
    const isEligible = balance >= SYRA_HOLDER_THRESHOLD;
    const tier = resolveUtilityTierFromAmount(balance);
    return { balance, isEligible, tier: tier?.id ?? null };
  } catch (e) {
    return null;
  }
}

/**
 * @param {number} amount
 * @returns {{ id: string; min: number; discount: number; label: string } | null}
 */
export function resolveUtilityTierFromAmount(amount) {
  const n = Number(amount) || 0;
  let best = null;
  for (const t of SYRA_UTILITY_TIERS) {
    if (n >= t.min) best = t;
  }
  return best;
}

/**
 * Check if a wallet holds ≥ SYRA_HOLDER_THRESHOLD and is eligible for free agent/tool usage.
 * @param {string} walletAddress
 * @returns {Promise<boolean>}
 */
export async function isSyraHolderEligible(walletAddress) {
  const result = await getSyraBalance(walletAddress);
  return result?.isEligible ?? false;
}
