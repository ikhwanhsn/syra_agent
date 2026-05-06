/**
 * Smoke test: pay.sh catalog + provider skill JSON + live x402 GETs via treasury wallet.
 * Usage: `npm run test-paysh` from api/ (loads .env via dotenv).
 * Requires: AGENT_PRIVATE_KEY (treasury) — same as scripts/testPayFlows.js.
 * Uses catalog-listed providers; some calls still settle x402 (micro-USDC) via treasury.
 */
import { fetchCatalog, fetchProviderSkill, buildGatewayUrl } from '../libs/payshClient.js';
import { callX402V2WithTreasury } from '../libs/agentX402Client.js';

/** @typedef {{ fqn: string; path: string; method?: 'GET' | 'POST'; query?: Record<string, string>; body?: Record<string, unknown> }} PayshProbe */

/** @type {PayshProbe[]} */
const PROBES = [
  {
    fqn: 'solana-foundation/google/civicinfo',
    path: '/civicinfo/v2/elections',
    query: {},
  },
  // StableCrypto aggregates CoinGecko (POST JSON); reliable alternative if legacy Google gateway paths differ.
  {
    fqn: 'merit-systems/stablecrypto/market-data',
    path: '/api/coingecko/global',
    method: 'POST',
    body: {},
  },
  {
    fqn: 'solana-foundation/google/kgsearch',
    path: '/v1/entities:search',
    query: { query: 'Solana', limit: '1' },
  },
  {
    fqn: 'crushrewards/pricing',
    path: '/v1/analyst/category-summary',
    query: { category: 'electronics', country: 'us' },
  },
  {
    fqn: 'paysponge/coingecko',
    path: '/x402/simple/price',
    query: { vs_currencies: 'usd', ids: 'bitcoin' },
  },
];

/**
 * @param {unknown} data
 */
function printSampleKeys(data) {
  if (data == null) {
    console.log('  (null body)');
    return;
  }
  if (Array.isArray(data)) {
    console.log('  array length:', data.length);
    return;
  }
  if (typeof data === 'object') {
    const keys = Object.keys(data).slice(0, 14);
    console.log('  top-level keys:', keys.join(', '));
    return;
  }
  console.log('  primitive:', String(data).slice(0, 120));
}

/**
 * @param {PayshProbe} probe
 */
/**
 * @param {PayshProbe} probe
 * @param {{ attempts?: number }} [opts]
 */
async function runProbe(probe, opts = {}) {
  const attempts = opts.attempts ?? 3;
  const skill = await fetchProviderSkill(probe.fqn);
  const serviceUrl = typeof skill.service_url === 'string' ? skill.service_url : '';
  if (!serviceUrl) {
    throw new Error(`Missing service_url for ${probe.fqn}`);
  }
  const paths = skill.openapi_doc?.paths;
  if (!paths || typeof paths !== 'object') {
    throw new Error(`Missing openapi_doc.paths for ${probe.fqn}`);
  }

  const url = buildGatewayUrl(serviceUrl, probe.path);
  const method = probe.method === 'POST' ? 'POST' : 'GET';
  console.log(`\n--- ${probe.fqn} ---`);
  console.log(`  ${method}`, probe.path);

  let lastErr = 'x402 request failed';
  for (let i = 0; i < attempts; i++) {
    const result = await callX402V2WithTreasury({
      url,
      method,
      query: method === 'GET' ? probe.query ?? {} : probe.query ?? {},
      ...(method === 'POST' ? { body: probe.body ?? {} } : {}),
    });
    if (result.success) {
      printSampleKeys(result.data);
      return;
    }
    lastErr = result.error || lastErr;
    console.warn(`  attempt ${i + 1}/${attempts} failed: ${lastErr}`);
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw new Error(lastErr);
}

async function main() {
  console.log('--- pay.sh catalog ---');
  const catalog = await fetchCatalog();
  const n = catalog.providers?.length ?? 0;
  if (n < 75) {
    throw new Error(`Expected >= 75 providers in catalog, got ${n}`);
  }
  console.log(`Catalog OK: ${n} providers (provider_count=${catalog.provider_count ?? 'n/a'})`);

  for (const probe of PROBES) {
    await runProbe(probe);
  }

  console.log('\nAll pay.sh smoke probes passed.');
}

main().catch((e) => {
  console.error('TEST FAILED:', e instanceof Error ? e.message : e);
  process.exit(1);
});
