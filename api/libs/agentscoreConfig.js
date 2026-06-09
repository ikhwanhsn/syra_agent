/**
 * AgentScore integration config (merchant gate + buyer tools).
 * @see https://docs.agentscore.sh
 */

/** @returns {boolean} Enabled by default; set AGENTSCORE_GATE_ENABLED=false to disable. */
export function isAgentscoreGateEnabled() {
  const v = String(process.env.AGENTSCORE_GATE_ENABLED ?? 'true').trim().toLowerCase();
  return v !== 'false' && v !== '0' && v !== 'no';
}

/** @returns {boolean} */
export function isAgentscoreCaptureEnabled() {
  if (!isAgentscoreGateEnabled()) return false;
  const v = process.env.AGENTSCORE_CAPTURE_WALLET_ENABLED;
  if (v == null || String(v).trim() === '') return true;
  return String(v).trim().toLowerCase() !== 'false';
}

/** @returns {string | null} */
export function getAgentscoreApiKey() {
  const key = String(process.env.AGENTSCORE_API_KEY || '').trim();
  return key || null;
}

/** @returns {string | null} Server-side operator token for buyer flows (optional). */
export function getAgentscoreOperatorToken() {
  const t = String(process.env.AGENTSCORE_OPERATOR_TOKEN || '').trim();
  return t || null;
}

/**
 * @returns {import('@agent-score/commerce/dist/core.js').AgentScoreGatePolicy | Record<string, unknown>}
 */
export function buildAgentscoreGatePolicy(overrides = {}) {
  const apiKey = getAgentscoreApiKey();
  if (!apiKey) {
    throw new Error('AGENTSCORE_API_KEY is required when AgentScore gate is enabled');
  }

  const allowedRaw = String(process.env.AGENTSCORE_ALLOWED_JURISDICTIONS || 'US').trim();
  const allowedJurisdictions = allowedRaw
    ? allowedRaw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    : undefined;

  const minAgeRaw = String(process.env.AGENTSCORE_MIN_AGE || '').trim();
  const minAge = minAgeRaw ? Number.parseInt(minAgeRaw, 10) : undefined;

  const requireKyc =
    String(process.env.AGENTSCORE_REQUIRE_KYC || 'true').trim().toLowerCase() !== 'false';
  const requireSanctionsClear =
    String(process.env.AGENTSCORE_REQUIRE_SANCTIONS_CLEAR || 'true').trim().toLowerCase() !== 'false';

  return {
    apiKey,
    userAgent: `syra-api/${process.env.npm_package_version || '1.0.0'}`,
    requireKyc,
    requireSanctionsClear,
    ...(Number.isFinite(minAge) && minAge > 0 ? { minAge } : {}),
    ...(allowedJurisdictions?.length ? { allowedJurisdictions } : {}),
    ...overrides,
  };
}
