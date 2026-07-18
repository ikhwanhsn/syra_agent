import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for AgentScore photo deck: 15 distinct topics. */
export const AGENTSCORE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Agents need to pay. Regulated merchants need KYC. One stack now does both.

AgentScore on Syra: merchant gates on high-risk routes, Passport for buyers, pay tools wired into x402.

402 for price. Passport for identity. Same agent brain.

Try it → syraa.fun/chat`,

  thesis: `The gap wasn't payments. It was identity.

Syra sells intelligence over x402. Regulated merchants need KYC before checkout. AgentScore adds merchant gates and buyer Passport without replacing payment middleware.

Agents can pay AND comply. In one loop.

skill.md → api.syraa.fun/skill.md`,

  quote: `"402 for price. Passport for identity. Same Syra agent brain."

Permissionless x402 stays unchanged. Compliance is optional, route-specific, and buyer-side with one Passport.

Sell intelligence. Buy from regulated merchants. One agent loop.`,

  flow: `Agent commerce on Syra. 4 steps:

1. Anonymous 402: first request returns pricing. Permissionless unchanged.
2. Pay with x402: Payment-Signature verified via facilitator.
3. Gate if required: 403 + verify_url without Passport.
4. Buy merchants: agentscore-pay with operator token from agent wallet.

Compliance when it matters. Permissionless when it doesn't.`,

  timeline: `AgentScore checkout. Verify once, buy everywhere:

→ Discover gated merchants from agent chat
→ Get 402 pricing, pay USDC via x402
→ Gate assesses on paid retry. 403 if Passport missing
→ Verify once at verify_url, save operator token
→ Retry with X-Operator-Token → order confirmed

One Passport. Every gated merchant.`,

  pillars: `4 pillars of agent commerce on Syra:

→ Gate: KYC, sanctions, age, jurisdiction on paid retry
→ Passport: verify once, works at every gated merchant
→ Pay tools: discover, check, status, pay from agent chat
→ Policy boost: higher caps for KYC-verified operators

Sell intelligence. Buy from regulated merchants.`,

  checklist: `What's live in Syra × AgentScore:

→ AgentScore Gate on 8004 registration + Tempo payouts
→ agentscore-discover, check, passport-status, pay
→ Public /agentscore routes, MCP, and skill.md
→ Policy engine boost for verified operators

Build with it → syraa.fun/chat`,

  metrics: `4 agent tools. 2 gated routes. 1 Passport for every merchant.

Discover gated merchants, verify identity once, checkout with USDC, while Syra gates sensitive routes when regulation matters.

Identity + payments + intelligence. One loop.

→ syraa.fun/chat`,

  featured: `1 Passport. Every gated merchant. No re-KYC.

Verify identity once with AgentScore Passport. Works at Martin Estate, Sayer & Stone, and the full AgentScore network.

The buyer side of agent payments just got real.`,

  comparison: `Before: no KYC gates. Agents couldn't checkout at AgentScore-gated merchants.

Now: optional Gate on sensitive routes. Passport + pay tools for compliant agent commerce.

The gap between "pay for intelligence" and "buy from regulated merchants" just closed.

→ syraa.fun/chat`,

  launch: `SHIP LOG · AgentScore is live on Syra.

Syra is now an x402 merchant with optional compliance gates AND an x402 buyer for AgentScore-gated merchants.

Merchant side: Gate on high-risk routes.
Buyer side: Passport + pay tools from agent chat.

Try it → syraa.fun/chat`,

  deepDive: `AgentScore on Syra. API-first:

→ agentscore-discover through agentscore-pay agent tools
→ Public GET /agentscore/discover and /check
→ Gate on 8004 register-agent and Tempo payouts
→ MCP syra_agentscore_* tools for external agents

Wired into skill.md → api.syraa.fun/skill.md`,

  split: `Two sides. One agent loop.

MERCHANT SIDE
Optional Gate on sensitive routes. KYC, sanctions, age, jurisdiction on paid retry.

BUYER SIDE
Discover gated merchants. Verify once with Passport. Pay with agentscore-pay.

Sell intelligence with optional compliance. Buy from regulated merchants.`,

  terminal: `AgentScore checkout from the terminal:

$ curl api.syraa.fun/agentscore/discover
< merchants: Martin Estate, Sayer & Stone, …
$ agentscore-pay passport login
> verify_url opened · KYC complete · opc_… saved
$ syra agent tools call agentscore-pay --url https://agents.martinestate.com/purchase
> 402 → pay USDC → X-Operator-Token attached
< HTTP/200 · order confirmed

Ship compliant agent commerce → syraa.fun/chat`,

  cta: `Agent commerce is here. Compliance built in.

→ Agent chat: syraa.fun/chat
→ skill.md: api.syraa.fun/skill.md
→ AgentScore docs: docs.agentscore.sh

Verify once with Passport. Pay per call. Gate when it matters.`,
};
