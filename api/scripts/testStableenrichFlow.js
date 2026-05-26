/**
 * Probe StableEnrich x402 (sync endpoint)
 * Usage: npm run test-stableenrich
 */
import { callX402V2WithTreasury } from '../libs/agentX402Client.js';

const BASE = (process.env.STABLEENRICH_API_BASE_URL || 'https://stableenrich.dev').replace(/\/$/, '');

async function main() {
  console.log('POST /api/exa/search …');
  const result = await callX402V2WithTreasury({
    url: `${BASE}/api/exa/search`,
    method: 'POST',
    body: {
      query: 'Solana hackathon winners',
      numResults: 3,
    },
  });
  if (!result.success) {
    throw new Error(result.error || 'request failed');
  }
  console.log('OK', JSON.stringify(result.data).slice(0, 600));
}

main().catch((e) => {
  console.error('FAILED', e.message || e);
  process.exit(1);
});
