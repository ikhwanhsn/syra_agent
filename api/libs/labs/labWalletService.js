/**
 * Lab wallet CRUD, keypair resolution, and balance reads for x402 Labs.
 */
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import LabWallet from '../../models/labs/LabWallet.js';
import {
  encryptAgentSecretForStorage,
  decryptAgentSecretFromStorage,
} from '../agentWalletSecretCrypto.js';
import { getMaxPayerWallets } from './labX402CallLog.js';
import { withSolanaRpcFallback } from '../solanaServerRpc.js';

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

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
 * @param {string} address
 * @returns {Promise<Keypair | null>}
 */
export async function getLabWalletKeypairByAddress(address) {
  const addr = String(address || '').trim();
  if (!addr) return null;
  const doc = await LabWallet.findOne({ address: addr, active: true }).select('+encryptedSecret').lean();
  if (!doc) return null;
  return keypairFromLabWalletDoc(doc);
}

/**
 * @returns {Promise<string | null>}
 */
export async function getActivePayToAddress() {
  const doc = await LabWallet.findOne({ role: 'payto', active: true }).select('address').lean();
  return doc?.address ?? null;
}

/**
 * @returns {Promise<import('@solana/web3.js').Keypair | null>}
 */
export async function getActivePayToKeypair() {
  const doc = await LabWallet.findOne({ role: 'payto', active: true }).select('+encryptedSecret').lean();
  if (!doc) return null;
  return keypairFromLabWalletDoc(doc);
}

/**
 * Read SOL + USDC balances for a lab wallet.
 * Returns `null` when the balance is *unavailable* (all RPCs failed) so callers can
 * distinguish "unknown" from a genuine zero balance — a false $0 would otherwise make a
 * funded wallet look broke and trigger unnecessary refunds.
 * @param {string} address
 * @returns {Promise<{ solBalance: number; usdcBalance: number } | null>}
 */
export async function getLabWalletBalances(address) {
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
      return { solBalance: lamports / LAMPORTS_PER_SOL, usdcBalance };
    }, `lab wallet balance ${addr.slice(0, 4)}…${addr.slice(-4)}`);
  } catch (e) {
    console.warn('[labWalletService] balance read failed on all RPCs:', e?.message || e);
    return null;
  }
}

/**
 * @param {{ label: string; role: 'payer' | 'payto' }} input
 * @returns {Promise<object>}
 */
export async function createLabWallet(input) {
  const label = String(input.label || '').trim();
  const role = input.role === 'payto' ? 'payto' : 'payer';
  if (!label) throw new Error('label is required');

  if (role === 'payto') {
    const existing = await LabWallet.findOne({ role: 'payto', active: true }).lean();
    if (existing) {
      throw new Error('An active payTo wallet already exists. Deactivate it first or use the existing one.');
    }
  } else {
    const payerCount = await LabWallet.countDocuments({ role: 'payer', active: true });
    if (payerCount >= getMaxPayerWallets()) {
      throw new Error(`Maximum of ${getMaxPayerWallets()} payer wallets allowed`);
    }
  }

  const keypair = Keypair.generate();
  const address = keypair.publicKey.toBase58();
  const encryptedSecret = encryptAgentSecretForStorage(bs58.encode(keypair.secretKey));

  const doc = await LabWallet.create({
    label,
    address,
    encryptedSecret,
    role,
    chain: 'solana',
    active: true,
  });

  return {
    id: doc._id.toString(),
    label: doc.label,
    address: doc.address,
    role: doc.role,
    chain: doc.chain,
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * @returns {Promise<object[]>}
 */
export async function listLabWallets() {
  const docs = await LabWallet.find({ active: true }).sort({ role: 1, createdAt: 1 }).lean();
  const withBalances = await Promise.all(
    docs.map(async (d) => {
      const balances = await getLabWalletBalances(d.address);
      const balanceAvailable = balances !== null;
      return {
        id: d._id.toString(),
        label: d.label,
        address: d.address,
        role: d.role,
        chain: d.chain,
        active: d.active,
        // null (not 0) when RPC reads failed so the UI shows "—" instead of a false $0.
        solBalance: balanceAvailable ? balances.solBalance : null,
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
 * @returns {Promise<object[]>}
 */
export async function listActivePayerWallets() {
  const docs = await LabWallet.find({ role: 'payer', active: true }).select('+encryptedSecret').lean();
  return docs;
}
