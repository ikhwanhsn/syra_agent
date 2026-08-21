# Nevermined x402 pilot (Syra news)

Syra remains the **crypto intel merchant**. Nevermined is an **alternate settle path** for agents that pay with Nevermined credits / card mandates / USDC via their facilitator — not a replacement for Exact Solana USDC on `/news`.

## What is live

| Path | Rail |
|------|------|
| `GET /news` | Exact USDC · Dexter → GoPlausible → PayAI (unchanged) |
| `GET /partners/nevermined/news?ticker=` | Nevermined `@nevermined-io/payments` · credits (feature-flagged) |

Same news payload shape (`{ news: [...] }`). Pilot responses also include `facilitator: "nevermined"`.

## Env (API)

| Variable | Required | Notes |
|----------|----------|--------|
| `NEVERMINED_X402_ENABLED` | yes | `true` / `1` / `yes` / `on` |
| `NVM_API_KEY` | yes | From [Nevermined App](https://nevermined.ai/docs/tutorials/integration/nvm-api-keys); prefix selects env |
| `NVM_PLAN_ID` | yes | Plan priced ≈ Syra news tier (`X402_API_PRICE_NEWS_USD`); **1 credit** per call |
| `NVM_AGENT_ID` | no | Pass when your Nevermined plan requires it |
| `NVM_ENVIRONMENT` | no | Fallback `sandbox` \| `live` (key prefix wins when recognized) |

When the flag is off or secrets are missing, the pilot returns **503** with a setup hint. It does **not** fall through to Exact `/news`.

## Facilitator hosts

- Sandbox: `https://facilitator.sandbox.nevermined.app`
- Live: `https://facilitator.live.nevermined.app`

Create the plan via Nevermined [5-minute setup](https://nevermined.ai/docs/integrate/quickstart/5-minute-setup), then set env on the Syra API host.

## Agent flow (sandbox)

1. Enable env on the API; redeploy / restart.
2. Obtain an x402 access token from Nevermined for your plan (`payments.x402.getX402AccessToken(planId)` or Nevermined client docs).
3. Call Syra:

```bash
curl -sS "https://api.syraa.fun/partners/nevermined/news?ticker=BTC" \
  -H "payment-signature: <nevermined-x402-access-token>"
```

4. Expect HTTP 200 + JSON news and a `payment-response` header from Nevermined settle.
5. Without a token, expect HTTP 402 with Nevermined `payment-required` challenge.

## Do not

- Put Nevermined into Dexter → GoPlausible → PayAI Exact failover
- Point MCP curated tools at this path until the pilot has a settled receipt
- Replace Crossmint / Privy funding with Nevermined card rails as the only activation path

## Code

- Client: [`api/libs/neverminedPayments.js`](../api/libs/neverminedPayments.js)
- Route: [`api/routes/neverminedNews.js`](../api/routes/neverminedNews.js)
- GTM: [`docs/TRENDING_PARTNER_INTEGRATIONS.md`](./TRENDING_PARTNER_INTEGRATIONS.md)
