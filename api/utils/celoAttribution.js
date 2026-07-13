/**
 * ERC-8021 attribution helpers for Celo hackathon tagging.
 * Uses @celo/attribution-tags (wraps ox/erc8021).
 */
import { toDataSuffix, fromDataSuffix, ERC_8021_MARKER } from '@celo/attribution-tags';
import { getCeloAttributionTag } from '../config/celoX402Networks.js';

/**
 * @returns {`0x${string}` | null}
 */
export function getCeloDataSuffix() {
  const tag = getCeloAttributionTag();
  if (!tag) {
    console.warn(
      '[celoAttribution] CELO_ATTRIBUTION_TAG is not set — Celo txs will not be credited on the hackathon leaderboard',
    );
    return null;
  }
  try {
    return /** @type {`0x${string}`} */ (toDataSuffix(tag));
  } catch (e) {
    console.warn('[celoAttribution] invalid CELO_ATTRIBUTION_TAG:', e?.message || e);
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
 * @param {`0x${string}` | string} data
 * @returns {{ codes: string[]; schemaId: number } | null}
 */
export function decodeCeloAttribution(data) {
  try {
    return fromDataSuffix(/** @type {`0x${string}`} */ (data));
  } catch {
    return null;
  }
}

export { ERC_8021_MARKER, toDataSuffix, fromDataSuffix };
