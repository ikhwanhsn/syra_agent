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
 * @returns {'solana' | 'base' | 'algorand' | 'xlayer'}
 */
export function inferLabPayerChain(payer, labChainHeader) {
  const fromHeader = String(labChainHeader || '')
    .trim()
    .toLowerCase();
  if (
    fromHeader === 'base' ||
    fromHeader === 'solana' ||
    fromHeader === 'algorand' ||
    fromHeader === 'xlayer'
  ) {
    return fromHeader;
  }
  if (fromHeader === 'x-layer' || fromHeader === 'okx' || fromHeader === '196') {
    return 'xlayer';
  }
  const addr = String(payer || '').trim();
  // 0x alone cannot distinguish Base vs X Layer — default Base unless header says otherwise.
  if (/^0x/i.test(addr)) return 'base';
  if (looksLikeAlgorandAddress(addr)) return 'algorand';
  return 'solana';
}
