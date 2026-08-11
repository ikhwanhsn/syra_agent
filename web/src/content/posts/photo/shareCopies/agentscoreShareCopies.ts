import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for AgentScore photo deck. Proof-first, no meta card talk. */
export const AGENTSCORE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `AgentScore now sits in Syra's payment stack.

Agents can pay with x402 (pay only when they call), comply through an AgentScore Passport, and get gated on routes where regulation actually matters. Payments and identity work together without replacing either system.

syraa.fun/chat`,

  thesis: `Payments worked, identity did not.

Syra already sells intelligence over x402, but regulated merchants need KYC (know-your-customer checks) before checkout. AgentScore adds merchant gates and a buyer Passport on top of the existing payment middleware, instead of replacing it.

syraa.fun/chat`,

  quote: `x402 handles price, Passport handles identity.

Permissionless x402 checkout stays unchanged everywhere else. Compliance only applies on specific routes, and it lives on the buyer side through one Passport.

syraa.fun/chat`,

  flow: `Anonymous pricing, then pay, then gate, then buy.

1. The first request to a route returns anonymous 402 pricing, unchanged from before
2. Payment settles with x402 through the existing facilitator
3. A gated route reassesses on the paid retry and returns 403 with a verify_url if Passport is missing
4. Passport holders buy from gated merchants using agentscore-pay with an operator token from the agent wallet

syraa.fun/chat`,

  timeline: `Verify once, then buy everywhere.

1. The agent discovers a merchant through agentscore-discover in chat or GET /agentscore/discover
2. It pays with x402, turning 402 pricing into a USDC (digital dollars) Payment-Signature on retry
3. A gated merchant returns 403 with a verify_url if Passport is missing, so KYC only runs once
4. The agent retries with its operator token and gets HTTP 200 with the order confirmed

syraa.fun/chat`,

  pillars: `Compliance when required, permissionless when not.

Gate checks KYC, sanctions, age, and jurisdiction on the paid retry for merchant routes that need it. Passport lets a buyer verify once and reuse that verification at every gated merchant. Four pay tools cover discover, check, status, and pay from agent chat. Verified operators get higher policy caps.

syraa.fun/chat`,

  checklist: `What shipped in Syra and AgentScore.

1. AgentScore Gate now covers 8004 registration and Tempo payouts
2. Agent tools ship for discover, check, passport status, and pay
3. Public /agentscore routes, an MCP server, and a skill.md are all live
4. The policy engine gives verified operators a higher cap

syraa.fun/chat`,

  metrics: `Identity, payments, and intelligence in one agent loop.

4 new agent tools. 2 routes with a compliance gate today. 1 Passport across every gated merchant.

Sell intelligence with optional compliance. Buy from regulated merchants with one Passport.

syraa.fun/chat`,

  featured: `One Passport, no re-KYC at each checkout.

Verify identity once through AgentScore Passport and it works at Martin Estate, Sayer & Stone, and the rest of the AgentScore network.

syraa.fun/chat`,

  comparison: `Paying for data is not the same as buying from merchants.

Before, Syra had no KYC gates, so agents could not check out at merchants that required AgentScore compliance. Now an optional Gate sits on sensitive routes, and Passport plus the pay tools handle regulated agent commerce end to end.

syraa.fun/chat`,

  launch: `AgentScore is live on Syra.

Syra now works as an x402 merchant with optional compliance gates on its own routes, and as an x402 buyer that can check out at AgentScore-gated merchants using Passport and the pay tools in agent chat.

syraa.fun/chat`,

  deepDive: `Built for agents, API-first.

Agent tools range from agentscore-discover through agentscore-pay. The same functionality is exposed as public GET /agentscore/discover and /check. Gate covers 8004 agent registration and Tempo payouts. MCP tools named syra_agentscore_* expose the same actions to external agents.

syraa.fun/chat`,

  split: `Sell intelligence, then buy from merchants.

On the merchant side, an optional Gate checks KYC, sanctions, age, and jurisdiction on high-risk routes. On the buyer side, an agent discovers gated merchants, verifies once with Passport, and pays through agentscore-pay from its own wallet. Verified operators get a policy boost.

syraa.fun/chat`,

  terminal: `An AgentScore checkout end to end.

Discovering merchants returns a list that includes Martin Estate and Sayer & Stone. Logging into Passport opens a verify_url, completes KYC, and saves an operator token. Calling agentscore-pay against a merchant purchase URL gets a 402, pays in USDC, attaches the operator token, and comes back with the order confirmed.

syraa.fun/chat`,

  cta: `Ship compliant agent commerce.

Open agent chat to pay per call and check out at gated merchants. Read skill.md for the full tool reference. Check the AgentScore docs for how Passport and Gate work.

syraa.fun/chat
api.syraa.fun/skill.md
docs.agentscore.sh`,
};
