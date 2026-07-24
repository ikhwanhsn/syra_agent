import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for AgentScore photo deck: 15 distinct topics. */
export const AGENTSCORE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces AgentScore joining Syra's payment stack.

Agents can now pay with x402, comply through an AgentScore Passport, and get gated on routes where regulation actually matters. Payments and identity work together without replacing either system.

syraa.fun/chat`,

  thesis: `This card states the gap AgentScore closes.

Syra already sells intelligence over x402, but regulated merchants need KYC before checkout. AgentScore adds merchant gates and a buyer Passport on top of the existing payment middleware, instead of replacing it.

syraa.fun/chat`,

  quote: `This card carries the rule behind the integration: 402 handles price, Passport handles identity.

Permissionless x402 checkout stays unchanged everywhere else. Compliance only applies on specific routes, and it lives on the buyer side through one Passport.

syraa.fun/chat`,

  flow: `This image walks through agent commerce on Syra, in four steps.

1. The first request to a route returns anonymous 402 pricing, unchanged from before
2. Payment settles with x402 through the existing facilitator
3. A gated route reassesses on the paid retry and returns 403 with a verify_url if Passport is missing
4. Passport holders buy from gated merchants using agentscore-pay with an operator token from the agent wallet

syraa.fun/chat`,

  timeline: `This timeline traces a checkout from discovery to a confirmed order.

1. The agent discovers a merchant through agentscore-discover in chat or the public API
2. It pays with x402, turning 402 pricing into a USDC Payment-Signature on retry
3. A gated merchant returns 403 with a verify_url if Passport is missing, so KYC only runs once
4. The agent retries with its operator token and gets back HTTP 200 with the order confirmed

syraa.fun/chat`,

  pillars: `This bento layout shows the four pillars of AgentScore on Syra.

Gate checks KYC, sanctions, age, and jurisdiction on the paid retry for merchant routes that need it. Passport lets a buyer verify once and reuse that verification at every gated merchant. Four pay tools cover discover, check, status, and pay from agent chat, and verified operators get higher policy caps.

syraa.fun/chat`,

  checklist: `This checklist covers what shipped in Syra times AgentScore.

1. AgentScore Gate now covers 8004 registration and Tempo payouts
2. Agent tools ship for discover, check, passport status, and pay
3. Public /agentscore routes, an MCP server, and a skill.md are all live
4. The policy engine gives verified operators a higher cap

syraa.fun/chat`,

  metrics: `This card lists the numbers behind the AgentScore integration.

Four new agent tools cover the full commerce loop. Two routes carry a compliance gate today. One Passport works across every gated merchant, so identity, payments, and intelligence all sit in the same agent loop.

syraa.fun/chat`,

  featured: `This featured card highlights how far one Passport reaches.

Verify identity once through AgentScore Passport and it works at Martin Estate, Sayer & Stone, and the rest of the AgentScore network, with no re-KYC required at each new merchant.

syraa.fun/chat`,

  comparison: `This before and after card compares paying for data with buying from merchants.

Before, Syra had no KYC gates, so agents could not check out at merchants that required AgentScore compliance. Now, an optional Gate sits on sensitive routes and Passport plus the pay tools handle regulated agent commerce end to end.

syraa.fun/chat`,

  launch: `This launch card marks AgentScore as live on Syra.

Syra now works as an x402 merchant with optional compliance gates on its own routes, and as an x402 buyer that can check out at AgentScore-gated merchants using Passport and the pay tools in agent chat.

syraa.fun/chat`,

  deepDive: `This deep-dive card lists the technical surface behind AgentScore.

Agent tools range from agentscore-discover through agentscore-pay, and the same functionality is exposed as public GET /agentscore/discover and /check routes. Gate covers 8004 agent registration and Tempo payouts, and MCP tools expose the same actions to external agents.

syraa.fun/chat`,

  split: `This split card explains the two sides of AgentScore on Syra.

On the merchant side, an optional Gate checks KYC, sanctions, age, and jurisdiction on high-risk routes. On the buyer side, an agent discovers gated merchants, verifies once with Passport, and pays through agentscore-pay from its own wallet.

syraa.fun/chat`,

  terminal: `This terminal card shows an AgentScore checkout end to end.

Discovering merchants returns a list that includes Martin Estate and Sayer & Stone. Logging into Passport opens a verify_url, completes KYC, and saves an operator token. Calling agentscore-pay against a merchant purchase URL gets a 402, pays in USDC, attaches the operator token, and comes back with the order confirmed.

syraa.fun/chat`,

  cta: `This closing card points to where to try AgentScore on Syra.

Open agent chat to pay per call and check out at gated merchants, read the skill.md for the full tool reference, or check the AgentScore docs for how Passport and Gate work.

syraa.fun/chat
api.syraa.fun/skill.md
docs.agentscore.sh`,
};
