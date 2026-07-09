/**
 * Builds OpenAPI 3.1 `paths` for MPP / AgentCash discovery from agent tools + x402 catalog.
 * Runtime URLs match x402 (same path, HTTP 402 + x402 v2); MPP is discovery metadata (protocols: ["mpp"]).
 */
import { AGENT_TOOLS } from '../config/agentTools.js';
import { X402_DISCOVERY_RESOURCE_PATHS } from '../config/x402DiscoveryResourcePaths.js';
import { getResourceDescription } from '../config/x402ResourceCatalog.js';
/**
 * OpenAPI `price` is a catalog hint for MPPscan / AgentCash (2-decimal UIs).
 * Use production-scale display amounts so dashboards are not all $0.00 when NODE_ENV !== production
 * or when tiny microprices round down. Actual HTTP 402 amounts still come from route `priceUsd` at runtime.
 */
import {
  X402_DISPLAY_PRICE_USD,
  X402_DISPLAY_PRICE_CHECK_STATUS_USD,
  X402_DISPLAY_PRICE_NEWS_USD,
  X402_DISPLAY_PRICE_NANSEN_USD,
  X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD,
  X402_DISPLAY_PRICE_ANALYTICS_SUMMARY_USD,
  X402_DISPLAY_PRICE_JUPITER_SWAP_USD,
  X402_DISPLAY_PRICE_PUMP_FUN_TX_USD,
  X402_DISPLAY_PRICE_PUMP_FUN_READ_USD,
  X402_DISPLAY_PRICE_PUMP_FUN_MARKET_LIST_USD,
  X402_DISPLAY_PRICE_PUMP_FUN_ANALYZER_USD,
  X402_DISPLAY_PRICE_ASSETS_BOARD_USD,
  X402_DISPLAY_PRICE_ASSETS_DETAIL_USD,
  X402_DISPLAY_PRICE_BITCOIN_USD,
  X402_DISPLAY_PRICE_SQUID_ROUTE_USD,
  X402_DISPLAY_PRICE_SQUID_STATUS_USD,
  X402_DISPLAY_PRICE_WEB_SEARCH_USD,
  X402_DISPLAY_PRICE_CRAWL_USD,
  X402_DISPLAY_PRICE_BROWSER_USE_USD,
  X402_DISPLAY_PRICE_ARBITRAGE_EXPERIMENT_USD,
  X402_DISPLAY_PRICE_8004_USD,
  X402_DISPLAY_PRICE_8004SCAN_USD,
  X402_DISPLAY_PRICE_HEYLOL_USD,
  X402_DISPLAY_PRICE_GIZA_USD,
  X402_DISPLAY_PRICE_PURCH_VAULT_USD,
  X402_DISPLAY_PRICE_QUICKNODE_USD,
  X402_DISPLAY_PRICE_BANKR_USD,
  X402_DISPLAY_PRICE_NEYNAR_USD,
  X402_DISPLAY_PRICE_SIWA_USD,
  X402_DISPLAY_PRICE_BRAIN_USD,
  X402_DISPLAY_PRICE_X_USD,
  X402_DISPLAY_PRICE_X_ANALYZER_USD,
  X402_DISPLAY_PRICE_INDICATOR_USD,
  X402_DISPLAY_PRICE_JUPITER_QUOTE_USD,
  X402_DISPLAY_PRICE_SPCX_USD,
  X402_DISPLAY_PRICE_EQUITY_USD,
  X402_DISPLAY_PRICE_DEXSCREENER_PAIRS_USD,
  X402_DISPLAY_PRICE_GECKOTERMINAL_POOLS_USD,
  X402_DISPLAY_PRICE_DEFILLAMA_TVL_USD,
  X402_DISPLAY_PRICE_RUGCHECK_REPORT_USD,
  X402_DISPLAY_PRICE_PYTH_PRICE_USD,
  X402_DISPLAY_PRICE_INSIGHTS_NETWORK_HEALTH_USD,
  X402_DISPLAY_PRICE_INSIGHTS_GAS_ORACLE_USD,
  X402_DISPLAY_PRICE_INSIGHTS_MARKET_PULSE_USD,
  X402_DISPLAY_PRICE_INSIGHTS_TOKEN_METRICS_USD,
  X402_DISPLAY_PRICE_INSIGHTS_DEFI_TVL_USD,
  X402_DISPLAY_PRICE_INSIGHTS_VOLATILITY_INDEX_USD,
} from '../config/x402Pricing.js';

/** @param {number} n */
function usdPriceString(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return '0';
  const s = x.toFixed(10).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
}

/** Express `:id` → OpenAPI `{id}` */
function toOpenApiPath(path) {
  return String(path || '').replace(/:([^/]+)/g, '{$1}');
}

const GENERIC_QUERY_PARAMETERS = [
  {
    name: 'ticker',
    in: 'query',
    required: false,
    description: 'Optional ticker or category (route-specific; see Syra docs).',
    schema: { type: 'string' },
  },
  {
    name: 'q',
    in: 'query',
    required: false,
    description: 'Optional search or free-text query (route-specific).',
    schema: { type: 'string' },
  },
  {
    name: 'address',
    in: 'query',
    required: false,
    description: 'Optional wallet or contract address (route-specific).',
    schema: { type: 'string' },
  },
];

const JSON_BODY_REQUEST = {
  required: false,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        additionalProperties: true,
        description: 'JSON body for this route (required fields vary; see https://docs.syraa.fun).',
      },
    },
  },
};

/**
 * @param {string} apiPath - absolute path e.g. /okx/ticker
 */
function displayPriceForDiscoveryOnlyPath(apiPath) {
  const p = apiPath.replace(/\/+$/, '') || '/';
  if (p === '/health' || p === '/mpp/health' || p === '/mpp/v1/health') return X402_DISPLAY_PRICE_CHECK_STATUS_USD;
  if (p.startsWith('/news') || p.startsWith('/sentiment') || p.startsWith('/event') || p.startsWith('/trending-headline') || p.startsWith('/sundown-digest')) {
    return X402_DISPLAY_PRICE_NEWS_USD;
  }
  if (p.startsWith('/brain')) return X402_DISPLAY_PRICE_BRAIN_USD;
  if (p.startsWith('/browser-use')) return X402_DISPLAY_PRICE_BROWSER_USE_USD;
  if (p === '/arbitrage' || p.startsWith('/arbitrage/')) return X402_DISPLAY_PRICE_ARBITRAGE_EXPERIMENT_USD;
  if (p.startsWith('/web-search')) return X402_DISPLAY_PRICE_WEB_SEARCH_USD;
  if (p.startsWith('/crawl')) return X402_DISPLAY_PRICE_CRAWL_USD;
  if (p.startsWith('/analytics/summary')) return X402_DISPLAY_PRICE_ANALYTICS_SUMMARY_USD;
  if (p.startsWith('/giza/')) return X402_DISPLAY_PRICE_GIZA_USD;
  if (p.startsWith('/8004scan') || p === '/erc8004') return X402_DISPLAY_PRICE_8004SCAN_USD;
  if (p.startsWith('/8004')) return X402_DISPLAY_PRICE_8004_USD;
  if (p.startsWith('/heylol')) return X402_DISPLAY_PRICE_HEYLOL_USD;
  if (p.startsWith('/x-analyzer')) return X402_DISPLAY_PRICE_X_ANALYZER_USD;
  if (p === '/x' || p.startsWith('/x/')) return X402_DISPLAY_PRICE_X_USD;
  if (p.startsWith('/quicknode/')) return X402_DISPLAY_PRICE_QUICKNODE_USD;
  if (p.startsWith('/bankr/')) return X402_DISPLAY_PRICE_BANKR_USD;
  if (p.startsWith('/neynar/')) return X402_DISPLAY_PRICE_NEYNAR_USD;
  if (p.startsWith('/siwa/')) return X402_DISPLAY_PRICE_SIWA_USD;
  if (p === '/indicator' || p.startsWith('/indicator/')) return X402_DISPLAY_PRICE_INDICATOR_USD;
  if (p === '/spcx' || p.startsWith('/spcx/')) return X402_DISPLAY_PRICE_SPCX_USD;
  if (p === '/equity' || p.startsWith('/equity/')) return X402_DISPLAY_PRICE_EQUITY_USD;
  if (p.startsWith('/jupiter/quote')) return X402_DISPLAY_PRICE_JUPITER_QUOTE_USD;
  if (p.startsWith('/jupiter/swap/order')) return X402_DISPLAY_PRICE_JUPITER_SWAP_USD;
  if (p.startsWith('/pumpfun/trending') || p.startsWith('/pumpfun/movers')) {
    return X402_DISPLAY_PRICE_PUMP_FUN_MARKET_LIST_USD;
  }
  if (p === '/pumpfun/analyzer' || p.startsWith('/pumpfun/analyzer/')) {
    return X402_DISPLAY_PRICE_PUMP_FUN_ANALYZER_USD;
  }
  if (p === '/assets/detail' || p.startsWith('/assets/detail/')) {
    return X402_DISPLAY_PRICE_ASSETS_DETAIL_USD;
  }
  if (p === '/bitcoin' || p.startsWith('/bitcoin/')) return X402_DISPLAY_PRICE_BITCOIN_USD;
  if (p === '/assets' || p.startsWith('/assets/')) return X402_DISPLAY_PRICE_ASSETS_BOARD_USD;
  if (p.startsWith('/pumpfun/agent-payments/verify')) return X402_DISPLAY_PRICE_PUMP_FUN_READ_USD;
  if (p.startsWith('/pumpfun/agent-payments')) return X402_DISPLAY_PRICE_PUMP_FUN_TX_USD;
  if (p.startsWith('/pumpfun/agents')) return X402_DISPLAY_PRICE_PUMP_FUN_TX_USD;
  if (p.startsWith('/pumpfun/')) return X402_DISPLAY_PRICE_PUMP_FUN_READ_USD;
  if (p.startsWith('/squid/route')) return X402_DISPLAY_PRICE_SQUID_ROUTE_USD;
  if (p.startsWith('/squid/status')) return X402_DISPLAY_PRICE_SQUID_STATUS_USD;
  if (p.startsWith('/smart-money/') || p.startsWith('/nansen/smart-money/')) return X402_DISPLAY_PRICE_NANSEN_PREMIUM_USD;
  if (p.startsWith('/dexscreener/')) return X402_DISPLAY_PRICE_DEXSCREENER_PAIRS_USD;
  if (p.startsWith('/geckoterminal/')) return X402_DISPLAY_PRICE_GECKOTERMINAL_POOLS_USD;
  if (p.startsWith('/defillama/')) return X402_DISPLAY_PRICE_DEFILLAMA_TVL_USD;
  if (p.startsWith('/rugcheck/')) return X402_DISPLAY_PRICE_RUGCHECK_REPORT_USD;
  if (p.startsWith('/pyth/')) return X402_DISPLAY_PRICE_PYTH_PRICE_USD;
  if (p === '/insights/network-health') return X402_DISPLAY_PRICE_INSIGHTS_NETWORK_HEALTH_USD;
  if (p === '/insights/gas-oracle') return X402_DISPLAY_PRICE_INSIGHTS_GAS_ORACLE_USD;
  if (p === '/insights/market-pulse') return X402_DISPLAY_PRICE_INSIGHTS_MARKET_PULSE_USD;
  if (p === '/insights/token-metrics') return X402_DISPLAY_PRICE_INSIGHTS_TOKEN_METRICS_USD;
  if (p === '/insights/defi-tvl') return X402_DISPLAY_PRICE_INSIGHTS_DEFI_TVL_USD;
  if (p === '/insights/volatility-index') return X402_DISPLAY_PRICE_INSIGHTS_VOLATILITY_INDEX_USD;
  if (p.startsWith('/nansen/')) return X402_DISPLAY_PRICE_NANSEN_USD;
  if (p.startsWith('/smart-money') || p.startsWith('/token-god-mode')) return X402_DISPLAY_PRICE_NANSEN_USD;
  if (p.startsWith('/x402/vault')) return X402_DISPLAY_PRICE_PURCH_VAULT_USD;
  return X402_DISPLAY_PRICE_USD;
}

/**
 * @param {string} method
 * @param {string} description
 * @param {string} priceStr
 */
function operationObject(method, description, priceStr) {
  const lower = method.toLowerCase();
  /** @type {Record<string, unknown>} */
  const op = {
    description,
    'x-payment-info': {
      protocols: ['mpp'],
      pricingMode: 'fixed',
      price: priceStr,
    },
    responses: {
      '200': { description: 'OK — JSON response from Syra (shape varies by route).' },
      '402': { description: 'Payment Required' },
    },
  };
  if (lower === 'get') {
    op.parameters = GENERIC_QUERY_PARAMETERS;
  } else {
    op.parameters = [];
    op.requestBody = JSON_BODY_REQUEST;
  }
  return op;
}

/**
 * @returns {Record<string, Record<string, unknown>>}
 */
export function buildMppOpenApiPaths() {
  /** @type {Map<string, Record<string, unknown>>} */
  const pathMap = new Map();

  for (const tool of AGENT_TOOLS) {
    if (tool.tempoPublic || tool.tempoPayout) continue;
    // Zerion tools are invoked via POST /agent/tools/call (api.zerion.io x402); no GET /zerion/* on Syra.
    if (tool.zerionPath) continue;
    const raw = tool.path;
    if (!raw || typeof raw !== 'string' || !raw.startsWith('/')) continue;
    if (raw.includes('__tempo_public__')) continue;

    const key = toOpenApiPath(raw);
    const method = (tool.method || 'GET').toLowerCase();
    if (method !== 'get' && method !== 'post' && method !== 'put' && method !== 'delete' && method !== 'patch') {
      continue;
    }

    const catalogUsd =
      typeof tool.displayPriceUsd === 'number' && Number.isFinite(tool.displayPriceUsd)
        ? tool.displayPriceUsd
        : tool.priceUsd;
    const priceStr = usdPriceString(catalogUsd);
    const desc = `${tool.name}. ${tool.description}`.trim();
    const op = operationObject(method, desc, priceStr);

    if (!pathMap.has(key)) {
      pathMap.set(key, {});
    }
    const entry = pathMap.get(key);
    entry[method] = op;
  }

  const agentPaths = new Set(pathMap.keys());

  for (const segment of X402_DISCOVERY_RESOURCE_PATHS) {
    const key = `/${segment.replace(/^\/+/, '')}`.replace(/\/+/g, '/');
    if (key === '/') continue;
    if (agentPaths.has(key)) continue;

    const catalogUsd = displayPriceForDiscoveryOnlyPath(key);
    const priceStr = usdPriceString(catalogUsd);
    const desc = getResourceDescription(segment);

    const pathItem = {
      get: operationObject('GET', `${desc} (GET)`, priceStr),
      post: operationObject('POST', `${desc} (POST)`, priceStr),
    };
    pathMap.set(key, pathItem);
  }

  // Creator skills — dynamic slug at runtime; template for MPP / AgentCash discovery.
  if (!pathMap.has('/skills/{slug}')) {
    const skillsPrice = usdPriceString(X402_DISPLAY_PRICE_USD);
    const skillsDesc =
      'Paid creator skill proxy. Replace {slug} with a published skill slug from GET /skills (free catalog). Price and payTo are set per skill at runtime.';
    pathMap.set('/skills/{slug}', {
      get: operationObject('GET', `${skillsDesc} (GET)`, skillsPrice),
      post: operationObject('POST', `${skillsDesc} (POST)`, skillsPrice),
    });
  }

  // Most Syra x402 resources accept both GET and POST; mirror for discovery when only one method was registered.
  for (const item of pathMap.values()) {
    const g = item.get;
    const p = item.post;
    if (g && !p && g['x-payment-info'] && typeof g['x-payment-info'] === 'object') {
      const priceStr = String(/** @type {{ price?: string }} */ (g['x-payment-info']).price || '0');
      const desc = String(g.description || 'Syra x402 resource');
      item.post = operationObject('POST', `${desc} (POST)`, priceStr);
    } else if (p && !g && p['x-payment-info'] && typeof p['x-payment-info'] === 'object') {
      const priceStr = String(/** @type {{ price?: string }} */ (p['x-payment-info']).price || '0');
      const desc = String(p.description || 'Syra x402 resource');
      item.get = operationObject('GET', `${desc} (GET)`, priceStr);
    }
  }

  const sortedKeys = [...pathMap.keys()].sort((a, b) => a.localeCompare(b));
  /** @type {Record<string, Record<string, unknown>>} */
  const paths = {};
  for (const k of sortedKeys) {
    paths[k] = pathMap.get(k);
  }

  return paths;
}
