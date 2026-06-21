import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Skill Endpoints Earn photo deck — 15 distinct voices. */
export const SKILL_EARN_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra just shipped Skill Endpoints on Earn.

Publish your HTTPS API as a paid x402 route. Agents call it. USDC settles to your earn wallet.

→ syraa.fun/overview/earn`,

  thesis: `Running payment infra for every agent skill is a tax on builders.

Syra is the x402 gateway. You host the logic. We gate access and route payTo to your earn wallet.`,

  quote: `"Build the API. Syra handles discovery and payment."

Creators set price + upstream URL. Agents pay per call. You earn on-chain.`,

  flow: `Publish a skill in four steps:

1. Dashboard → Earn · sign in with wallet
2. Create skill — upstream URL + price
3. Publish — payTo = your earn wallet
4. Share api.syraa.fun/skills/:slug`,

  timeline: `What shipped in Skill Endpoints:

• Earn page: create + manage skills
• /agent/marketplace/skills CRUD + publish
• /skills/:slug x402 dispatcher + proxy
• Dynamic payTo to creator earn wallet
• GET /skills + /.well-known/x402 discovery`,

  pillars: `Four layers. One paid endpoint:

→ Creator CRUD with Syra session
→ x402 gate with per-skill payTo
→ SSRF-safe HTTPS upstream proxy
→ SkillEarning ledger on Earn dashboard`,

  checklist: `Skill Endpoints — live now:

— Publish upstream APIs as Syra x402 routes
— USDC direct to earn pillar wallet
— Agent discovery via /skills catalog
— Copy curl + endpoint URL from Earn UI
— Wallet sign-in to create and publish

Open → syraa.fun/overview/earn`,

  metrics: `100% to creator wallet
1 publish flow
x402 agent-native pay

Monetize skills without building billing.`,

  featured: `payTo = your earn wallet.

Every 402 offer on your skill points at your Syra earn agent address — agents pay you directly on-chain.`,

  comparison: `Before:
Build API + payment stack + discovery docs. Hope agents find you.

Now:
Register upstream URL on Syra Earn. x402 + discovery + payTo wired for you.`,

  launch: `Skill Endpoints are live on Syra Earn.

Create · publish · earn per agent call.

→ syraa.fun/overview/earn`,

  deepDive: `Builder surface:

• POST /agent/marketplace/skills — draft skill
• POST .../skills/:id/publish — set payTo from earn wallet
• GET/POST /skills/:slug — paid proxy (x402)
• GET /skills — public discovery catalog`,

  split: `Two sides of Earn:

Creators publish skill endpoints and collect USDC.

Agents discover paid routes in /.well-known/x402 and call with x402 payment.`,

  terminal: `$ curl api.syraa.fun/skills/my-skill
< 402 Payment Required
> payTo: creator earn wallet · USDC exact
$ retry with PAYMENT-SIGNATURE
< 200 { success: true, data: ... }`,

  cta: `Publish a paid skill endpoint on Syra.

Earn → Create skill. Set price. Agents pay you.

→ syraa.fun/overview/earn
→ api.syraa.fun/skills`,
};
