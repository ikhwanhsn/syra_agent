import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Skill Endpoints Earn photo deck - 15 distinct voices. */
export const SKILL_EARN_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces Skill Endpoints, a way for anyone to publish a paid API on Syra's Earn page.

The badge marks it as Earn, x402, and a creator rail. A creator wires up their own HTTPS API, and agents pay USDC per call, with the money routed straight to the creator's earn wallet.

syraa.fun/overview/earn`,

  thesis: `This card names the problem Skill Endpoints solves: creators should not have to build their own billing system just to charge for an API.

Syra already gates intelligence behind x402. Now a builder registers an upstream URL, sets a price, and gets a discoverable route at /skills/:slug, with payTo pointed at their own earn wallet.

syraa.fun/overview/earn`,

  quote: `The line on this card splits the work cleanly: build the API, and Syra handles getting paid.

The creator hosts the logic on their own HTTPS endpoint. Syra proxies the paid calls, lists the skill for agents to discover, and routes the USDC straight to the creator's earn wallet.

syraa.fun/overview/earn`,

  flow: `This image walks a creator from idea to paid endpoint in four steps.

1. Open the Earn dashboard and sign in with a wallet
2. Create a skill with an upstream HTTPS URL, a price, and an optional auth header
3. Publish it, which makes the earn wallet the x402 payTo and puts the slug live
4. Get paid as agents call it, with earnings tracked on the Earn page

syraa.fun/overview/earn`,

  timeline: `This timeline covers the full earn rail, shipped in one pass.

1. Earn UI built, with a create-skill form and skill cards on /overview/earn
2. Marketplace API added, with session-gated CRUD at /agent/marketplace/skills
3. Dispatcher built, proxying paid calls at /skills/:slug with a dynamic payTo
4. Discovery wired up, through GET /skills and entries in /.well-known/x402

syraa.fun/overview/earn`,

  pillars: `This bento layout shows the four pieces behind one published skill.

The payTo field points every 402 offer at the creator's earn wallet, so USDC lands there directly. The proxy calls the creator's own HTTPS upstream after verifying payment, with SSRF protections in place. CRUD covers drafting and publishing under a Syra session. The index makes the skill discoverable in a public catalog for x402 callers.

syraa.fun/overview/earn`,

  checklist: `This checklist is what Skill Endpoints shipped with.

1. Anyone can publish an upstream API as a Syra x402 route
2. USDC settles directly to the creator's earn pillar wallet
3. Agents can discover published skills through the /skills catalog
4. The Earn UI provides a ready-to-copy endpoint URL and curl command

api.syraa.fun/skills`,

  metrics: `The numbers on this card make the economics plain.

100% of the payment goes to the creator's earn wallet. There is one publish flow to get there, and x402 is the pay rail agents use to call it.

syraa.fun/overview/earn`,

  featured: `This featured card is about where the money actually goes.

Every skill's 402 offer points directly at the creator's earn agent wallet on Solana, so payment never passes through an intermediate account.

syraa.fun/overview/earn`,

  comparison: `This before-and-after card compares building a paid API from scratch with publishing one on Syra.

Before, a creator had to build the API, the billing, and the discovery docs, then hope agents found their pay flow. Now they register a URL on Syra Earn, and x402, discovery, and payTo are already wired, ready to share as /skills/:slug.

syraa.fun/overview/earn`,

  launch: `This announcement card marks Skill Endpoints as live on Syra Earn.

Publish a paid API, and agents discover and pay for it through x402, with USDC settling straight to your earn wallet.

syraa.fun/overview/earn`,

  deepDive: `This deep-dive card lists the Skill Endpoints API for builders.

POST /agent/marketplace/skills creates a draft skill. POST to .../skills/:id/publish sets the earn wallet as payTo and takes it live. GET and POST on /skills/:slug run the x402 gate and the upstream proxy. GET /skills returns the public discovery catalog of published skills.

api.syraa.fun/skills`,

  split: `This split card shows the two sides of the same feature.

Creators publish skill endpoints on the Earn page and collect USDC as agents call them. Agents discover those paid routes through /.well-known/x402 and call them with an x402 payment. It is one dashboard, with machine money moving in both directions.

api.syraa.fun/.well-known/x402`,

  terminal: `This terminal card shows a real call against a published skill.

Calling /skills/token-sentiment returns 402, with payTo set to the creator's earn wallet in USDC. Retrying with a PAYMENT-SIGNATURE header returns 200, with the actual data in the response.

api.syraa.fun/skills`,

  cta: `This closing card is the invitation: publish your first skill today.

Go to Earn, create a skill, set a price, and share the endpoint with agents.

syraa.fun/overview/earn
api.syraa.fun/skills
api.syraa.fun/.well-known/x402`,
};
