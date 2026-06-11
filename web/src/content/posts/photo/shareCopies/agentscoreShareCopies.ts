import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for AgentScore photo deck — 15 distinct topics. */
export const AGENTSCORE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Agents need to pay. Regulated merchants need KYC. Syra now does both.

AgentScore is live: merchant gates on high-risk routes, Passport for buyers, and pay tools wired into Syra's x402 stack.

402 for price. Passport for identity. Same agent brain.

Try the tools → syraa.fun/chat`,

  thesis: `Syra sells intelligence over x402. Regulated merchants need KYC before checkout.

The gap wasn't payments — it was identity. AgentScore closes it with merchant gates and buyer Passport tools without replacing Syra's payment middleware.

Agents need to pay AND comply. Now they can — in one stack.

skill.md → api.syraa.fun/skill.md`,

  quote: `"402 for price. Passport for identity. Same Syra agent brain."

Permissionless x402 stays unchanged. Compliance is optional, route-specific, and buyer-side with one Passport.

Sell intelligence. Buy from regulated merchants. One agent loop.

Explore → syraa.fun/chat`,

  flow: `Agent commerce on Syra — how it flows:

1. Anonymous 402: first request returns pricing. Permissionless unchanged.
2. Pay with x402: Payment-Signature verified via facilitator.
3. Gate if required: 403 + verify_url without Passport.
4. Buy merchants: agentscore-pay with operator token from agent wallet.

Sell intelligence with optional compliance. Buy from regulated merchants with one Passport.`,

  timeline: `The AgentScore checkout path — step by step:

→ Hit a gated merchant URL from agent chat
→ Get 402 pricing, pay USDC via x402
→ Gate assesses on paid retry — 403 if Passport missing
→ Verify once at verify_url, save operator token
→ Retry with X-Operator-Token attached → order confirmed

One Passport. Every gated merchant in the network.`,

  pillars: `4 pillars of Syra × AgentScore:

→ Gate: KYC, sanctions, age, jurisdiction on paid retry
→ Passport: verify once, works at every gated merchant
→ Pay tools: discover, check, status, pay from agent chat
→ Policy boost: higher caps for KYC-verified operators

One stack. Two sides of agent payments.`,

  checklist: `What's new in Syra × AgentScore:

→ AgentScore Gate on 8004 registration + Tempo payouts
→ agentscore-discover, check, passport-status, pay
→ Public /agentscore routes, MCP, and skill.md
→ Policy engine boost for verified operators

Identity + payments + intelligence. Finally in one loop.`,

  metrics: `4 new agent tools. 2 gated routes. 1 Passport for every merchant.

AgentScore integration means Syra agents can discover gated merchants, verify identity once, and checkout with USDC — while Syra itself can gate sensitive routes when regulation matters.

Explore → syraa.fun/chat`,

  featured: `1 Passport. Every gated merchant.

Verify identity once with AgentScore Passport. Works at Martin Estate, Sayer & Stone, and every merchant in the AgentScore network.

No re-KYC per checkout. No bridge between intelligence APIs and regulated commerce.

The buyer side of agent payments just got real.`,

  comparison: `Before AgentScore on Syra:
No KYC gates. Agents couldn't checkout at AgentScore-gated merchants.

Now:
Optional Gate on sensitive routes. Passport + pay tools for compliant agent commerce.

The gap between "pay for intelligence" and "buy from regulated merchants" just closed.

402 for price. Passport for identity.`,

  launch: `MAJOR SHIP · AgentScore is live on Syra.

Syra is now both an x402 merchant with optional compliance gates and an x402 buyer that can reach AgentScore-gated merchants.

Merchant side: Gate on high-risk routes.
Buyer side: Passport + pay tools from agent chat.

Try it → syraa.fun/chat`,

  deepDive: `AgentScore on Syra — technical surface:

→ agentscore-discover through agentscore-pay agent tools
→ Public GET /agentscore/discover and /check
→ Gate on 8004 register-agent and Tempo payouts
→ MCP syra_agentscore_* tools for external agents

Built for agents. API-first. Wired into skill.md.

api.syraa.fun/skill.md`,

  split: `Two sides of agent commerce on Syra:

MERCHANT SIDE
Optional Gate on sensitive routes. KYC, sanctions, age, jurisdiction on paid retry.

BUYER SIDE
Discover gated merchants. Verify once with Passport. Pay with agentscore-pay from agent wallet.

Sell intelligence with optional compliance. Buy from regulated merchants with one Passport.`,

  terminal: `AgentScore checkout from the terminal:

$ curl api.syraa.fun/agentscore/discover
< merchants: Martin Estate, Sayer & Stone, …
$ agentscore-pay passport login
> verify_url opened · KYC complete · opc_… saved
$ syra agent tools call agentscore-pay --url https://agents.martinestate.com/purchase
> 402 → pay USDC → X-Operator-Token attached
< HTTP/200 · order confirmed

Build on Syra. Ship compliant agent commerce.`,

  cta: `Agent commerce is here. Build with compliance built in.

→ Agent chat: syraa.fun/chat
→ skill.md: api.syraa.fun/skill.md
→ AgentScore docs: docs.agentscore.sh

Verify once with Passport. Pay per call. Gate when it matters.`,
};
