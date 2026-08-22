import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Nevermined x402 pilot photo deck. */
export const NEVERMINED_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Nevermined agents can pay Syra for crypto news over x402.

Syra ships a parallel pilot route at /partners/nevermined/news. Exact /news on USDC is unchanged.

api.syraa.fun/partners/nevermined/news`,

  thesis: `Some agents fund with Nevermined credits or card mandates before they hold Solana USDC.

Syra added a feature-flagged merchant path so those agents can buy the same news JSON without touching Exact /news.

api.syraa.fun/partners/nevermined/news`,

  quote: `Parallel merchant. Same intel. Two settle rails.

Nevermined credits on /partners/nevermined/news. USDC on /news. Syra stays merchant on both.

api.syraa.fun/partners/nevermined/news`,

  flow: `From NVM plan to first paid news call.

1. Set NEVERMINED_X402_ENABLED and NVM_API_KEY on the API host
2. Obtain a Nevermined x402 access token for the plan
3. GET /partners/nevermined/news?ticker=BTC with payment-signature
4. Read news JSON and payment-response after HTTP 200

api.syraa.fun/partners/nevermined/news`,

  timeline: `What shipped for the Nevermined pilot.

1. @nevermined-io/payments middleware on the API
2. GET /partners/nevermined/news route
3. NEVERMINED_X402_QUICKSTART.md env and curl docs
4. Exact Dexter → GoPlausible → PayAI path left untouched

api.syraa.fun/partners/nevermined/news`,

  pillars: `Two merchant paths. One news layer.

Exact /news settles USDC via Syra facilitators. The Nevermined pilot burns credits via NVM middleware. Nevermined is not added to Exact failover.

api.syraa.fun/partners/nevermined/news`,

  checklist: `Prove the pilot in four steps.

1. Create a Nevermined sandbox plan
2. Set NVM_API_KEY and NVM_PLAN_ID on api.syraa.fun
3. Flip NEVERMINED_X402_ENABLED=true
4. Call /partners/nevermined/news with payment-signature

api.syraa.fun/partners/nevermined/news`,

  metrics: `Exact rails keep shipping while NVM pilots.

42,901 paid calls settled on Syra in the last 7 days on USDC paths. This pilot adds credits without moving that stack.

https://www.syraa.fun`,

  featured: `Pilot lives at /partners/nevermined/news.

Same ticker and news payload as /news. Feature-flagged 503 when NVM env is missing.

api.syraa.fun/partners/nevermined/news`,

  comparison: `Before vs now for Nevermined agents.

Before: only Exact USDC /news. Now: parallel NVM credits route with the same intel JSON.

api.syraa.fun/partners/nevermined/news`,

  launch: `Nevermined x402 pilot on Syra is live in code.

Enable NVM env on the API host. Agents with credits can call /partners/nevermined/news today.

api.syraa.fun/partners/nevermined/news`,

  deepDive: `Boundaries for this pilot.

Nevermined is not PayAI or Dexter failover. MCP curated tools still point at Exact /news until a NVM receipt is proven. Crossmint onramp stays the human funding path.

api.syraa.fun/partners/nevermined/news`,

  split: `Credits on NVM. USDC on Exact.

Agents pick the rail their wallet supports. Syra delivers the same crypto news either way.

api.syraa.fun/partners/nevermined/news`,

  terminal: `Happy path for a Nevermined client.

$ export NVM_API_KEY=sandbox:...
$ TOKEN=$(nvm x402 token --plan $NVM_PLAN_ID)
$ curl -H "payment-signature: $TOKEN" \\
  "https://api.syraa.fun/partners/nevermined/news?ticker=BTC"
< HTTP/200 · news JSON

api.syraa.fun/partners/nevermined/news`,

  cta: `Enable NVM env. Settle one pilot call.

Quickstart covers sandbox hosts and required secrets. Marketplace lists Exact Spend routes after USDC funding.

https://www.syraa.fun/marketplace`,
};
