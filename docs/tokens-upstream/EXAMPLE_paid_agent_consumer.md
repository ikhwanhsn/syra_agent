# Example: paid agent consumer of Tokens (API-key proxy pattern)

Optional contribution for Tokens docs. Syra’s production pattern:

1. Server holds `TOKENS_API_KEY` (never in the agent client)
2. Agent calls Syra MCP / x402 tools (`tokens-*` or `asset-research`)
3. Syra proxies to `https://api.tokens.xyz/v1/...` with `x-api-key`
4. User pays Syra USDC per call; Tokens usage is billed to Syra’s platform key

Minimal Node fetch (server-side only):

```js
const base = (process.env.TOKENS_API_BASE_URL || 'https://api.tokens.xyz').replace(/\/$/, '');
const v1 = base.endsWith('/v1') ? base : `${base}/v1`;

async function tokensGet(path, query = {}) {
  const url = new URL(`${v1}${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v != null && String(v).trim() !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-api-key': process.env.TOKENS_API_KEY,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || body.error || `Tokens HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

// Agent path: resolve → risk
const resolved = await tokensGet('/assets/resolve', { ref: 'solana' });
const assetId = resolved.assetId || resolved.asset?.assetId;
const risk = await tokensGet(`/assets/${encodeURIComponent(assetId)}/risk-summary`);
```

Production stays on **hosted** `api.tokens.xyz`. Do not require self-hosting the Tokens monorepo for agent commerce.

Live Syra surfaces: https://www.syraa.fun/assets · OSS: https://github.com/solana-foundation/tokens
