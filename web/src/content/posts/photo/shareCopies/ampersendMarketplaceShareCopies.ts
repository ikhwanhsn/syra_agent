import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Ampersend marketplace photo deck — 15 distinct topics. */
export const AMPERSEND_MARKETPLACE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra x402 APIs are on the Ampersend marketplace.

Bazaar discovery is live on Base mainnet. 26 paid endpoints. Agent-readable metadata. No API keys — pay per call from an Ampersend wallet.

Discover → app.ampersend.ai/discover`,

  thesis: `Agents should not hunt for API URLs in Discord threads.

Ampersend marketplace lists x402-payable services. Syra now ships Bazaar metadata on every 402 response and PayAI settle — so our intelligence APIs index for agent wallets on Base.`,

  quote: `"List once on x402 Bazaar. Agents find you on Ampersend."

26 Syra endpoints. Base mainnet checkout. PayAI verify + settle. Catalog-backed categories and tags.`,

  flow: `How Syra lands on Ampersend — 4 steps:

1. Paid API returns 402 with Bazaar extensions
2. Agent pays USDC on Base (eip155:8453)
3. PayAI facilitator indexes the endpoint in Bazaar
4. Listing appears on app.ampersend.ai/discover

No manual submit form.`,

  timeline: `Ampersend marketplace rollout:

→ X402_BAZAAR_ENABLED on 402 + PayAI settle payloads
→ Per-endpoint category/tags from x402ResourceCatalog
→ Base mainnet payTo for Ampersend production filter
→ npm run validate-ampersend readiness script
→ First Base settlement triggers Bazaar indexing`,

  pillars: `4 layers. One marketplace listing:

402 — Bazaar extensions on Payment Required
SETTLE — PayAI payload carries discovery blob
BASE — eip155:8453 for Ampersend production
CATALOG — 26 endpoints in /.well-known/x402`,

  checklist: `Live for Ampersend agents:

→ Bazaar metadata on every paid Syra 402
→ PayAI settle indexing (not just BSC B402)
→ Base USDC accept on GET /health and all paid routes
→ validate-ampersend npm script
→ 26 resources at api.syraa.fun/.well-known/x402`,

  metrics: `Ampersend readiness by the numbers:

26 — x402 discovery resources
Base — Ampersend production network
402 — HTTP-native agent checkout

Pay once. Index in Bazaar. Show up on Ampersend.`,

  featured: `Production check passed on api.syraa.fun.

GET /health returns 402 with Base mainnet accept. /.well-known/x402 lists 26 paid endpoints. Bazaar discovery enabled. Ready for Ampersend ingestion after first Base settlement.`,

  comparison: `Before: agents needed Syra URLs upfront. No Ampersend visibility.

Now: Bazaar indexes on Base settle. Ampersend marketplace pulls source bazaar. Agents browse, pay, call — no API keys, no contracts.

Discovery is the product.`,

  launch: `SHIP LOG · Syra is on the Ampersend marketplace path.

Bazaar discovery wired for Base mainnet. 26 paid intelligence APIs. Agent wallets can browse and pay at app.ampersend.ai/discover.

Try → syraa.fun/playground`,

  deepDive: `Under the hood:

x402Bazaar.js — global Bazaar toggle
x402PaymentV2.js — extensions on 402 + PayAI settle
x402ResourceCatalog.js — per-endpoint category + description
validateAmpersendDiscovery.js — production readiness checks
syraBranding.js — serviceName, tags, icon for listings`,

  split: `Two rails. One directory.

SOLANA — agent wallet auto-pay, playground, external agents
BASE — Ampersend marketplace production filter (eip155:8453)

Same Syra brain. Pay where the agent treasury lives.`,

  terminal: `Ampersend readiness in the wild:

$ npm run validate-ampersend
[OK] Base payTo configured
[OK] GET /health advertises Base mainnet
[OK] /.well-known/x402 lists 26 resources

$ npm run validate-ampersend -- --pay
[OK] Paid Base E2E — Bazaar indexing triggered`,

  cta: `Discover Syra on Ampersend.

Browse the marketplace. Pay on Base. Unlock intelligence per call.

app.ampersend.ai/discover · syraa.fun/playground`,
};
