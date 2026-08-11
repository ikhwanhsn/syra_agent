import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Ampersend marketplace photo deck - 15 distinct topics. */
export const AMPERSEND_MARKETPLACE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra x Ampersend: paid intelligence APIs are discoverable on the agent marketplace.

26 APIs. Base mainnet checkout. Pay per call with x402 (you pay only when you call). No API keys.

app.ampersend.ai/discover`,

  thesis: `Agents need directories, not hidden URLs.

Ampersend marketplace lists x402-payable services for autonomous agent wallets. Syra now ships Bazaar discovery on 402 and PayAI settle (the payment actually completes) so 26 paid APIs index for agents on Base.

syraa.fun/playground`,

  quote: `List on Bazaar and you show up on Ampersend.

No manual submit form. The first Base settlement indexes the endpoint. Ampersend pulls source bazaar into app.ampersend.ai/discover.

app.ampersend.ai/discover`,

  flow: `402, Base, Bazaar, Ampersend.

1. Paid route returns Payment Required with discovery metadata
2. Agent wallet settles USDC (digital dollars) on Base (eip155:8453)
3. PayAI facilitator registers the endpoint in x402 Bazaar
4. Listing appears on Ampersend with source bazaar

app.ampersend.ai/discover`,

  timeline: `From code to marketplace visibility.

1. PayAI payloads carry a discovery blob, not just B402
2. Catalog metadata: category, tags, descriptions per endpoint
3. Base mainnet, because Ampersend production filters to eip155:8453
4. npm run validate-ampersend checks readiness

syraa.fun/playground`,

  pillars: `Four layers behind one agent directory.

402 carries Bazaar discovery metadata on Payment Required. PayAI settle is when the facilitator indexes after a Base payment. Base 8453 is Ampersend's production network filter. Catalog lists 26 APIs in /.well-known/x402.

app.ampersend.ai/discover`,

  checklist: `What ships with this update.

1. Bazaar extensions on every paid 402 response
2. PayAI settle indexing for Base mainnet
3. Per-endpoint category plus tags from the catalog
4. npm run validate-ampersend readiness script
5. 26 endpoints in /.well-known/x402

syraa.fun/playground`,

  metrics: `Marketplace-ready.

26 x402 resources. Base is the Ampersend network. 402 agent checkout.

Production validated: Base accept on /health, full discovery manifest, Bazaar enabled for PayAI settles.

app.ampersend.ai/discover`,

  featured: `api.syraa.fun checks out.

26 discovery resources. GET /health advertises Base mainnet. Payment-Required header on 402. Ready for Ampersend Bazaar ingestion.

syraa.fun/playground`,

  comparison: `Hidden URL vs agent marketplace.

Before, agents needed Syra URLs upfront. No Ampersend listing. Discovery was manual. Now Bazaar indexes on Base settle, and Ampersend lists source bazaar so agents can browse and pay.

app.ampersend.ai/discover`,

  launch: `Syra x Ampersend is live.

26 paid x402 APIs are discoverable for agent wallets, with checkout on Base and no API keys.

app.ampersend.ai/discover`,

  deepDive: `Bazaar discovery plumbing.

x402Bazaar.js holds the X402_BAZAAR_ENABLED toggle. x402PaymentV2.js attaches Bazaar on 402 and PayAI settle. x402ResourceCatalog.js assigns category per endpoint. validateAmpersendDiscovery.js runs readiness checks. syraBranding.js supplies serviceName, tags, and iconUrl.

docs.ampersend.ai/platform/marketplace`,

  split: `Solana stays default checkout. Base is for Ampersend.

Agents can pay on Solana, PayAI EVM, BSC, or Algorand. Ampersend production marketplace filters to Base, so we index Bazaar there first. Solana is agent wallet auto-pay. Base is the marketplace rail. BSC is B402 Bazaar in parallel. Algorand is GoPlausible USDC ASA.

app.ampersend.ai/discover`,

  terminal: `Validate Ampersend readiness.

npm run validate-ampersend confirms Bazaar discovery enabled, GET /health with Base eip155:8453, and /.well-known/x402 with 26 resources. npm run validate-ampersend -- --pay completes a paid Base E2E and triggers Bazaar index.

syraa.fun/playground`,

  cta: `Discover Syra on Ampersend.

Browse the marketplace, pay on Base, and unlock intelligence per call.

app.ampersend.ai/discover
syraa.fun/playground
docs.ampersend.ai/platform/marketplace`,
};
