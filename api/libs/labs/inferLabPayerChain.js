/**
 * Infer Labs x402 chain from request header or payer address shape.
 */

/**
 * Algorand addresses are 58-char base32 (A-Z2-7), checksummed.
 * @param {string} addr
 * @returns {boolean}
 */
export function looksLikeAlgorandAddress(addr) {
  const s = String(addr || '').trim();
  return /^[A-Z2-7]{58}$/.test(s);
}

/**
 * @param {string} payer
 * @param {string | null | undefined} labChainHeader
 * @returns {'solana' | 'base' | 'celo' | 'algorand'}
 */
export function inferLabPayerChain(payer, labChainHeader) {
  const fromHeader = String(labChainHeader || '')
    .trim()
    .toLowerCase();
  if (
    fromHeader === 'base' ||
    fromHeader === 'solana' ||
    fromHeader === 'celo' ||
    fromHeader === 'algorand'
  ) {
    return fromHeader;
  }
  const addr = String(payer || '').trim();
  if (/^0x/i.test(addr)) return 'base';
  if (looksLikeAlgorandAddress(addr)) return 'algorand';
  return 'solana';
}
