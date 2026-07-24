import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Ampersend marketplace photo deck - 15 distinct topics. */
export const AMPERSEND_MARKETPLACE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces that Syra's paid APIs are now discoverable on the Ampersend agent marketplace.

The badge marks Bazaar, Base, and 26 APIs. Checkout runs on Base mainnet, and any agent wallet on Ampersend can browse the catalog and pay per call.

app.ampersend.ai/discover`,

  thesis: `This card names the gap Ampersend closes: agents need a directory, not a hidden URL passed around in chat.

Ampersend's marketplace lists x402-payable services for autonomous agent wallets. Syra now ships Bazaar discovery metadata on its 402 responses and PayAI settlements, so 26 paid APIs index for agents on Base.

syraa.fun/playground`,

  quote: `The line on this card describes the whole mechanism: list on Bazaar, and you show up on Ampersend.

There is no manual submit form. The first Base settlement on an endpoint triggers the indexing, and Ampersend pulls that listing into app.ampersend.ai/discover automatically.

app.ampersend.ai/discover`,

  flow: `This image walks the path from payment to marketplace listing in four steps.

1. A paid route returns 402 with Bazaar discovery metadata attached
2. An agent wallet pays USDC on Base
3. PayAI's facilitator registers the endpoint in the x402 Bazaar
4. The listing appears on Ampersend, sourced from that bazaar entry

app.ampersend.ai/discover`,

  timeline: `This timeline covers the work behind marketplace visibility.

1. PayAI settlement payloads now carry a Bazaar discovery blob, not just the older B402 format
2. Catalog metadata added: category, tags, and a description for each endpoint
3. Base mainnet set as the network Ampersend's production filter checks for
4. A validate-ampersend script added to confirm readiness before launch

syraa.fun/playground`,

  pillars: `This bento layout shows the four layers behind one agent-facing listing.

The 402 response carries Bazaar extensions as discovery metadata. PayAI's settle step is where the facilitator actually indexes the endpoint after a Base payment. Base itself, eip155:8453, is the network Ampersend's production filter looks for. The catalog behind all of it lists all 26 endpoints in /.well-known/x402.

app.ampersend.ai/discover`,

  checklist: `This checklist is what shipped for Ampersend readiness.

1. Bazaar extensions now appear on every paid 402 response
2. PayAI settlement indexing is wired for Base mainnet
3. Each endpoint carries its own category and tags from the catalog
4. A validate-ampersend script checks readiness end to end
5. 26 endpoints are listed in /.well-known/x402

syraa.fun/playground`,

  metrics: `The numbers on this card confirm the marketplace is ready.

26 x402 resources are listed, Base is set as the Ampersend network, and checkout stays HTTP-native through 402. Production checks confirm the Base accept on /health, a full discovery manifest, and Bazaar enabled on PayAI settles.

app.ampersend.ai/discover`,

  featured: `This featured card is the readiness check on api.syraa.fun itself.

GET /health advertises the Base mainnet accept, and /.well-known/x402 lists all 26 paid endpoints. Bazaar discovery is enabled and ready for Ampersend to ingest after the first Base settlement.

syraa.fun/playground`,

  comparison: `This before-and-after card compares a hidden endpoint with a listed marketplace entry.

Before, agents needed a Syra URL handed to them directly, with no Ampersend listing and no automatic discovery. Now, Bazaar indexes the endpoint on the first Base settlement, and Ampersend's marketplace lists it straight from that bazaar source.

app.ampersend.ai/discover`,

  launch: `This partnership card marks Syra and Ampersend as live together.

26 paid x402 APIs are discoverable for agent wallets, with checkout on Base and no API keys required.

app.ampersend.ai/discover`,

  deepDive: `This deep-dive card lists the plumbing behind Bazaar discovery.

x402Bazaar.js holds the X402_BAZAAR_ENABLED toggle. x402PaymentV2.js attaches Bazaar data to both the 402 response and the PayAI settle payload. x402ResourceCatalog.js assigns a category to each endpoint. validateAmpersendDiscovery.js runs the readiness checks, and syraBranding.js supplies the service name, tags, and icon used in listings.

docs.ampersend.ai/platform/marketplace`,

  split: `This split card explains why Base gets the marketplace focus while Solana stays the default checkout.

Agents can pay on Solana, PayAI's EVM chains, BSC, or Algorand depending on where their treasury sits. Ampersend's production marketplace filters specifically to Base, so that is the network Syra indexes Bazaar listings on first.

app.ampersend.ai/discover`,

  terminal: `This terminal card shows the readiness script running for real.

Running validate-ampersend confirms Bazaar discovery is enabled, GET /health advertises Base at eip155:8453, and /.well-known/x402 lists all 26 resources. Running it again with the pay flag completes a paid Base transaction and triggers the Bazaar index.

syraa.fun/playground`,

  cta: `This closing card is the summary: discover Syra on Ampersend.

Browse the marketplace, pay on Base, and unlock intelligence per call.

app.ampersend.ai/discover
syraa.fun/playground
docs.ampersend.ai/platform/marketplace`,
};
