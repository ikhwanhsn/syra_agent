/**
 * Extra wallets whose on-chain $SYRA buys count toward public buyback totals
 * but are never exposed as proof wallets / recent txs in /api/metrics.
 *
 * Override with BUYBACK_TOTALS_WALLETS (comma-separated pubkeys) to replace the default list.
 */
import { PublicKey } from "@solana/web3.js";
import { resolveTreasuryWallet } from "../libs/buybackRecord.js";

/** @type {readonly string[]} */
export const DEFAULT_BUYBACK_TOTALS_WALLETS = Object.freeze([
  "2uF4W95fKCQEhg64H6voKmZfTpVcCbo7SUUiaovoDaos",
  "7hfqDiKUAvKMXtucWbG4GctzKDKM7g7pSECBgDZCapBF",
  "aJmUU4VPZ6Vbq2TiXPXBFbjQjX48ySaW5wyLMLwh5ED",
  "92frdGzBDmoMoXuqj7s5XGMyiob761AmWCgRT4EsrJ5M",
  "7x49htzYEW6f4m6x2P7rUrYHuXcQhidTTvEsJWMvmK5p",
  "Ce84rLJ5LYtnr16M8jHpD3A7JsfdF5rHxjAwmrFxQYfr",
]);

/**
 * @param {string} raw
 * @returns {string | null}
 */
function normalizePubkey(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  try {
    return new PublicKey(s).toBase58();
  } catch {
    return null;
  }
}

/**
 * Silent totals-only wallets (excludes primary treasury so sync never double-scans).
 * @param {{
 *   envValue?: string | null;
 *   primaryWallet?: string | null;
 *   defaults?: readonly string[];
 * }} [opts]
 * @returns {string[]}
 */
export function resolveBuybackTotalsWallets(opts = {}) {
  const envRaw =
    opts.envValue !== undefined
      ? opts.envValue
      : process.env.BUYBACK_TOTALS_WALLETS;
  const hasEnvOverride =
    envRaw != null && String(envRaw).trim() !== "";
  const source = hasEnvOverride
    ? String(envRaw)
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
    : [...(opts.defaults ?? DEFAULT_BUYBACK_TOTALS_WALLETS)];

  const primary =
    opts.primaryWallet !== undefined
      ? opts.primaryWallet
      : resolveTreasuryWallet();
  const primaryNorm = primary ? normalizePubkey(primary) : null;

  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const raw of source) {
    const pk = normalizePubkey(raw);
    if (!pk) continue;
    if (primaryNorm && pk === primaryNorm) continue;
    if (seen.has(pk)) continue;
    seen.add(pk);
    out.push(pk);
  }
  return out;
}
