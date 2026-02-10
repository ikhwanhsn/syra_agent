/**
 * SYRA token utility: check if a wallet holds enough $SYRA for free agent/tools (e.g. ≥1M).
 * Used so 1M+ holders can use the agent for free; treasury pays for their tool calls.
 */
import { Connection, PublicKey } from '@solana/web3.js';

export const SYRA_TOKEN_MINT =
  process.env.SYRA_TOKEN_MINT || '8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump';
const RPC_URL = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || 'https://rpc.ankr.com/solana';
const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 30_000;

/** Minimum SYRA balance (in human-readable / ui amount) to qualify for free agent usage. */
const SYRA_HOLDER_THRESHOLD = 1_000_000;

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
 * @returns {Promise<{ balance: number; isEligible: boolean } | null>} balance and eligibility, or null on RPC/parse error
 */
export async function getSyraBalance(walletAddress) {
  if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.trim()) {
    return null;
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
    return { balance, isEligible };
  } catch (e) {
    return null;
  }
}

/**
 * Check if a wallet holds ≥1M SYRA and is eligible for free agent/tool usage (treasury pays).
 * @param {string} walletAddress - Solana wallet public key (base58)
 * @returns {Promise<boolean>} true if balance >= SYRA_HOLDER_THRESHOLD
 */
export async function isSyraHolderEligible(walletAddress) {
  const result = await getSyraBalance(walletAddress);
  return result?.isEligible ?? false;
}
