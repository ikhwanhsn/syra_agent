/**
 * Five-pillar taxonomy for Syra — Machine Money for Agents.
 * Single source of truth for Earn, Treasury, Invest, Spend, Grow classification.
 */
import { X402_DISCOVERY_RESOURCE_PATHS } from './x402DiscoveryResourcePaths.js';

/** Lazy import to avoid circular dependency with agentTools.js */
async function loadAgentTools() {
  const mod = await import('./agentTools.js');
  return mod.AGENT_TOOLS;
}

/** @typedef {'earn' | 'treasury' | 'invest' | 'spend' | 'grow'} PillarId */

/** @typedef {{ id: PillarId; label: string; tagline: string; order: number; routePrefixes: string[]; toolIdPatterns: (string | RegExp)[] }} PillarDef */

/** @type {Record<PillarId, PillarDef>} */
export const PILLARS = {
  earn: {
    id: 'earn',
    label: 'Earn',
    tagline: 'Agents monetize skills',
    order: 1,
    routePrefixes: ['/earn', '/kol', '/agent/marketplace', '/8004', '/agentscore', '/payouts'],
    toolIdPatterns: [/^8004/, /^purch-vault/, 'register-agent'],
  },
  treasury: {
    id: 'treasury',
    label: 'Treasury',
    tagline: 'Allocate and manage capital',
    order: 2,
    routePrefixes: [
      '/agent/wallet',
      '/agent/billing',
      '/dashboard-summary',
      '/wallet/solana',
      '/pillars',
    ],
    toolIdPatterns: [],
  },
  invest: {
    id: 'invest',
    label: 'Invest',
    tagline: 'Deploy capital autonomously',
    order: 3,
    routePrefixes: [
      '/invest',
      '/giza',
      '/jupiter',
      '/experiment/lp-agent-real',
      '/experiment/lp-agent',
      '/experiment/trading-agent',
      '/uponly-rise',
      '/bankr',
      '/squid',
    ],
    toolIdPatterns: [/^giza-/, /^jupiter-swap/, /^rise-/, /^lp_real_/, /^lp-real/, /^squid-/],
  },
  spend: {
    id: 'spend',
    label: 'Spend',
    tagline: 'x402 native payments',
    order: 4,
    routePrefixes: [
      '/brain',
      '/news',
      '/signal',
      '/sentiment',
      '/event',
      '/trending-headline',
      '/sundown-digest',
      '/health',
      '/mpp',
      '/nansen',
      '/binance',
      '/x-analyzer',
      '/x-projects-analyze',
      '/x/',
      '/agent/tools',
      '/indicator',
      '/arbitrage',
      '/pumpfun',
      '/rise',
      '/coingecko',
      '/assets',
      '/bitcoin',
      '/spcx',
      '/equity',
      '/neynar',
      '/siwa',
      '/analytics/summary',
    ],
    toolIdPatterns: [],
  },
  grow: {
    id: 'grow',
    label: 'Grow',
    tagline: 'Yield + portfolio optimization',
    order: 5,
    routePrefixes: ['/grow', '/staking', '/streamflow-locks', '/analytics/kpi'],
    toolIdPatterns: [/^zerion-/, /^gmgn-portfolio/, /^giza-/],
  },
};

/** @type {PillarId[]} */
export const PILLAR_ORDER = ['earn', 'treasury', 'invest', 'spend', 'grow'];

/**
 * Match a path against pillar route prefixes (longest prefix wins among matches).
 * @param {string} path
 * @returns {PillarId}
 */
export function resolvePillarForPath(path) {
  const p = String(path || '').split('?')[0].toLowerCase();
  if (!p) return 'spend';

  /** @type {{ id: PillarId; len: number } | null} */
  let best = null;

  for (const id of PILLAR_ORDER) {
    const def = PILLARS[id];
    for (const prefix of def.routePrefixes) {
      const pre = prefix.toLowerCase();
      if (p === pre || p.startsWith(pre.endsWith('/') ? pre : `${pre}/`) || p.startsWith(pre)) {
        if (!best || pre.length > best.len) {
          best = { id, len: pre.length };
        }
      }
    }
  }

  if (best) return best.id;

  // x402 discovery paths default to spend
  const segment = p.replace(/^\//, '').split('/')[0];
  if (X402_DISCOVERY_RESOURCE_PATHS.includes(segment)) return 'spend';

  return 'spend';
}

/**
 * @param {string} toolId
 * @returns {PillarId}
 */
/**
 * @param {string} toolId
 * @param {{ id: string; path?: string } | undefined} [toolHint] — optional pre-resolved tool
 * @returns {PillarId}
 */
export function resolvePillarForToolId(toolId, toolHint) {
  const id = String(toolId || '').trim();
  if (!id) return 'spend';

  for (const pillarId of PILLAR_ORDER) {
    const def = PILLARS[pillarId];
    for (const pattern of def.toolIdPatterns) {
      if (typeof pattern === 'string' && id === pattern) return pillarId;
      if (pattern instanceof RegExp && pattern.test(id)) return pillarId;
    }
  }

  if (toolHint?.path) return resolvePillarForPath(toolHint.path);

  return 'spend';
}

/**
 * @param {string} catalogSlug — key in X402_RESOURCE_CATALOG
 * @returns {PillarId}
 */
export function resolvePillarForCatalogSlug(catalogSlug) {
  const slug = String(catalogSlug || '').trim();
  if (!slug) return 'spend';
  return resolvePillarForPath(`/${slug}`);
}

/**
 * Build discovery payload with route/tool counts per pillar.
 * @returns {Array<PillarDef & { routeCount: number; toolCount: number }>}
 */
export async function buildPillarsDiscovery() {
  const routeCounts = Object.fromEntries(PILLAR_ORDER.map((id) => [id, 0]));
  const toolCounts = Object.fromEntries(PILLAR_ORDER.map((id) => [id, 0]));

  const agentTools = await loadAgentTools();
  for (const tool of agentTools) {
    const pillar = resolvePillarForToolId(tool.id, tool);
    toolCounts[pillar] = (toolCounts[pillar] ?? 0) + 1;
  }

  for (const segment of X402_DISCOVERY_RESOURCE_PATHS) {
    const pillar = resolvePillarForCatalogSlug(segment);
    routeCounts[pillar] = (routeCounts[pillar] ?? 0) + 1;
  }

  for (const pillarId of PILLAR_ORDER) {
    routeCounts[pillarId] = (routeCounts[pillarId] ?? 0) + PILLARS[pillarId].routePrefixes.length;
  }

  return PILLAR_ORDER.map((id) => {
    const def = PILLARS[id];
    return {
      id: def.id,
      label: def.label,
      tagline: def.tagline,
      order: def.order,
      routePrefixes: def.routePrefixes,
      routeCount: routeCounts[id] ?? 0,
      toolCount: toolCounts[id] ?? 0,
    };
  });
}

/**
 * @param {string} path — OpenAPI path key e.g. '/signal'
 * @returns {PillarId}
 */
export function resolvePillarForOpenApiPath(path) {
  return resolvePillarForPath(path);
}
