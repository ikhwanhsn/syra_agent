import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Dexter onchain x402 photo deck. */
export const DEXTER_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces Dexter going beyond Labs settlement on Syra.

Dexter already settles Labs facilitator payments. Agents can now call the Dexter onchain activity and entity APIs directly over Solana x402, paying per call for trade summaries and wallet or token intelligence.

syraa.fun/chat`,

  thesis: `This card names the gap Dexter closes for Syra agents.

Syra already settles Labs through Dexter. Settlement alone was only half the stack, so agents now buy onchain activity and entity summaries from x402.dexter.cash, paying with Solana USDC per request.

syraa.fun/chat`,

  quote: `The line on this card sums up Dexter's two jobs on Syra.

Labs pays for the settle. Agents pay for the signal. Same partner, two separate surfaces: one is the Labs facilitator, the other is a paid tool an agent calls when it needs onchain context.

syraa.fun/chat`,

  flow: `This image walks the Dexter call path in four steps.

1. Pick a tool: the free catalog, or the paid activity and entity endpoints
2. Probe x402.dexter.cash and get a Payment Required response
3. Agent pays with Solana USDC from the Syra wallet
4. Onchain payload returns: volumes, counterparties, and deltas

syraa.fun/chat`,

  timeline: `This timeline shows Dexter's move from settlement partner to spend-tool partner.

1. Labs facilitator settle path, already live
2. agentDexterClient plus an external x402 helper added
3. dexter-x402-catalog shipped as a free discovery endpoint
4. Paid activity and entity tools added at roughly $0.05 per call

syraa.fun/chat`,

  pillars: `This bento layout shows the two layers Dexter now covers.

Facilitator keeps the existing Labs settle rails unchanged. Activity sells trade summaries and counterparties. Entity sells token, wallet, and trade insight. Catalog is the free well-known endpoint that lists what is available before an agent pays for anything.

syraa.fun/chat`,

  checklist: `This checklist is what shipped with the Dexter onchain integration.

1. dexter-x402-catalog free discovery
2. Paid activity and entity agent tools
3. Agent wallet Solana USDC checkout
4. Labs facilitator path unchanged
5. Partner page at syraa.fun/partner/dexter

syraa.fun/partner/dexter`,

  metrics: `The numbers on this card describe the new Dexter agent stack.

Three tools sit behind the integration: the free catalog plus paid activity and entity endpoints, priced around $0.05 per onchain call. Checkout runs on Solana through the same 402 flow Labs already uses.

syraa.fun/chat`,

  featured: `This featured card highlights x402.dexter.cash living inside Syra agents.

Browsing the catalog costs nothing. Paying only kicks in when an agent asks for activity or entity data, the kind of tape a trader would otherwise pull manually from a block explorer.

syraa.fun/partner/dexter`,

  comparison: `This before-and-after card compares Dexter's role before and after this update.

Before, Dexter on Syra meant Labs facilitator settlement only, with no way for an agent to buy onchain context. Now the facilitator is unchanged and agents can also pay for activity and entity data, Solana context bought per call instead of scraped by hand.

syraa.fun/chat`,

  launch: `This partnership card marks Syra x Dexter as live for onchain x402 tools.

Facilitator settlement keeps running as before. Paid activity and entity intelligence for agents is the new surface, both settled with Solana USDC through the same partner.

syraa.fun/partner/dexter`,

  deepDive: `This deep-dive card lists the technical surface behind the Dexter integration.

The base is x402.dexter.cash. /.well-known/x402 is the free catalog. /onchain/activity and /onchain/entity are paid. callExternalX402WithAgent handles the settle path, and Dexter posts as dexteraisol on X.

dexter.cash`,

  split: `This split card explains Dexter's two jobs on Syra.

Labs keeps the facilitator settle rails it already had. Agents get a second surface: paid activity and entity tools plus the free catalog for discovery, all settled in Solana USDC.

syraa.fun/chat`,

  terminal: `This terminal card shows an agent calling Dexter directly.

Calling dexter-x402-catalog returns the available resources, including activity and entity. Calling dexter-onchain-activity with a token mint triggers a 402, the agent pays in Solana USDC, and the trade summary unlocks.

syraa.fun/chat`,

  cta: `This closing card is the ship summary: call Dexter from a Syra agent for onchain intelligence, not just settlement.

Start with the free catalog, then pay for activity or entity on a specific mint or wallet.

syraa.fun/chat
syraa.fun/partner/dexter
dexter.cash`,
};
