/**
 * ERC-8021 Schema 2 attribution helpers for Celo x402 / hackathon tagging.
 * Uses @x402/extensions/builder-code (CBOR Schema 2) — required for Dune x402 volume columns.
 * @see https://docs.x402.org/extensions/builder-code
 */
import {
  encodeBuilderCodeSuffix,
  parseBuilderCodeSuffixFromCalldata,
  ERC_8021_MARKER,
} from '@x402/extensions/builder-code';
import { getCeloBuilderCode } from '../config/celoBuilderCode.js';

/**
 * Build ERC-8021 Schema 2 data suffix with Syra's Celo app code (`a`).
 * @returns {`0x${string}` | null}
 */
export function getCeloDataSuffix() {
  const code = getCeloBuilderCode();
  if (!code) {
    console.warn(
      '[celoAttribution] CELO_BUILDER_CODE / CELO_ATTRIBUTION_TAG is not set — Celo txs will not be credited on the hackathon leaderboard',
    );
    return null;
  }
  try {
    return /** @type {`0x${string}`} */ (encodeBuilderCodeSuffix({ a: code }));
  } catch (e) {
    console.warn('[celoAttribution] failed to encode Schema 2 builder-code suffix:', e?.message || e);
    return null;
  }
}

/**
 * Append ERC-8021 data suffix to ABI-encoded calldata (or return suffix alone for empty data).
 * @param {`0x${string}` | string | undefined | null} calldata
 * @param {`0x${string}` | null} [suffix]
 * @returns {`0x${string}`}
 */
export function appendCeloDataSuffix(calldata, suffix = getCeloDataSuffix()) {
  const base = String(calldata || '0x').trim();
  if (!suffix) {
    return /** @type {`0x${string}`} */ (base.startsWith('0x') ? base : `0x${base}`);
  }
  const suffixHex = suffix.startsWith('0x') ? suffix.slice(2) : suffix;
  if (base === '0x' || base === '') {
    return /** @type {`0x${string}`} */ (`0x${suffixHex}`);
  }
  const without0x = base.startsWith('0x') ? base.slice(2) : base;
  return /** @type {`0x${string}`} */ (`0x${without0x}${suffixHex}`);
}

/**
 * Decode ERC-8021 Schema 2 builder-code attribution from calldata.
 * @param {`0x${string}` | string} data
 * @returns {{ a?: string; w?: string; s?: string | string[]; schemaId: number } | null}
 */
export function decodeCeloAttribution(data) {
  try {
    const hex = /** @type {`0x${string}`} */ (
      String(data || '').startsWith('0x') ? data : `0x${data}`
    );
    const parsed = parseBuilderCodeSuffixFromCalldata(hex);
    if (!parsed) return null;
    return { ...parsed, schemaId: 2 };
  } catch {
    return null;
  }
}

export { ERC_8021_MARKER, encodeBuilderCodeSuffix, parseBuilderCodeSuffixFromCalldata };
