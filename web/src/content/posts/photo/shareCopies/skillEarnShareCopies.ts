import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Skill Endpoints Earn photo deck. Proof-first, no meta card talk. */
export const SKILL_EARN_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Skill Endpoints let anyone publish a paid API on Syra Earn.

Wire up your own HTTPS API. Agents pay USDC (digital dollars) per call with x402 (pay only when they call). Payout goes to your earn wallet, the account that holds that crypto.

syraa.fun/overview/earn`,

  thesis: `Creators should not have to build billing just to charge for an API.

Syra already gates intelligence behind x402. Now a builder registers an upstream URL, sets a price, and gets a discoverable route at /skills/:slug. payTo is the earn wallet.

syraa.fun/overview/earn`,

  quote: `Build the API, and Syra handles getting paid.

Host the logic on your own HTTPS endpoint. Syra proxies the paid calls, lists the skill for agents, and routes USDC to your earn wallet.

syraa.fun/overview/earn`,

  flow: `Idea to paid endpoint in four steps.

1. Open the Earn dashboard and sign in with a wallet
2. Create a skill with an upstream HTTPS URL, a price, and an optional auth header
3. Publish it. The earn wallet becomes the x402 payTo and the slug goes live
4. Get paid as agents call it, with earnings tracked on the Earn page

syraa.fun/overview/earn`,

  timeline: `The full earn rail shipped in one pass.

1. Earn UI: a create-skill form and skill cards on /overview/earn
2. Marketplace API: session-gated CRUD at /agent/marketplace/skills
3. Dispatcher: a paid /skills/:slug proxy with dynamic payTo
4. Discovery: GET /skills plus entries in /.well-known/x402

syraa.fun/overview/earn`,

  pillars: `Four pieces sit behind one published skill.

payTo points every 402 offer at the creator's earn wallet, so USDC lands there directly. The proxy calls the creator's HTTPS upstream after payment is verified, with SSRF protections. CRUD covers draft to publish under a Syra session. The index is a public catalog for x402 callers.

syraa.fun/overview/earn`,

  checklist: `Skill Endpoints are live now.

1. Anyone can publish an upstream API as a Syra x402 route
2. USDC settles directly to the creator's earn pillar wallet
3. Agents discover published skills through the /skills catalog
4. The Earn UI provides a ready-to-copy endpoint URL and curl command

api.syraa.fun/skills`,

  metrics: `The economics are creator-native.

100% of the payment goes to the earn wallet. There is one publish flow. x402 is the pay rail agents use to call it.

Host the logic anywhere. Syra gates access and addresses payment.

syraa.fun/overview/earn`,

  featured: `Each skill pays the creator's earn wallet directly.

Every 402 offer points at that earn agent wallet on Solana. Payment does not pass through an intermediate account.

syraa.fun/overview/earn`,

  comparison: `A paid API used to mean building billing and discovery yourself.

Before, you built the API, the billing, and the docs, then hoped agents found your pay flow. Now you register a URL on Syra Earn. x402, discovery, and payTo are already wired. Share /skills/:slug.

syraa.fun/overview/earn`,

  launch: `Skill Endpoints are live on Syra Earn.

Publish a paid API. Agents discover it and pay through x402. USDC settles straight to your earn wallet.

syraa.fun/overview/earn`,

  deepDive: `Builders get a Skill API.

POST /agent/marketplace/skills creates a draft. POST to .../skills/:id/publish sets the earn wallet as payTo and takes it live. GET and POST on /skills/:slug run the x402 gate and the upstream proxy. GET /skills returns the public catalog of published skills.

api.syraa.fun/skills`,

  split: `Creators publish skill endpoints. Agents pay per call.

Earn now includes skill endpoints alongside earnings attribution. Create a skill on /overview/earn. Manage the earn wallet at /wallet?wallet=earn. Agents discover paid routes through /.well-known/x402 and call with an x402 payment. Per-call USDC goes to the creator payTo.

api.syraa.fun/.well-known/x402`,

  terminal: `A published skill looks like any other x402 route.

Calling /skills/token-sentiment returns 402, with payTo set to the creator's earn wallet in USDC. Retry with a PAYMENT-SIGNATURE header and you get 200, with the actual data in the response.

api.syraa.fun/skills`,

  cta: `Publish your first skill today.

Go to Earn, create a skill, set a price, and share the endpoint with agents.

syraa.fun/overview/earn
api.syraa.fun/skills
api.syraa.fun/.well-known/x402`,
};
