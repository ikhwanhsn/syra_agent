/**
 * Celo Builder Code (ERC-8021 Schema 2) for x402 on-chain attribution on Celo (eip155:42220).
 * Uses CELO_BUILDER_CODE, falling back to the hackathon CELO_ATTRIBUTION_TAG (celo_...).
 * @see https://docs.x402.org/extensions/builder-code
 * @see https://docs.celo.org/build-on-celo/build-with-ai/x402
 */

const BUILDER_CODE_PATTERN = /^[a-z0-9_]{1,32}$/;

function trimEnv(name) {
  return String(process.env[name] || '').trim();
}

/**
 * @param {string} code
 * @returns {boolean}
 */
export function isValidCeloBuilderCode(code) {
  return typeof code === 'string' && BUILDER_CODE_PATTERN.test(code);
}

/**
 * Syra's Celo app builder code (`a` field in ERC-8021 Schema 2).
 * Prefer CELO_BUILDER_CODE; fall back to CELO_ATTRIBUTION_TAG from celobuilders.xyz registration.
 * @returns {string | null}
 */
export function getCeloBuilderCode() {
  const raw = trimEnv('CELO_BUILDER_CODE') || trimEnv('CELO_ATTRIBUTION_TAG');
  if (!raw) return null;
  if (!isValidCeloBuilderCode(raw)) {
    console.warn(
      `[x402] Celo builder code is invalid ("${raw}"). Must match ^[a-z0-9_]{1,32}$ — builder-code attribution disabled.`,
    );
    return null;
  }
  return raw;
}

/**
 * Optional facilitator wallet code (`w` field) when self-settling on Celo.
 * @returns {string | null}
 */
export function getCeloFacilitatorWalletCode() {
  const raw = trimEnv('CELO_FACILITATOR_WALLET_CODE');
  if (!raw) return null;
  if (!isValidCeloBuilderCode(raw)) {
    console.warn(
      `[x402] CELO_FACILITATOR_WALLET_CODE is invalid ("${raw}"). Must match ^[a-z0-9_]{1,32}$ — ignored.`,
    );
    return null;
  }
  return raw;
}
