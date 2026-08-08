/**
 * Pick the richest Lab wallet (PayTo or payer) as the USDC/USDT0 top-up funder.
 * Used by proactive refunds and treasury capacity assessment so auto-call keeps
 * running while any wallet holds enough for one call (not only PayTo).
 */
import LabWallet from '../../models/labs/LabWallet.js';
import { normalizeLabChain, isEvmLabChain, isAvmLabChain } from '../../models/labs/LabX402Settings.js';
import {
  keypairFromLabWalletDoc,
  evmAccountFromLabWalletDoc,
  algorandAccountFromLabWalletDoc,
  getLabWalletBalances,
} from './labWalletService.js';
import {
  getAlgorandAccountSpendableMicro,
  MICRO_ALGO,
  PAYTO_USDC_REFUND_MIN_FEE_MICRO,
} from './labAlgorandFeeBuffer.js';

/** Min spendable ALGO for a "gas-ready" Algorand USDC funder (~0.004). */
export const ALGORAND_FUNDER_MIN_FEE_ALGO =
  Number(PAYTO_USDC_REFUND_MIN_FEE_MICRO) / Number(MICRO_ALGO);

/**
 * Normalize address for equality (EVM is case-insensitive).
 * @param {string} a
 * @param {string} [chain]
 */
export function normalizeLabAddress(a, chain) {
  const s = String(a || '').trim();
  if (!s) return '';
  if (chain === 'base' || chain === 'xlayer' || /^0x/i.test(s)) {
    return s.toLowerCase();
  }
  return s;
}

/**
 * Pure: select the highest-USDC candidate that can fund, excluding a recipient,
 * meeting native gas floor, and keeping a USDC reserve on the funder when needed.
 *
 * @param {Array<{
 *   address: string;
 *   usdc: number;
 *   native: number;
 *   role?: string;
 *   optedInUsdc?: boolean | null;
 *   [k: string]: unknown;
 * }>} candidates
 * @param {{
 *   excludeAddress?: string | null;
 *   minUsdc?: number;
 *   minNative?: number;
 *   reserveUsdc?: number;
 *   zeroReserveForPayTo?: boolean;
 *   chain?: string;
 *   requireOptedIn?: boolean;
 * }} [opts]
 * @returns {{
 *   address: string;
 *   usdc: number;
 *   native: number;
 *   role?: string;
 *   optedInUsdc?: boolean | null;
 *   lendableUsdc: number;
 *   raw: object;
 * } | null}
 */
export function pickRichestFunder(candidates, opts = {}) {
  const list = Array.isArray(candidates) ? candidates : [];
  const chain = opts.chain ? normalizeLabChain(opts.chain) : undefined;
  const exclude = normalizeLabAddress(opts.excludeAddress, chain);
  const minUsdc = Number.isFinite(Number(opts.minUsdc)) ? Math.max(0, Number(opts.minUsdc)) : 0;
  const minNative = Number.isFinite(Number(opts.minNative)) ? Math.max(0, Number(opts.minNative)) : 0;
  const baseReserve = Number.isFinite(Number(opts.reserveUsdc))
    ? Math.max(0, Number(opts.reserveUsdc))
    : 0;
  const zeroReserveForPayTo = opts.zeroReserveForPayTo !== false;
  const requireOptedIn = opts.requireOptedIn === true;

  /** @type {Array<{ address: string; usdc: number; native: number; role?: string; optedInUsdc?: boolean | null; lendableUsdc: number; raw: object }>} */
  const eligible = [];
  for (const c of list) {
    if (!c || typeof c !== 'object') continue;
    const address = String(c.address || '').trim();
    if (!address) continue;
    if (exclude && normalizeLabAddress(address, chain) === exclude) continue;
    const usdc = Number(c.usdc);
    const native = Number(c.native);
    if (!Number.isFinite(usdc) || usdc < 0) continue;
    if (!Number.isFinite(native) || native < minNative) continue;
    if (requireOptedIn && c.optedInUsdc === false) continue;
    const reserve =
      zeroReserveForPayTo && c.role === 'payto' ? 0 : baseReserve;
    const lendable = Math.max(0, Math.round((usdc - reserve) * 1e6) / 1e6);
    if (minUsdc > 0 && lendable < minUsdc) continue;
    if (minUsdc <= 0 && lendable <= 0 && usdc <= 0) continue;
    eligible.push({
      address,
      usdc,
      native,
      role: c.role,
      optedInUsdc: c.optedInUsdc ?? null,
      lendableUsdc: lendable,
      raw: c,
    });
  }

  if (eligible.length === 0) return null;

  // Highest USDC first; on tie prefer payto, then higher native, then address order
  eligible.sort((a, b) => {
    if (b.usdc !== a.usdc) return b.usdc - a.usdc;
    if (a.role === 'payto' && b.role !== 'payto') return -1;
    if (b.role === 'payto' && a.role !== 'payto') return 1;
    if (b.native !== a.native) return b.native - a.native;
    return String(a.address).localeCompare(String(b.address));
  });

  return eligible[0];
}

/**
 * Algorand: prefer a USDC funder that already has spendable ALGO for one ASA refund,
 * then fall back to richest USDC (fee ALGO borrowed onto that wallet mid-tick).
 *
 * Avoids picking PayTo with high USDC / near-zero ALGO when a sibling can fund both.
 *
 * @param {Parameters<typeof pickRichestFunder>[0]} candidates
 * @param {Omit<Parameters<typeof pickRichestFunder>[1], 'chain' | 'requireOptedIn'> & {
 *   preferredMinNative?: number;
 * }} [opts]
 * @returns {ReturnType<typeof pickRichestFunder>}
 */
export function pickAlgorandFunderPreferGasReady(candidates, opts = {}) {
  const preferredMinNative = Number.isFinite(Number(opts.preferredMinNative))
    ? Math.max(0, Number(opts.preferredMinNative))
    : ALGORAND_FUNDER_MIN_FEE_ALGO;
  const fallbackMinNative = Number.isFinite(Number(opts.minNative))
    ? Math.max(0, Number(opts.minNative))
    : 0;

  const base = {
    excludeAddress: opts.excludeAddress,
    minUsdc: opts.minUsdc,
    reserveUsdc: opts.reserveUsdc,
    zeroReserveForPayTo: opts.zeroReserveForPayTo,
    chain: 'algorand',
    requireOptedIn: true,
  };

  const gasReady = pickRichestFunder(candidates, {
    ...base,
    minNative: preferredMinNative,
  });
  if (gasReady) return gasReady;

  return pickRichestFunder(candidates, {
    ...base,
    minNative: fallbackMinNative,
  });
}

/**
 * Load active payer + payto docs with secrets for a chain.
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @returns {Promise<object[]>}
 */
export async function listActiveLabFundableWallets(chain) {
  const c = normalizeLabChain(chain);
  return LabWallet.find({
    chain: c,
    active: true,
    role: { $in: ['payer', 'payto'] },
  })
    .select('+encryptedSecret')
    .sort({ role: 1, createdAt: 1 })
    .lean();
}

/**
 * Build balance candidates (no secrets) for treasury assessment.
 *
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @returns {Promise<Array<{
 *   address: string;
 *   usdc: number;
 *   native: number;
 *   role: string;
 *   optedInUsdc: boolean | null;
 * }>>}
 */
export async function loadFunderCandidates(chain) {
  const c = normalizeLabChain(chain);
  const docs = await listActiveLabFundableWallets(c);
  /** @type {Array<{ address: string; usdc: number; native: number; role: string; optedInUsdc: boolean | null }>} */
  const out = [];

  for (const doc of docs) {
    const address = String(doc.address || '').trim();
    if (!address) continue;
    try {
      const bal = await getLabWalletBalances(address, c);
      if (!bal) {
        out.push({
          address,
          usdc: 0,
          native: 0,
          role: doc.role,
          optedInUsdc: c === 'algorand' ? false : null,
        });
        continue;
      }
      let native = bal.nativeBalance ?? 0;
      if (c === 'algorand') {
        try {
          const spendable = await getAlgorandAccountSpendableMicro(address);
          native = Number(spendable.spendableMicro) / Number(MICRO_ALGO);
        } catch {
          /* keep nativeBalance */
        }
      }
      out.push({
        address,
        usdc: Number(bal.usdcBalance) || 0,
        native: Number(native) || 0,
        role: doc.role,
        optedInUsdc: c === 'algorand' ? Boolean(bal.optedInUsdc) : null,
      });
    } catch {
      out.push({
        address,
        usdc: 0,
        native: 0,
        role: doc.role,
        optedInUsdc: c === 'algorand' ? false : null,
      });
    }
  }
  return out;
}

/**
 * Resolve richest funder with a signed account for transfers.
 *
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @param {{
 *   excludePayer?: string | null;
 *   minUsdc?: number;
 *   minNative?: number;
 *   reserveUsdc?: number;
 * }} [opts]
 * @returns {Promise<{
 *   address: string;
 *   usdc: number;
 *   native: number;
 *   role: string;
 *   optedInUsdc: boolean | null;
 *   lendableUsdc: number;
 *   account: unknown;
 *   chain: string;
 * } | null>}
 */
export async function resolveRichestFunder(chain, opts = {}) {
  const c = normalizeLabChain(chain);
  const docs = await listActiveLabFundableWallets(c);
  if (docs.length === 0) return null;

  /** @type {Array<{
   *   address: string;
   *   usdc: number;
   *   native: number;
   *   role: string;
   *   optedInUsdc: boolean | null;
   *   account: unknown;
   * }>} */
  const candidates = [];

  for (const doc of docs) {
    const address = String(doc.address || '').trim();
    if (!address || !doc.encryptedSecret) continue;
    try {
      let account;
      if (isAvmLabChain(c)) {
        account = algorandAccountFromLabWalletDoc(doc);
      } else if (isEvmLabChain(c)) {
        account = evmAccountFromLabWalletDoc(doc);
      } else {
        account = keypairFromLabWalletDoc(doc);
      }

      const bal = await getLabWalletBalances(address, c);
      let native = bal?.nativeBalance ?? 0;
      let optedInUsdc = c === 'algorand' ? Boolean(bal?.optedInUsdc) : null;
      if (c === 'algorand') {
        try {
          const spendable = await getAlgorandAccountSpendableMicro(address);
          native = Number(spendable.spendableMicro) / Number(MICRO_ALGO);
        } catch {
          /* keep */
        }
      }

      candidates.push({
        address,
        usdc: Number(bal?.usdcBalance) || 0,
        native: Number(native) || 0,
        role: doc.role,
        optedInUsdc,
        account,
      });
    } catch (e) {
      console.warn(
        `[labFunderSelector] skip wallet ${address}:`,
        e?.message || e,
      );
    }
  }

  const pickOpts = {
    excludeAddress: opts.excludePayer,
    minUsdc: opts.minUsdc,
    minNative: opts.minNative,
    reserveUsdc: opts.reserveUsdc,
    chain: c,
    requireOptedIn: c === 'algorand',
  };
  const picked =
    c === 'algorand'
      ? pickAlgorandFunderPreferGasReady(candidates, pickOpts)
      : pickRichestFunder(candidates, pickOpts);

  if (!picked) return null;

  const match = candidates.find(
    (x) => normalizeLabAddress(x.address, c) === normalizeLabAddress(picked.address, c),
  );
  if (!match?.account) return null;

  return {
    address: picked.address,
    usdc: picked.usdc,
    native: picked.native,
    role: String(picked.role || match.role || 'payer'),
    optedInUsdc: picked.optedInUsdc,
    lendableUsdc: picked.lendableUsdc,
    account: match.account,
    chain: c,
  };
}
