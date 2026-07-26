/**
 * Base Builder Code (ERC-8021) for x402 on-chain attribution on Base (eip155:8453).
 * @see https://docs.cdp.coinbase.com/x402/core-concepts/builder-codes
 */

import { BASE_BUILDER_CODE } from "./settlement.js";

const BUILDER_CODE_PATTERN = /^[a-z0-9_]{1,32}$/;

/**
 * @param {string} code
 * @returns {boolean}
 */
export function isValidBaseBuilderCode(code) {
  return typeof code === "string" && BUILDER_CODE_PATTERN.test(code);
}

/**
 * Syra's Base Builder Code (seller `a` + optional client `s` when using x402 fetch).
 * @returns {string | null}
 */
export function getBaseBuilderCode() {
  const raw = BASE_BUILDER_CODE;
  if (!raw) return null;
  if (!isValidBaseBuilderCode(raw)) {
    console.warn(
      `[x402] BASE_BUILDER_CODE is invalid ("${raw}"). Must match ^[a-z0-9_]{1,32}$ — builder-code attribution disabled.`,
    );
    return null;
  }
  return raw;
}
