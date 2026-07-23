/**
 * Resolve Labs payTo override from active wallets + x-lab-x402-chain header.
 * Each tab is isolated so a Solana-only PayTo cannot trigger solanaOnlyOverride
 * and strip Base EVM accepts (and vice versa).
 *
 * @param {string | null | undefined} labChainHeader
 * @param {{
 *   solanaPayTo?: string | null;
 *   evmPayTo?: string | null;
 *   basePayTo?: string | null;
 *   algorandPayTo?: string | null;
 * }} addresses
 * @returns {{
 *   solanaPayTo: string | null;
 *   evmPayTo: string | null;
 *   algorandPayTo: string | null;
 * } | null}
 *   null → fall back to env payTo addresses
 */
export function resolveLabsPayToOverride(labChainHeader, addresses = {}) {
  const solanaPayTo = addresses.solanaPayTo ?? null;
  const basePayTo = addresses.basePayTo ?? addresses.evmPayTo ?? null;
  const algorandPayTo = addresses.algorandPayTo ?? null;
  const labChain = String(labChainHeader || '')
    .trim()
    .toLowerCase();

  if (labChain === 'base') {
    if (!basePayTo) return null;
    // Isolate Base: never pass Solana PayTo (that would enable solanaOnlyOverride
    // when Base PayTo is missing, or mix SVM accepts into Base ExactEvmScheme flows).
    return { solanaPayTo: null, evmPayTo: basePayTo, algorandPayTo: null };
  }

  if (labChain === 'algorand') {
    if (!algorandPayTo) return null;
    return { solanaPayTo: null, evmPayTo: null, algorandPayTo };
  }

  if (labChain === 'solana') {
    if (!solanaPayTo) return null;
    return { solanaPayTo, evmPayTo: null, algorandPayTo: null };
  }

  // No chain header (public discovery / non-lab clients): offer all configured PayTos.
  if (!solanaPayTo && !basePayTo && !algorandPayTo) return null;
  return {
    solanaPayTo,
    evmPayTo: basePayTo,
    algorandPayTo: algorandPayTo || null,
  };
}
