import type { PostPhotoLayoutTemplate } from "../layouts";

/** Per-template X copy for AgentScore photo picks — tuned to each card's visual story. */
export const AGENTSCORE_PHOTO_SHARE_COPIES: Partial<Record<PostPhotoLayoutTemplate, string>> = {
  "photo-cover-spotlight": `Agents need to pay. Regulated merchants need KYC. Syra now does both.

AgentScore is live: merchant gates on high-risk routes, Passport for buyers, and pay tools wired into Syra's x402 stack.

402 for price. Passport for identity. Same agent brain.

Try the tools → syraa.fun/chat`,

  "photo-flow-pipeline": `Agent commerce on Syra — how it flows:

1. Anonymous 402: first request returns pricing. Permissionless unchanged.
2. Pay with x402: Payment-Signature verified via facilitator.
3. Gate if required: 403 + verify_url without Passport.
4. Buy merchants: agentscore-pay with operator token from agent wallet.

Sell intelligence with optional compliance. Buy from regulated merchants with one Passport.

skill.md → api.syraa.fun/skill.md`,

  "photo-cards-quad": `4 pillars of Syra × AgentScore:

→ Gate: KYC, sanctions, age, jurisdiction on paid retry
→ Passport: verify once, works at every gated merchant
→ Pay tools: discover, check, status, pay from agent chat
→ Policy boost: higher caps for KYC-verified operators

Syra is now both an x402 merchant with optional gates and an x402 buyer for regulated commerce.

One stack. Two sides of agent payments.`,

  "photo-stat-trio": `4 new agent tools. 2 gated routes. 1 Passport for every merchant.

AgentScore integration means Syra agents can discover gated merchants, verify identity once, and checkout with USDC — while Syra itself can gate sensitive routes when regulation matters.

Identity + payments + intelligence. Finally in one loop.

Explore → syraa.fun/chat`,

  "photo-comparison": `Before AgentScore on Syra:
No KYC gates. Agents couldn't checkout at regulated merchants like Martin Estate.

Now:
Optional Gate on sensitive routes. Passport + pay tools for compliant agent commerce.

The gap between "pay for intelligence" and "buy from regulated merchants" just closed.

402 for price. Passport for identity.`,

  "photo-closing-cta": `Agent commerce is here. Build with compliance built in.

→ Agent chat: syraa.fun/chat
→ skill.md: api.syraa.fun/skill.md
→ AgentScore docs: docs.agentscore.sh

Verify once with Passport. Pay per call. Gate when it matters. Syra agents can now reach every merchant in the AgentScore network.`,
};
