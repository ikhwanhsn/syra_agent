/**
 * Lab wallet CRUD, keypair/account resolution, and balance reads for x402 Labs
 * (Solana + Base + Celo + Algorand).
 */
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import algosdk from 'algosdk';
import {
  createPublicClient,
  createWalletClient,
  fallback,
  http,
  formatEther,
  formatUnits,
} from 'viem';
import { base, celo } from 'viem/chains';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import LabWallet from '../../models/labs/LabWallet.js';
import {
  normalizeLabChain,
  isEvmLabChain,
  isAvmLabChain,
} from '../../models/labs/LabX402Settings.js';
import {
  encryptAgentSecretForStorage,
  decryptAgentSecretFromStorage,
} from '../agentWalletSecretCrypto.js';
import { getMaxPayerWallets } from './labX402CallLog.js';
import { withSolanaRpcFallback } from '../solanaServerRpc.js';
import { getDexterNetworkByCaip2 } from '../../config/dexterX402Networks.js';
import { CELO_USDC_MAINNET, getCeloRpcUrl } from '../../config/celoX402Networks.js';
import { USDC_MAINNET_ASA_ID } from '../../config/algorandX402Networks.js';

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const BASE_USDC =
  getDexterNetworkByCaip2('eip155:8453')?.usdc ||
  process.env.BASE_USDC ||
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

const ERC20_BALANCE_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

function trimEnv(name) {
  return typeof process.env[name] === 'string' ? process.env[name].trim() : '';
}

function pushUniqueUrl(out, seen, url) {
  const u = String(url || '').trim();
  if (!u || seen.has(u)) return;
  seen.add(u);
  out.push(u);
}

/** Public Base RPCs used after configured providers (rate-limited ones last). */
const BASE_PUBLIC_RPC_FALLBACKS = Object.freeze([
  'https://base.llamarpc.com',
  'https://1rpc.io/base',
  'https://base.drpc.org',
  'https://mainnet.base.org',
]);

/**
 * Ordered Base RPC candidates: env providers first, then public fallbacks.
 * @returns {string[]}
 */
export function getBaseRpcUrlCandidates() {
  const out = [];
  const seen = new Set();

  for (const name of [
    'BASE_RPC_URL',
    'BASE_MAINNET_RPC_URL',
    'QUICKNODE_BASE_RPC_URL',
    'BASE_RPC_FALLBACK_URL',
  ]) {
    pushUniqueUrl(out, seen, trimEnv(name));
  }

  const extra = trimEnv('BASE_RPC_EXTRA_URLS');
  if (extra) {
    for (const part of extra.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)) {
      pushUniqueUrl(out, seen, part);
    }
  }

  for (const url of BASE_PUBLIC_RPC_FALLBACKS) {
    pushUniqueUrl(out, seen, url);
  }
  return out;
}

/**
 * Primary Base RPC URL (first candidate). Prefer getBasePublicClient() for reads.
 * @returns {string}
 */
export function getBaseRpcUrl() {
  return getBaseRpcUrlCandidates()[0] || 'https://mainnet.base.org';
}

/**
 * Viem transport that fails over across Base RPC candidates on rate-limit / 5xx.
 * @returns {ReturnType<typeof fallback>}
 */
export function createBaseTransport() {
  const urls = getBaseRpcUrlCandidates();
  return fallback(
    urls.map((url) =>
      http(url, {
        timeout: 20_000,
        retryCount: 1,
        retryDelay: 350,
      }),
    ),
    { rank: false },
  );
}

export { getCeloRpcUrl };

const DEFAULT_ALGOD_MAINNET = 'https://mainnet-api.algonode.cloud';
const MICRO_ALGO = 1_000_000;

/**
 * @returns {string}
 */
export function getAlgodMainnetUrl() {
  return trimEnv('ALGOD_MAINNET_URL') || DEFAULT_ALGOD_MAINNET;
}

/**
 * Shared algod client for Algorand mainnet reads/writes.
 * @returns {algosdk.Algodv2}
 */
export function getAlgorandAlgodClient() {
  const token = trimEnv('ALGOD_TOKEN') || '';
  return new algosdk.Algodv2(token, getAlgodMainnetUrl(), '');
}

/**
 * @returns {number}
 */
export function getAlgorandUsdcAsaId() {
  const raw = USDC_MAINNET_ASA_ID || '31566704';
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 31566704;
}

/** @type {ReturnType<typeof createPublicClient> | null} */
let basePublicClient = null;
/** @type {ReturnType<typeof createPublicClient> | null} */
let celoPublicClient = null;

/**
 * Shared Base public client with multi-RPC fallback (handles public endpoint rate limits).
 * @returns {ReturnType<typeof createPublicClient>}
 */
export function getBasePublicClient() {
  if (!basePublicClient) {
    basePublicClient = createPublicClient({
      chain: base,
      transport: createBaseTransport(),
    });
  }
  return basePublicClient;
}

/**
 * Wallet client for Base writes using the same multi-RPC fallback transport.
 * @param {import('viem').Account} account
 * @returns {ReturnType<typeof createWalletClient>}
 */
export function createBaseWalletClient(account) {
  return createWalletClient({
    account,
    chain: base,
    transport: createBaseTransport(),
  });
}

/**
 * Shared Celo public client.
 * @returns {ReturnType<typeof createPublicClient>}
 */
export function getCeloPublicClient() {
  if (!celoPublicClient) {
    celoPublicClient = createPublicClient({
      chain: celo,
      transport: http(getCeloRpcUrl()),
    });
  }
  return celoPublicClient;
}

/**
 * Wallet client for Celo writes.
 * @param {import('viem').Account} account
 * @returns {ReturnType<typeof createWalletClient>}
 */
export function createCeloWalletClient(account) {
  return createWalletClient({
    account,
    chain: celo,
    transport: http(getCeloRpcUrl()),
  });
}

/**
 * Run async mapper with a concurrency cap (avoids hammering public Base RPCs).
 * @template T, R
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} mapper
 * @returns {Promise<R[]>}
 */
async function mapWithConcurrency(items, concurrency, mapper) {
  const limit = Math.max(1, Math.min(concurrency, items.length || 1));
  /** @type {R[]} */
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await mapper(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

/**
 * @param {import('../../models/labs/LabWallet.js').default} doc
 * @returns {Keypair}
 */
export function keypairFromLabWalletDoc(doc) {
  if (!doc?.encryptedSecret) {
    throw new Error('Lab wallet secret not loaded');
  }
  const secret = decryptAgentSecretFromStorage(doc.encryptedSecret);
  return Keypair.fromSecretKey(bs58.decode(secret));
}

/**
 * @param {import('../../models/labs/LabWallet.js').default} doc
 * @returns {import('viem').Account}
 */
export function evmAccountFromLabWalletDoc(doc) {
  if (!doc?.encryptedSecret) {
    throw new Error('Lab wallet secret not loaded');
  }
  let hex = decryptAgentSecretFromStorage(doc.encryptedSecret).trim();
  if (hex.startsWith('0x') || hex.startsWith('0X')) hex = hex.slice(2);
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('Invalid EVM lab wallet secret');
  }
  return privateKeyToAccount(/** @type {`0x${string}`} */ (`0x${hex}`));
}

/**
 * Decode Algorand lab wallet secret (base64 64-byte sk).
 * @param {import('../../models/labs/LabWallet.js').default} doc
 * @returns {{ address: string; keyB64: string; sk: Uint8Array }}
 */
export function algorandAccountFromLabWalletDoc(doc) {
  if (!doc?.encryptedSecret) {
    throw new Error('Lab wallet secret not loaded');
  }
  const keyB64 = decryptAgentSecretFromStorage(doc.encryptedSecret).trim();
  let sk;
  try {
    sk = new Uint8Array(Buffer.from(keyB64, 'base64'));
  } catch {
    throw new Error('Invalid Algorand lab wallet secret (base64 decode failed)');
  }
  if (sk.length !== 64) {
    throw new Error(`Invalid Algorand lab wallet secret length: ${sk.length}`);
  }
  const address = String(doc.address || algosdk.encodeAddress(sk.slice(32))).trim();
  if (!address) {
    throw new Error('Algorand lab wallet address missing');
  }
  return { address, keyB64, sk };
}

/**
 * Resolve a Solana keypair for a lab wallet address (Solana chain only).
 * @param {string} address
 * @returns {Promise<Keypair | null>}
 */
export async function getLabWalletKeypairByAddress(address) {
  const addr = String(address || '').trim();
  if (!addr) return null;
  const doc = await LabWallet.findOne({
    address: addr,
    active: true,
    chain: 'solana',
  })
    .select('+encryptedSecret')
    .lean();
  if (!doc) return null;
  return keypairFromLabWalletDoc(doc);
}

/**
 * Resolve a viem account for an EVM lab wallet address (Base or Celo).
 * @param {string} address
 * @param {'base' | 'celo'} [chain='base']
 * @returns {Promise<import('viem').Account | null>}
 */
export async function getLabWalletEvmAccountByAddress(address, chain = 'base') {
  const addr = String(address || '').trim();
  if (!addr) return null;
  const c = chain === 'celo' ? 'celo' : 'base';
  const doc = await LabWallet.findOne({
    address: { $regex: new RegExp(`^${addr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    active: true,
    chain: c,
  })
    .select('+encryptedSecret')
    .lean();
  if (!doc) return null;
  return evmAccountFromLabWalletDoc(doc);
}

/**
 * Load active lab wallet doc (with secret) by address, optionally scoped to chain.
 * @param {string} address
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain]
 * @returns {Promise<object | null>}
 */
export async function getLabWalletDocByAddress(address, chain) {
  const addr = String(address || '').trim();
  if (!addr) return null;
  /** @type {Record<string, unknown>} */
  const filter = { active: true };
  if (chain === 'base' || chain === 'celo') {
    filter.chain = chain;
    filter.address = { $regex: new RegExp(`^${addr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
  } else if (chain === 'solana' || chain === 'algorand') {
    filter.chain = chain;
    filter.address = addr;
  } else {
    filter.$or = [
      { address: addr, chain: 'solana' },
      { address: addr, chain: 'algorand' },
      {
        chain: 'base',
        address: { $regex: new RegExp(`^${addr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      },
      {
        chain: 'celo',
        address: { $regex: new RegExp(`^${addr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      },
    ];
  }
  return LabWallet.findOne(filter).select('+encryptedSecret').lean();
}

/**
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain]
 * @returns {Promise<string | null>}
 */
export async function getActivePayToAddress(chain = 'solana') {
  const c = normalizeLabChain(chain);
  const doc = await LabWallet.findOne({ role: 'payto', active: true, chain: c })
    .select('address')
    .lean();
  return doc?.address ?? null;
}

/**
 * @returns {Promise<{
 *   solanaPayTo: string | null;
 *   evmPayTo: string | null;
 *   celoPayTo: string | null;
 *   basePayTo: string | null;
 *   algorandPayTo: string | null;
 * }>}
 */
export async function getActiveLabPayToAddresses() {
  const [solanaPayTo, basePayTo, celoPayTo, algorandPayTo] = await Promise.all([
    getActivePayToAddress('solana'),
    getActivePayToAddress('base'),
    getActivePayToAddress('celo'),
    getActivePayToAddress('algorand'),
  ]);
  return {
    solanaPayTo,
    evmPayTo: basePayTo,
    basePayTo,
    celoPayTo,
    algorandPayTo,
  };
}

/**
 * @returns {Promise<import('@solana/web3.js').Keypair | null>}
 */
export async function getActivePayToKeypair() {
  const doc = await LabWallet.findOne({ role: 'payto', active: true, chain: 'solana' })
    .select('+encryptedSecret')
    .lean();
  if (!doc) return null;
  return keypairFromLabWalletDoc(doc);
}

/**
 * @param {'base' | 'celo'} [chain='base']
 * @returns {Promise<import('viem').Account | null>}
 */
export async function getActivePayToEvmAccount(chain = 'base') {
  const c = chain === 'celo' ? 'celo' : 'base';
  const doc = await LabWallet.findOne({ role: 'payto', active: true, chain: c })
    .select('+encryptedSecret')
    .lean();
  if (!doc) return null;
  return evmAccountFromLabWalletDoc(doc);
}

/**
 * @returns {Promise<{ address: string; keyB64: string; sk: Uint8Array } | null>}
 */
export async function getActivePayToAlgorandAccount() {
  const doc = await LabWallet.findOne({ role: 'payto', active: true, chain: 'algorand' })
    .select('+encryptedSecret')
    .lean();
  if (!doc) return null;
  return algorandAccountFromLabWalletDoc(doc);
}

/**
 * Read SOL + USDC balances for a Solana lab wallet.
 * Returns `null` when the balance is unavailable (all RPCs failed).
 * @param {string} address
 * @returns {Promise<{ nativeBalance: number; usdcBalance: number } | null>}
 */
export async function getSolanaLabWalletBalances(address) {
  const addr = String(address || '').trim();
  if (!addr) return null;
  let pubkey;
  try {
    pubkey = new PublicKey(addr);
  } catch {
    return null;
  }

  try {
    return await withSolanaRpcFallback(async (connection) => {
      const [lamports, tokenResp] = await Promise.all([
        connection.getBalance(pubkey, 'confirmed'),
        connection.getParsedTokenAccountsByOwner(pubkey, { mint: USDC_MAINNET }),
      ]);
      const accounts = tokenResp?.value ?? [];
      const usdcBalance = accounts.reduce((sum, acc) => {
        const tokenAmount = acc?.account?.data?.parsed?.info?.tokenAmount;
        const ui = tokenAmount?.uiAmount;
        const raw = tokenAmount?.amount;
        if (Number.isFinite(ui)) return sum + ui;
        if (raw != null) return sum + Number(raw) / 1e6;
        return sum;
      }, 0);
      return { nativeBalance: lamports / LAMPORTS_PER_SOL, usdcBalance };
    }, `lab wallet balance ${addr.slice(0, 4)}…${addr.slice(-4)}`);
  } catch (e) {
    console.warn('[labWalletService] Solana balance read failed on all RPCs:', e?.message || e);
    return null;
  }
}

/**
 * Read ETH + USDC balances for a Base lab wallet.
 * @param {string} address
 * @returns {Promise<{ nativeBalance: number; usdcBalance: number } | null>}
 */
export async function getBaseLabWalletBalances(address) {
  const addr = String(address || '').trim();
  if (!addr || !/^0x[0-9a-fA-F]{40}$/.test(addr)) return null;

  const client = getBasePublicClient();
  const MAX_ATTEMPTS = 3;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const [ethWei, usdcRaw] = await Promise.all([
        client.getBalance({ address: /** @type {`0x${string}`} */ (addr) }),
        client.readContract({
          address: /** @type {`0x${string}`} */ (BASE_USDC),
          abi: ERC20_BALANCE_ABI,
          functionName: 'balanceOf',
          args: [/** @type {`0x${string}`} */ (addr)],
        }),
      ]);
      return {
        nativeBalance: Number(formatEther(ethWei)),
        usdcBalance: Number(formatUnits(/** @type {bigint} */ (usdcRaw), 6)),
      };
    } catch (e) {
      lastErr = e;
      const msg = e?.message || String(e);
      const retryable = /rate limit|too many requests|429|503|502|504|timeout|timed out|ECONNRESET/i.test(
        msg,
      );
      if (retryable && attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      break;
    }
  }
  console.warn('[labWalletService] Base balance read failed:', lastErr?.message || lastErr);
  return null;
}

/**
 * Read CELO + USDC balances for a Celo lab wallet.
 * @param {string} address
 * @returns {Promise<{ nativeBalance: number; usdcBalance: number } | null>}
 */
export async function getCeloLabWalletBalances(address) {
  const addr = String(address || '').trim();
  if (!addr || !/^0x[0-9a-fA-F]{40}$/.test(addr)) return null;

  try {
    const client = getCeloPublicClient();
    const [celoWei, usdcRaw] = await Promise.all([
      client.getBalance({ address: /** @type {`0x${string}`} */ (addr) }),
      client.readContract({
        address: /** @type {`0x${string}`} */ (CELO_USDC_MAINNET),
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [/** @type {`0x${string}`} */ (addr)],
      }),
    ]);
    return {
      nativeBalance: Number(formatEther(celoWei)),
      usdcBalance: Number(formatUnits(/** @type {bigint} */ (usdcRaw), 6)),
    };
  } catch (e) {
    console.warn('[labWalletService] Celo balance read failed:', e?.message || e);
    return null;
  }
}

/**
 * Read ALGO + USDC ASA balances for an Algorand lab wallet.
 * Not opted-in to USDC ⇒ usdcBalance 0.
 * @param {string} address
 * @returns {Promise<{ nativeBalance: number; usdcBalance: number; optedInUsdc: boolean } | null>}
 */
export async function getAlgorandLabWalletBalances(address) {
  const addr = String(address || '').trim();
  if (!addr) return null;

  try {
    const client = getAlgorandAlgodClient();
    const info = await client.accountInformation(addr).do();
    const microAlgos = Number(info?.amount ?? 0);
    const nativeBalance = microAlgos / MICRO_ALGO;
    const asaId = getAlgorandUsdcAsaId();
    const assets = Array.isArray(info?.assets) ? info.assets : [];
    const holding = assets.find((a) => Number(a?.assetId ?? a?.['asset-id'] ?? a?.asset_id) === asaId);
    if (!holding) {
      return { nativeBalance, usdcBalance: 0, optedInUsdc: false };
    }
    const raw = Number(holding.amount ?? 0);
    return {
      nativeBalance,
      usdcBalance: raw / 1e6,
      optedInUsdc: true,
    };
  } catch (e) {
    const msg = e?.message || String(e);
    // Fresh wallets often 404 until funded — treat as zero balances.
    if (/not found|no accounts|404/i.test(msg)) {
      return { nativeBalance: 0, usdcBalance: 0, optedInUsdc: false };
    }
    console.warn('[labWalletService] Algorand balance read failed:', msg);
    return null;
  }
}

/**
 * Whether an Algorand address is opted into the USDC ASA.
 * @param {string} address
 * @returns {Promise<boolean>}
 */
export async function isAlgorandAddressOptedInUsdc(address) {
  const balances = await getAlgorandLabWalletBalances(address);
  return Boolean(balances?.optedInUsdc);
}

/** Min ALGO needed to submit a USDC ASA opt-in txn (fee + min-balance bump). */
const ALGO_MIN_FOR_USDC_OPT_IN = 0.11;

/**
 * Opt an Algorand account into USDC ASA (0-amount self-transfer).
 * Requires the account to already hold ~0.11 ALGO for fees + ASA min-balance.
 * @param {{ address: string; sk: Uint8Array }} account
 * @returns {Promise<{ ok: boolean; already?: boolean; tx?: string; error?: string }>}
 */
export async function ensureAlgorandUsdcOptInForAccount(account) {
  const address = String(account?.address || '').trim();
  if (!address || !account?.sk) {
    return { ok: false, error: 'invalid_account' };
  }
  if (await isAlgorandAddressOptedInUsdc(address)) {
    return { ok: true, already: true };
  }

  const balances = await getAlgorandLabWalletBalances(address);
  if (!balances || balances.nativeBalance < ALGO_MIN_FOR_USDC_OPT_IN) {
    return {
      ok: false,
      error: `insufficient_algo_for_opt_in (need ~${ALGO_MIN_FOR_USDC_OPT_IN} ALGO first)`,
    };
  }

  try {
    const client = getAlgorandAlgodClient();
    const asaId = getAlgorandUsdcAsaId();
    const sp = await client.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: address,
      receiver: address,
      amount: 0,
      assetIndex: asaId,
      suggestedParams: sp,
    });
    const signed = txn.signTxn(account.sk);
    const { txid } = await client.sendRawTransaction(signed).do();
    await algosdk.waitForConfirmation(client, txid, 8);
    return { ok: true, tx: txid };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

/**
 * Load Algorand lab wallet secret and opt it into USDC ASA if needed.
 * @param {string} address
 * @returns {Promise<{ ok: boolean; already?: boolean; tx?: string; error?: string }>}
 */
export async function ensureAlgorandLabWalletUsdcOptIn(address) {
  const addr = String(address || '').trim();
  if (!addr) return { ok: false, error: 'empty_address' };
  const doc = await LabWallet.findOne({
    address: addr,
    chain: 'algorand',
    active: true,
  })
    .select('+encryptedSecret')
    .lean();
  if (!doc?.encryptedSecret) {
    return { ok: false, error: 'wallet_not_found' };
  }
  const account = algorandAccountFromLabWalletDoc(doc);
  return ensureAlgorandUsdcOptInForAccount(account);
}

/**
 * Chain-aware balance read. Normalized to nativeBalance + usdcBalance.
 * @param {string} address
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain]
 * @returns {Promise<{ nativeBalance: number; usdcBalance: number; chain: 'solana' | 'base' | 'celo' | 'algorand'; optedInUsdc?: boolean } | null>}
 */
export async function getLabWalletBalances(address, chain) {
  const c = chain
    ? normalizeLabChain(chain)
    : /^0x/i.test(String(address || ''))
      ? 'base'
      : 'solana';
  let balances = null;
  if (c === 'celo') balances = await getCeloLabWalletBalances(address);
  else if (c === 'base') balances = await getBaseLabWalletBalances(address);
  else if (c === 'algorand') balances = await getAlgorandLabWalletBalances(address);
  else balances = await getSolanaLabWalletBalances(address);
  if (!balances) return null;
  return { ...balances, chain: c };
}

/**
 * @deprecated Prefer getLabWalletBalances — kept for callers that still read solBalance.
 * @param {string} address
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain]
 */
export async function getLabWalletBalancesLegacyShape(address, chain) {
  const balances = await getLabWalletBalances(address, chain);
  if (!balances) return null;
  return {
    solBalance: balances.nativeBalance,
    usdcBalance: balances.usdcBalance,
    nativeBalance: balances.nativeBalance,
    chain: balances.chain,
  };
}

/**
 * @param {{ label: string; role: 'payer' | 'payto' | 'deposit'; chain?: 'solana' | 'base' | 'celo' | 'algorand' }} input
 * @returns {Promise<object>}
 */
export async function createLabWallet(input) {
  const label = String(input.label || '').trim();
  const role =
    input.role === 'payto' ? 'payto' : input.role === 'deposit' ? 'deposit' : 'payer';
  const chain = normalizeLabChain(input.chain);
  if (!label) throw new Error('label is required');

  if (role === 'payto') {
    const existing = await LabWallet.findOne({ role: 'payto', active: true, chain }).lean();
    if (existing) {
      throw new Error(
        `An active ${chain} payTo wallet already exists. Deactivate it first or use the existing one.`,
      );
    }
  } else if (role === 'deposit') {
    const existing = await LabWallet.findOne({ role: 'deposit', active: true, chain }).lean();
    if (existing) {
      throw new Error(
        `An active ${chain} deposit wallet already exists. Deactivate it first or use the existing one.`,
      );
    }
  } else {
    const payerCount = await LabWallet.countDocuments({ role: 'payer', active: true, chain });
    if (payerCount >= getMaxPayerWallets()) {
      throw new Error(`Maximum of ${getMaxPayerWallets()} ${chain} payer wallets allowed`);
    }
  }

  let address;
  let encryptedSecret;

  if (isEvmLabChain(chain)) {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    address = account.address;
    encryptedSecret = encryptAgentSecretForStorage(privateKey.slice(2));
  } else if (isAvmLabChain(chain)) {
    const account = algosdk.generateAccount();
    address = String(account.addr);
    encryptedSecret = encryptAgentSecretForStorage(Buffer.from(account.sk).toString('base64'));
  } else {
    const keypair = Keypair.generate();
    address = keypair.publicKey.toBase58();
    encryptedSecret = encryptAgentSecretForStorage(bs58.encode(keypair.secretKey));
  }

  const doc = await LabWallet.create({
    label,
    address,
    encryptedSecret,
    role,
    chain,
    active: true,
  });

  return formatLabWalletDoc(doc);
}

/**
 * Create multiple payer wallets in one call.
 * @param {{ count: number; chain?: 'solana' | 'base' | 'celo' | 'algorand'; labelPrefix?: string; role?: 'payer' | 'payto' }} input
 * @returns {Promise<object[]>}
 */
export async function createLabWalletsBulk(input) {
  const chain = normalizeLabChain(input.chain);
  const role = input.role === 'payto' ? 'payto' : 'payer';
  const count = Math.min(Math.max(Math.round(Number(input.count) || 0), 1), getMaxPayerWallets());
  const labelPrefix = String(input.labelPrefix || 'Payer').trim() || 'Payer';

  if (role === 'payto') {
    throw new Error('Bulk create only supports payer wallets');
  }

  const existingCount = await LabWallet.countDocuments({ role: 'payer', active: true, chain });
  const remaining = getMaxPayerWallets() - existingCount;
  if (remaining <= 0) {
    throw new Error(`Maximum of ${getMaxPayerWallets()} ${chain} payer wallets allowed`);
  }
  const toCreate = Math.min(count, remaining);

  const created = [];
  for (let i = 0; i < toCreate; i++) {
    const label = `${labelPrefix} #${existingCount + i + 1}`;
    created.push(await createLabWallet({ label, role: 'payer', chain }));
  }
  return created;
}

/**
 * @param {object} doc
 * @returns {object}
 */
function formatLabWalletDoc(doc) {
  return {
    id: doc._id.toString(),
    label: doc.label,
    address: doc.address,
    role: doc.role,
    chain: doc.chain || 'solana',
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * @param {'solana' | 'base' | 'celo' | 'algorand'} chain
 * @returns {'SOL' | 'ETH' | 'CELO' | 'ALGO'}
 */
function nativeSymbolForChain(chain) {
  if (chain === 'celo') return 'CELO';
  if (chain === 'base') return 'ETH';
  if (chain === 'algorand') return 'ALGO';
  return 'SOL';
}

/**
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain]
 * @returns {Promise<object[]>}
 */
export async function listLabWallets(chain) {
  const c = chain ? normalizeLabChain(chain) : null;
  const filter = { active: true, role: { $in: ['payer', 'payto'] } };
  if (c) filter.chain = c;

  const docs = await LabWallet.find(filter).sort({ role: 1, createdAt: 1 }).lean();
  // Cap concurrency on EVM reads — public Base RPCs rate-limit all-parallel multi-wallet fetches.
  const concurrency = c && isEvmLabChain(c) ? 3 : 8;
  const withBalances = await mapWithConcurrency(docs, concurrency, async (d) => {
    const walletChain = normalizeLabChain(d.chain);
    const balances = await getLabWalletBalances(d.address, walletChain);
    const balanceAvailable = balances !== null;
    const nativeSymbol = nativeSymbolForChain(walletChain);
    return {
      id: d._id.toString(),
      label: d.label,
      address: d.address,
      role: d.role,
      chain: walletChain,
      active: d.active,
      nativeBalance: balanceAvailable ? balances.nativeBalance : null,
      nativeSymbol,
      solBalance: balanceAvailable ? balances.nativeBalance : null,
      usdcBalance: balanceAvailable ? balances.usdcBalance : null,
      balanceAvailable,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  });
  return withBalances;
}

/**
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain]
 * @returns {Promise<object[]>}
 */
export async function listActivePayerWallets(chain) {
  const c = chain ? normalizeLabChain(chain) : null;
  const filter = { role: 'payer', active: true };
  if (c) filter.chain = c;
  return LabWallet.find(filter).select('+encryptedSecret').lean();
}

/**
 * Active payer + payto wallets that receive deposit distributions (excludes deposit hub).
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain]
 * @returns {Promise<object[]>}
 */
export async function listDepositRecipients(chain) {
  const c = chain ? normalizeLabChain(chain) : null;
  const filter = { role: { $in: ['payer', 'payto'] }, active: true };
  if (c) filter.chain = c;
  return LabWallet.find(filter).sort({ role: 1, createdAt: 1 }).lean();
}

/**
 * Load active deposit hub wallet (with secret) for a chain.
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain='base']
 * @returns {Promise<object | null>}
 */
export async function getActiveDepositWalletDoc(chain = 'base') {
  const c = normalizeLabChain(chain);
  return LabWallet.findOne({ role: 'deposit', active: true, chain: c })
    .select('+encryptedSecret')
    .lean();
}

/**
 * Get or create the per-chain deposit hub wallet (solana | base | celo | algorand).
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain='base']
 * @returns {Promise<object>}
 */
export async function getOrCreateDepositWallet(chain = 'base') {
  const c = normalizeLabChain(chain);
  const chainLabel =
    c === 'celo' ? 'Celo' : c === 'base' ? 'Base' : c === 'algorand' ? 'Algorand' : 'Solana';

  const existing = await getActiveDepositWalletDoc(c);
  if (existing) {
    // Auto opt-in Algorand deposit hub to USDC ASA as soon as it has ALGO,
    // so wallets like Pera don't warn about Inbox Router when sending USDC.
    if (c === 'algorand') {
      try {
        await ensureAlgorandUsdcOptInForAccount(algorandAccountFromLabWalletDoc(existing));
      } catch (e) {
        console.warn('[labWalletService] deposit hub USDC opt-in failed:', e?.message || e);
      }
    }
    const balances = await getLabWalletBalances(existing.address, c);
    return {
      ...formatLabWalletDoc(existing),
      nativeBalance: balances?.nativeBalance ?? null,
      nativeSymbol: nativeSymbolForChain(c),
      usdcBalance: balances?.usdcBalance ?? null,
      optedInUsdc: c === 'algorand' ? Boolean(balances?.optedInUsdc) : undefined,
      balanceAvailable: balances !== null,
    };
  }

  const created = await createLabWallet({
    label: `${chainLabel} Deposit Hub`,
    role: 'deposit',
    chain: c,
  });
  const balances = await getLabWalletBalances(created.address, c);
  return {
    ...created,
    nativeBalance: balances?.nativeBalance ?? null,
    nativeSymbol: nativeSymbolForChain(c),
    usdcBalance: balances?.usdcBalance ?? null,
    optedInUsdc: c === 'algorand' ? Boolean(balances?.optedInUsdc) : undefined,
    balanceAvailable: balances !== null,
  };
}
