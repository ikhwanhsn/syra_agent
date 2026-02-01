/**
 * Agent wallet helpers: get keypair by anonymousId so the backend can pay x402
 * permissionlessly (no user signature) when the agent calls paid APIs.
 */
import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import AgentWallet from '../models/agent/AgentWallet.js';

/**
 * Get the agent keypair for an anonymous user.
 * Backend uses this to sign x402 payments without user interaction.
 * @param {string} anonymousId - Client's anonymous id (from localStorage)
 * @returns {Promise<Keypair | null>} Agent keypair or null if not found
 */
export async function getAgentKeypair(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string') return null;
  const doc = await AgentWallet.findOne({ anonymousId: anonymousId.trim() }).lean();
  if (!doc?.agentSecretKey) return null;
  try {
    const secretKey = bs58.decode(doc.agentSecretKey);
    return Keypair.fromSecretKey(secretKey);
  } catch {
    return null;
  }
}

/**
 * Get agent public key for an anonymous user.
 * @param {string} anonymousId - Client's anonymous id
 * @returns {Promise<string | null>} Agent address or null
 */
export async function getAgentAddress(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string') return null;
  const doc = await AgentWallet.findOne({ anonymousId: anonymousId.trim() })
    .select('agentAddress')
    .lean();
  return doc?.agentAddress ?? null;
}

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const RPC_URL = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || 'https://rpc.ankr.com/solana';
const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 30_000;

function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  return fetch(url, { ...init, signal: init.signal || controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

/**
 * Get agent USDC balance (human-readable number) for an anonymous user.
 * Returns null on wallet not found or RPC failure (so caller can degrade gracefully).
 * @param {string} anonymousId - Client's anonymous id
 * @returns {Promise<{ usdcBalance: number } | null>} Balance or null if wallet not found / RPC failed
 */
export async function getAgentUsdcBalance(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string') return null;
  const doc = await AgentWallet.findOne({ anonymousId: anonymousId.trim() }).lean();
  if (!doc) return null;
  try {
    const connection = new Connection(RPC_URL, { fetch: fetchWithTimeout });
    const agentPubkey = new PublicKey(doc.agentAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(agentPubkey, {
      mint: USDC_MAINNET,
    });
    const usdcBalance = tokenAccounts.value.reduce((sum, acc) => {
      const amt = acc.account.data?.parsed?.info?.tokenAmount?.uiAmount;
      return sum + (Number(amt) || 0);
    }, 0);
    return { usdcBalance };
  } catch (e) {
    const isRpcUnavailable =
      e?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      /fetch failed|ConnectTimeoutError|ECONNREFUSED|ETIMEDOUT/i.test(e?.message || '');
    if (isRpcUnavailable) {
      console.warn('[agentWallet] RPC unavailable for balance check:', e?.message?.slice(0, 80));
    }
    // Return 0 balance so caller doesn't treat as "wallet not found"; UI can show "deposit" or retry
    return { usdcBalance: 0 };
  }
}
