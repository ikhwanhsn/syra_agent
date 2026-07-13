/**
 * Lab wallet CRUD, keypair/account resolution, and balance reads for x402 Labs (Solana + Base + Celo).
 */
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { base, celo } from 'viem/chains';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import LabWallet from '../../models/labs/LabWallet.js';
import { normalizeLabChain, isEvmLabChain } from '../../models/labs/LabX402Settings.js';
import {
  encryptAgentSecretForStorage,
  decryptAgentSecretFromStorage,
} from '../agentWalletSecretCrypto.js';
import { getMaxPayerWallets } from './labX402CallLog.js';
import { withSolanaRpcFallback } from '../solanaServerRpc.js';
import { getDexterNetworkByCaip2 } from '../../config/dexterX402Networks.js';
import { CELO_USDC_MAINNET, getCeloRpcUrl } from '../../config/celoX402Networks.js';

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

/**
 * @returns {string}
 */
export function getBaseRpcUrl() {
  return (
    String(process.env.BASE_RPC_URL || '').trim() ||
    String(process.env.BASE_MAINNET_RPC_URL || '').trim() ||
    String(process.env.QUICKNODE_BASE_RPC_URL || '').trim() ||
    'https://mainnet.base.org'
  );
}

export { getCeloRpcUrl };

/** @type {ReturnType<typeof createPublicClient> | null} */
let basePublicClient = null;
/** @type {ReturnType<typeof createPublicClient> | null} */
let celoPublicClient = null;

/**
 * @returns {ReturnType<typeof createPublicClient>}
 */
function getBasePublicClient() {
  if (!basePublicClient) {
    basePublicClient = createPublicClient({
      chain: base,
      transport: http(getBaseRpcUrl()),
    });
  }
  return basePublicClient;
}

/**
 * @returns {ReturnType<typeof createPublicClient>}
 */
function getCeloPublicClient() {
  if (!celoPublicClient) {
    celoPublicClient = createPublicClient({
      chain: celo,
      transport: http(getCeloRpcUrl()),
    });
  }
  return celoPublicClient;
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
 * @param {'solana' | 'base' | 'celo'} [chain]
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
  } else if (chain === 'solana') {
    filter.chain = 'solana';
    filter.address = addr;
  } else {
    filter.$or = [
      { address: addr, chain: 'solana' },
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
 * @param {'solana' | 'base' | 'celo'} [chain]
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
 * @returns {Promise<{ solanaPayTo: string | null; evmPayTo: string | null; celoPayTo: string | null; basePayTo: string | null }>}
 */
export async function getActiveLabPayToAddresses() {
  const [solanaPayTo, basePayTo, celoPayTo] = await Promise.all([
    getActivePayToAddress('solana'),
    getActivePayToAddress('base'),
    getActivePayToAddress('celo'),
  ]);
  return {
    solanaPayTo,
    evmPayTo: basePayTo,
    basePayTo,
    celoPayTo,
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

  try {
    const client = getBasePublicClient();
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
    console.warn('[labWalletService] Base balance read failed:', e?.message || e);
    return null;
  }
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
 * Chain-aware balance read. Normalized to nativeBalance + usdcBalance.
 * @param {string} address
 * @param {'solana' | 'base' | 'celo'} [chain]
 * @returns {Promise<{ nativeBalance: number; usdcBalance: number; chain: 'solana' | 'base' | 'celo' } | null>}
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
  else balances = await getSolanaLabWalletBalances(address);
  if (!balances) return null;
  return { ...balances, chain: c };
}

/**
 * @deprecated Prefer getLabWalletBalances — kept for callers that still read solBalance.
 * @param {string} address
 * @param {'solana' | 'base' | 'celo'} [chain]
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
 * @param {{ label: string; role: 'payer' | 'payto'; chain?: 'solana' | 'base' | 'celo' }} input
 * @returns {Promise<object>}
 */
export async function createLabWallet(input) {
  const label = String(input.label || '').trim();
  const role = input.role === 'payto' ? 'payto' : 'payer';
  const chain = normalizeLabChain(input.chain);
  if (!label) throw new Error('label is required');

  if (role === 'payto') {
    const existing = await LabWallet.findOne({ role: 'payto', active: true, chain }).lean();
    if (existing) {
      throw new Error(
        `An active ${chain} payTo wallet already exists. Deactivate it first or use the existing one.`,
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
 * @param {{ count: number; chain?: 'solana' | 'base' | 'celo'; labelPrefix?: string; role?: 'payer' | 'payto' }} input
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
 * @param {'solana' | 'base' | 'celo'} chain
 * @returns {'SOL' | 'ETH' | 'CELO'}
 */
function nativeSymbolForChain(chain) {
  if (chain === 'celo') return 'CELO';
  if (chain === 'base') return 'ETH';
  return 'SOL';
}

/**
 * @param {'solana' | 'base' | 'celo'} [chain]
 * @returns {Promise<object[]>}
 */
export async function listLabWallets(chain) {
  const c = chain ? normalizeLabChain(chain) : null;
  const filter = { active: true };
  if (c) filter.chain = c;

  const docs = await LabWallet.find(filter).sort({ role: 1, createdAt: 1 }).lean();
  const withBalances = await Promise.all(
    docs.map(async (d) => {
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
    }),
  );
  return withBalances;
}

/**
 * @param {'solana' | 'base' | 'celo'} [chain]
 * @returns {Promise<object[]>}
 */
export async function listActivePayerWallets(chain) {
  const c = chain ? normalizeLabChain(chain) : null;
  const filter = { role: 'payer', active: true };
  if (c) filter.chain = c;
  return LabWallet.find(filter).select('+encryptedSecret').lean();
}
