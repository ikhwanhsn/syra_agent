/**
 * Agent wallet helpers: get keypair by anonymousId so the backend can pay x402
 * permissionlessly (no user signature) when the agent calls paid APIs.
 */
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { getAddress } from 'viem';
import AgentWallet from '../models/agent/AgentWallet.js';
import connectMongoose, { isMongooseConnected } from '../config/mongoose.js';
import { decryptAgentSecretFromStorage } from './agentWalletSecretCrypto.js';
import { pickSolanaConnectionForReads } from './solanaServerRpc.js';

/** bufferCommands=false — never query before connect (Render boots HTTP before Atlas is ready). */
async function ensureAgentWalletDbReady() {
  if (isMongooseConnected()) return true;
  return connectMongoose({ required: false });
}

/** Legacy rows omit `chain`; schema default is solana. Base agents use chain === 'base'. */
function isSolanaChainDoc(doc) {
  return doc && (doc.chain === 'solana' || doc.chain == null || doc.chain === '');
}

/**
 * Find Solana agent row for the same linked wallet (handles legacy `chain` unset).
 * @param {string} walletAddress
 * @returns {Promise<object | null>}
 */
async function findSolanaAgentDocByWallet(walletAddress) {
  const w = String(walletAddress || '').trim();
  if (!w) return null;
  if (!(await ensureAgentWalletDbReady())) return null;
  let row = await AgentWallet.findOne({ walletAddress: w, chain: 'solana' })
    .select('+agentSecretKey custody status chain walletAddress agentAddress')
    .lean();
  if (!row) {
    row = await AgentWallet.findOne({ walletAddress: w, chain: { $exists: false } })
      .select('+agentSecretKey custody status chain walletAddress agentAddress')
      .lean();
  }
  return row;
}

/**
 * Get the agent keypair for an anonymous user.
 *
 * SECURITY: this is a legacy-custody loader. The wallet broker prefers the Privy custody path
 * (no raw keys ever loaded into our process). This function refuses to return a keypair for
 * wallets that are not active + legacy custody — see WalletBroker for the canonical signing path.
 *
 * @param {string} anonymousId - Client's anonymous id (from localStorage)
 * @returns {Promise<Keypair | null>} Agent keypair or null if not found
 */
/**
 * Privy custody wallet metadata for server-side x402 signing (no local secret key).
 * @param {string} anonymousId
 * @returns {Promise<{ privyWalletId: string; agentAddress: string } | null>}
 */
export async function getAgentPrivyWalletForX402(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string') return null;
  if (!(await ensureAgentWalletDbReady())) return null;
  const doc = await AgentWallet.findOne({ anonymousId: anonymousId.trim() })
    .select('custody status chain agentAddress privyWalletId')
    .lean();
  if (!doc || doc.custody !== 'privy') return null;
  if (doc.status && doc.status !== 'active') return null;
  if (!isSolanaChainDoc(doc)) return null;
  const privyWalletId = String(doc.privyWalletId || '').trim();
  const agentAddress = String(doc.agentAddress || '').trim();
  if (!privyWalletId || !agentAddress) return null;
  return { privyWalletId, agentAddress };
}

export async function getAgentKeypair(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string') return null;
  if (!(await ensureAgentWalletDbReady())) return null;
  const doc = await AgentWallet.findOne({ anonymousId: anonymousId.trim() })
    .select('+agentSecretKey custody status chain')
    .lean();
  if (!doc?.agentSecretKey) return null;
  if (doc.custody && doc.custody !== 'legacy') return null;
  if (doc.status && doc.status !== 'active') return null;
  let plainSecret;
  try {
    plainSecret = decryptAgentSecretFromStorage(doc.agentSecretKey);
  } catch (e) {
    console.error('[agentWallet] decrypt agentSecretKey failed:', e?.message || String(e));
    return null;
  }
  try {
    return Keypair.fromSecretKey(bs58.decode(plainSecret));
  } catch {
    return null;
  }
}

/**
 * Get Solana agent public key (base58) for an anonymous user. Used so frontend can filter "Your Agents" by owner.
 * @param {string} anonymousId - Client's anonymous id
 * @returns {Promise<string | null>} Solana agent address or null
 */
export async function getSolanaAgentAddress(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string') return null;
  if (!(await ensureAgentWalletDbReady())) return null;
  let doc = await AgentWallet.findOne({ anonymousId: anonymousId.trim() }).select('agentAddress chain walletAddress').lean();
  if (!doc) return null;
  if (isSolanaChainDoc(doc) && doc.agentAddress) return doc.agentAddress;
  if (doc.walletAddress) {
    const solanaDoc = await findSolanaAgentDocByWallet(doc.walletAddress);
    return solanaDoc?.agentAddress ?? null;
  }
  return null;
}

/**
 * Get Solana agent keypair for 8004 registration (agent must be on Solana).
 * Prefers doc with this anonymousId and chain 'solana'; else finds by same walletAddress + chain 'solana'.
 * @param {string} anonymousId - Client's anonymous id
 * @returns {Promise<Keypair | null>} Solana agent keypair or null
 */
export async function getSolanaAgentKeypair(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string') return null;
  if (!(await ensureAgentWalletDbReady())) return null;
  let doc = await AgentWallet.findOne({ anonymousId: anonymousId.trim() })
    .select('+agentSecretKey custody status chain walletAddress agentAddress')
    .lean();
  if (!doc) return null;
  if (doc.custody && doc.custody !== 'legacy') return null;
  if (doc.status && doc.status !== 'active') return null;
  if (isSolanaChainDoc(doc) && doc.agentSecretKey) {
    let plain;
    try {
      plain = decryptAgentSecretFromStorage(doc.agentSecretKey);
    } catch (e) {
      console.error('[agentWallet] decrypt agentSecretKey failed:', e?.message || String(e));
      return null;
    }
    try {
      return Keypair.fromSecretKey(bs58.decode(plain));
    } catch {
      return null;
    }
  }
  if (doc.walletAddress) {
    const solanaDoc = await findSolanaAgentDocByWallet(doc.walletAddress);
    if (solanaDoc?.agentSecretKey && (!solanaDoc.custody || solanaDoc.custody === 'legacy') && (!solanaDoc.status || solanaDoc.status === 'active')) {
      let plain;
      try {
        plain = decryptAgentSecretFromStorage(solanaDoc.agentSecretKey);
      } catch (e) {
        console.error('[agentWallet] decrypt agentSecretKey failed:', e?.message || String(e));
        return null;
      }
      try {
        return Keypair.fromSecretKey(bs58.decode(plain));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Get agent public key for an anonymous user.
 * @param {string} anonymousId - Client's anonymous id
 * @returns {Promise<string | null>} Agent address or null
 */
export async function getAgentAddress(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string') return null;
  if (!(await ensureAgentWalletDbReady())) return null;
  const doc = await AgentWallet.findOne({ anonymousId: anonymousId.trim() })
    .select('agentAddress')
    .lean();
  return doc?.agentAddress ?? null;
}

/**
 * Get connected wallet address (Solana) for an anonymous user, if they linked a wallet.
 * Used to check SYRA balance for free-agent eligibility (e.g. 1M+ holders).
 * @param {string} anonymousId - Client's anonymous id
 * @returns {Promise<string | null>} Wallet address or null
 */
export async function getConnectedWalletAddress(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string') return null;
  if (!(await ensureAgentWalletDbReady())) return null;
  const doc = await AgentWallet.findOne({ anonymousId: anonymousId.trim() })
    .select('walletAddress')
    .lean();
  return doc?.walletAddress ?? null;
}

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const LAMPORTS_PER_SOL = 1e9;

/**
 * Get agent USDC balance (human-readable number) for an anonymous user.
 * Returns null on wallet not found or RPC failure (so caller can degrade gracefully).
 * @param {string} anonymousId - Client's anonymous id
 * @returns {Promise<{ usdcBalance: number } | null>} Balance or null if wallet not found / RPC failed
 */
export async function getAgentUsdcBalance(anonymousId) {
  const result = await getAgentBalances(anonymousId);
  return result ? { usdcBalance: result.usdcBalance } : null;
}

/**
 * Get agent USDC and SOL balances for an anonymous user.
 * Used so the agent can tell the user they need both: USDC for tool payments, SOL for transaction fees.
 * @param {string} anonymousId - Client's anonymous id
 * @returns {Promise<{ usdcBalance: number, solBalance: number, agentAddress?: string } | null>} Balances or null if wallet not found / RPC failed
 */
export async function getAgentBalances(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string') return null;
  if (!(await ensureAgentWalletDbReady())) return null;
  const doc = await AgentWallet.findOne({ anonymousId: anonymousId.trim() }).lean();
  if (!doc || !doc.agentAddress) return null;
  try {
    const agentPubkey = new PublicKey(doc.agentAddress);
    const { connection, lamports: solLamports } = await pickSolanaConnectionForReads(agentPubkey);
    const tokenAccountsResponse = await connection.getParsedTokenAccountsByOwner(agentPubkey, {
      mint: USDC_MAINNET,
    });
    const solBalance = solLamports / LAMPORTS_PER_SOL;
    const accounts = Array.isArray(tokenAccountsResponse)
      ? tokenAccountsResponse
      : tokenAccountsResponse?.value ?? [];
    const usdcBalance = accounts.reduce((sum, acc) => {
      const tokenAmount = acc?.account?.data?.parsed?.info?.tokenAmount;
      const ui = tokenAmount?.uiAmount;
      const raw = tokenAmount?.amount;
      if (Number.isFinite(ui)) return sum + ui;
      if (raw != null) return sum + Number(raw) / 1e6;
      return sum;
    }, 0);
    return { usdcBalance, solBalance, agentAddress: doc.agentAddress };
  } catch (e) {
    const isRpcUnavailable =
      e?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      /fetch failed|ConnectTimeoutError|ECONNREFUSED|ETIMEDOUT/i.test(e?.message || '');
    return isRpcUnavailable ? { usdcBalance: 0, solBalance: 0, agentAddress: doc.agentAddress } : null;
  }
}

/**
 * Resolve the only allowed Tempo payout recipient for an agent user (never trust LLM for `to`).
 * - If linked wallet is EVM (0x…), payout goes there.
 * - If linked wallet is Solana, payout may go to the user's Base agent wallet (same walletAddress + chain base) if it exists.
 * @param {string} anonymousId
 * @returns {Promise<string | null>} Checksummed 0x address or null
 */
export async function getTempoPayoutRecipientAddress(anonymousId) {
  if (!anonymousId || typeof anonymousId !== "string") return null;
  if (!(await ensureAgentWalletDbReady())) return null;
  const doc = await AgentWallet.findOne({ anonymousId: anonymousId.trim() }).lean();
  if (!doc?.walletAddress) return null;
  const w = doc.walletAddress.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(w)) {
    try {
      return getAddress(w);
    } catch {
      return null;
    }
  }
  const baseAgent = await AgentWallet.findOne({ walletAddress: w, chain: "base" })
    .select("agentAddress")
    .lean();
  if (baseAgent?.agentAddress && /^0x[a-fA-F0-9]{40}$/.test(baseAgent.agentAddress)) {
    try {
      return getAddress(baseAgent.agentAddress);
    } catch {
      return null;
    }
  }
  return null;
}

const SWAP_TOOL_IDS = Object.freeze(['jupiter-swap-order', 'pumpfun-agents-swap']);

/** Telegram bot — allow all x402 tools (empty allowlist = unrestricted per policy engine). */
export async function ensureTelegramIntelToolsAllowed(anonymousId) {
  const id = String(anonymousId || '').trim();
  if (!id) return;
  if (!(await ensureAgentWalletDbReady())) return;
  const wallet = await AgentWallet.findOne({ anonymousId: id }).select('allowedTools').lean();
  if (!wallet) return;
  const current = Array.isArray(wallet.allowedTools) ? wallet.allowedTools : [];
  if (current.length === 0) return;
  await AgentWallet.updateOne({ anonymousId: id }, { $set: { allowedTools: [] } });
}

/**
 * Ensure authenticated users can sign swap txs on chat wallets provisioned with read-only defaults.
 * Empty allowedTools already permits all tools — only expands restrictive allowlists.
 * @param {string} anonymousId
 */
export async function ensureSwapToolsAllowed(anonymousId) {
  const id = String(anonymousId || '').trim();
  if (!id) return;
  if (!(await ensureAgentWalletDbReady())) return;
  const wallet = await AgentWallet.findOne({ anonymousId: id }).select('allowedTools').lean();
  if (!wallet) return;
  const current = Array.isArray(wallet.allowedTools) ? wallet.allowedTools : [];
  if (current.length === 0) return;
  const merged = new Set(current);
  let changed = false;
  for (const toolId of SWAP_TOOL_IDS) {
    if (!merged.has(toolId)) {
      merged.add(toolId);
      changed = true;
    }
  }
  if (!changed) return;
  await AgentWallet.updateOne({ anonymousId: id }, { $set: { allowedTools: [...merged] } });
}
