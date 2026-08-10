#!/usr/bin/env node
/**
 * Smoke check against hosted Tokens API health (and optional key-backed resolve).
 * Production must stay on hosted api.tokens.xyz — this does not start a local Tokens stack.
 *
 * Usage:
 *   node scripts/verify-tokens-api-health.js
 *   TOKENS_API_KEY=... node scripts/verify-tokens-api-health.js --resolve
 */
const base = (process.env.TOKENS_API_BASE_URL || 'https://api.tokens.xyz').replace(/\/$/, '');
const v1 = base.endsWith('/v1') ? base : `${base}/v1`;
const wantResolve = process.argv.includes('--resolve');

async function main() {
  const healthUrl = `${v1}/health`;
  const healthRes = await fetch(healthUrl, { headers: { Accept: 'application/json' } });
  const healthBody = await healthRes.json().catch(() => ({}));
  if (!healthRes.ok || healthBody.ok !== true) {
    console.error('[tokens-api] health failed', healthRes.status, healthBody);
    process.exit(1);
  }
  console.log('[tokens-api] health ok', healthUrl);

  if (!wantResolve) {
    process.exit(0);
  }

  const apiKey = process.env.TOKENS_API_KEY?.trim();
  if (!apiKey) {
    console.error('[tokens-api] --resolve requires TOKENS_API_KEY');
    process.exit(1);
  }

  const resolveUrl = new URL(`${v1}/assets/resolve`);
  resolveUrl.searchParams.set('ref', 'solana');
  const resolveRes = await fetch(resolveUrl, {
    headers: {
      Accept: 'application/json',
      'x-api-key': apiKey,
    },
  });
  const resolveBody = await resolveRes.json().catch(() => ({}));
  if (!resolveRes.ok) {
    console.error('[tokens-api] resolve failed', resolveRes.status, resolveBody);
    process.exit(1);
  }
  const assetId =
    resolveBody.assetId ||
    resolveBody.id ||
    resolveBody.asset?.assetId ||
    resolveBody.asset?.id;
  if (!assetId) {
    console.error('[tokens-api] resolve returned no assetId', resolveBody);
    process.exit(1);
  }
  console.log('[tokens-api] resolve ok', { ref: 'solana', assetId });
  process.exit(0);
}

main().catch((err) => {
  console.error('[tokens-api]', err?.message || err);
  process.exit(1);
});
