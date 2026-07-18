/**
 * Detect Solana vs EVM token address kind for the multi-chain analyzer.
 */

/** @param {unknown} s */
function trim(s) {
  return s != null ? String(s).trim() : '';
}

/**
 * @param {string} s
 * @returns {boolean}
 */
export function isLikelySolanaMint(s) {
  const t = trim(s);
  if (t.length < 32 || t.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

/**
 * @param {string} s
 * @returns {boolean}
 */
export function isEvmAddress(s) {
  const t = trim(s);
  return /^0x[a-fA-F0-9]{40}$/.test(t);
}

/**
 * @param {string} addr
 * @returns {'solana' | 'evm' | null}
 */
export function detectTokenChainKind(addr) {
  const t = trim(addr);
  if (!t) return null;
  if (isEvmAddress(t)) return 'evm';
  if (isLikelySolanaMint(t)) return 'solana';
  return null;
}

/**
 * Normalize address for cache keys / API calls.
 * EVM addresses are lowercased; Solana mints are left as-is.
 * @param {string} addr
 * @returns {string | null}
 */
export function normalizeTokenAddress(addr) {
  const kind = detectTokenChainKind(addr);
  if (!kind) return null;
  const t = trim(addr);
  return kind === 'evm' ? t.toLowerCase() : t;
}
