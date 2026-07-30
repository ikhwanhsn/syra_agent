/**
 * Yield.xyz AgentKit read-only agent tools (discovery + diligence).
 * Upstream: mcp.yield.xyz (x402 via Coinbase CDP Facilitator on Base).
 * @see https://docs.yield.xyz/docs/tool-reference
 * @see https://x.com/yield_xyz/status/2082834483057688719
 */
import {
  X402_API_PRICE_YIELD_USD,
  X402_DISPLAY_PRICE_YIELD_USD,
} from './x402Pricing.js';

/**
 * @param {string} slug
 * @param {string} name
 * @param {string} description
 * @param {string[]} [requiredParams]
 * @param {'GET'|'POST'} [method]
 */
function row(slug, name, description, requiredParams = [], method = 'GET') {
  return {
    id: `yield-${slug}`,
    agentDirect: true,
    path: `/yield/${slug}`,
    method,
    priceUsd: X402_API_PRICE_YIELD_USD,
    displayPriceUsd: X402_DISPLAY_PRICE_YIELD_USD,
    pillar: 'invest',
    name,
    description,
    requiredParams,
  };
}

/** @type {ReturnType<typeof row>[]} */
export const YIELD_AGENT_TOOLS = [
  row(
    'find',
    'Yield.xyz: find opportunities',
    'Search 3,000+ onchain yield opportunities across 80+ networks (lending, vaults, staking, RWAs, LST). Params: token, search, networks[], types[], inputTokens[], providers[], yieldIds[], sort (rewardRateDesc|rewardRateAsc|statusEnterAsc|statusEnterDesc|statusExitAsc|statusExitDesc), hasCooldownPeriod, hasWarmupPeriod, limit (1-50), offset.',
  ),
  row(
    'get',
    'Yield.xyz: get opportunity',
    'Full metadata for one yield: fees, lockup/cooldown, reward mechanics, entry/exit status, risk summary. Param: yieldId (required), e.g. "base-usdc-aave-v3".',
    ['yieldId'],
  ),
  row(
    'networks',
    'Yield.xyz: list networks',
    'List all networks supported by Yield.xyz AgentKit (id, name, category).',
  ),
  row(
    'providers',
    'Yield.xyz: list providers',
    'List yield protocols and validator providers (id, name, type, tvlUsd). Params: limit, offset.',
  ),
  row(
    'risk',
    'Yield.xyz: risk rating',
    'Aggregate risk rating for a yield (letter grade, numeric score, provider URL). Strongest coverage for vault-type yields. Param: yieldId (required).',
    ['yieldId'],
  ),
  row(
    'reward-history',
    'Yield.xyz: reward-rate history',
    'Historical APY / reward-rate snapshots for a yield. Params: yieldId (required); optional period (1d–all), interval (day|week|month), limit, offset.',
    ['yieldId'],
  ),
  row(
    'tvl-history',
    'Yield.xyz: TVL history',
    'Historical TVL snapshots for a yield. Params: yieldId (required); optional period, interval, limit, offset. Strongest coverage for vault-type yields.',
    ['yieldId'],
  ),
  row(
    'balances',
    'Yield.xyz: wallet balances',
    'Active positions, pending actions, and claimable rewards for a wallet on a network. Params: address (required), network (required, e.g. base|ethereum|solana).',
    ['address', 'network'],
  ),
];

/**
 * @param {string} toolId
 * @returns {string | null}
 */
export function getYieldParamsHintForLlm(toolId) {
  const hints = {
    'yield-find':
      'Params: token (e.g. USDC), search, networks (array or CSV), types (staking|lending|vault|restaking|liquidity_pool|concentrated_liquidity_pool|real_world_asset|fixed_yield), inputTokens, providers, sort=rewardRateDesc, limit, offset.',
    'yield-get': 'Params: yieldId (required) — e.g. base-usdc-aave-v3 or ethereum-eth-lido-staking.',
    'yield-networks': 'No required params.',
    'yield-providers': 'Optional: limit, offset.',
    'yield-risk': 'Params: yieldId (required).',
    'yield-reward-history':
      'Params: yieldId (required). Optional: period (1d|7d|30d|90d|1y|all), interval (day|week|month), limit, offset.',
    'yield-tvl-history':
      'Params: yieldId (required). Optional: period, interval (day|week|month), limit, offset.',
    'yield-balances':
      'Params: address (required wallet), network (required, e.g. base, ethereum, solana, arbitrum).',
  };
  return hints[toolId] || null;
}

/**
 * @param {string} toolId
 * @param {Record<string, unknown>} p
 * @returns {string[] | null}
 */
export function getYieldGateMissing(toolId, p) {
  const tool = YIELD_AGENT_TOOLS.find((t) => t.id === toolId);
  if (!tool?.requiredParams?.length) return null;
  const missing = [];
  for (const k of tool.requiredParams) {
    if (p[k] == null || String(p[k]).trim() === '') missing.push(k);
  }
  return missing.length ? missing : null;
}
