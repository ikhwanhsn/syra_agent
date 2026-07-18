import { Bot, Globe, ShieldCheck, UserCheck, Wallet } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: AgentScore identity, payments, and compliance integration.
 * Update this file (or swap ACTIVE_POST in index.ts) when publishing the next build update.
 */
export const AGENTSCORE_POST: PostUpdate = {
  meta: {
    updateNumber: 3,
    id: "agentscore-integration",
    title: "AgentScore Integration",
    published: "June 2026",
    tagline: "Identity, compliance, and agent commerce on Syra x402",
    shareCopyVideo: `SHIP LOG · AgentScore is wired into Syra.

Merchant side: KYC, age, sanctions, and jurisdiction gates on high-risk routes. Buyer side: discover gated merchants, verify once with Passport, pay from your agent wallet.

→ AgentScore Gate on 8004 registration + Tempo payouts
→ agentscore-discover / check / pay agent tools
→ Public /agentscore routes + MCP + skill.md
→ Policy engine boost for verified operators

Pay for intelligence. Buy from regulated merchants. One stack for agent commerce.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · AgentScore is live on Syra.

Syra is now both an x402 merchant with optional compliance gates and an x402 buyer that can reach AgentScore-gated merchants like Martin Estate.

Verify once with Passport. Pay per call. Gate when regulation matters.

402 for price. Passport for identity. Same Syra agent brain.

Try it → syraa.fun/chat · skill.md → api.syraa.fun/skill.md`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "AgentScore × Syra",
      subtitle: "Identity, compliance, and agent commerce wired into Syra's x402 stack: merchant gates and buyer tools in one ship.",
      badge: "Passport · Gate · Pay",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agents need to pay and comply.",
      body: "Syra already sells intelligence over x402. Regulated merchants need KYC before checkout. Autonomous agents need Passport to buy wine, payouts, and gated APIs without re-verifying on every site. AgentScore closes both gaps without replacing our payment middleware.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What we built",
      headline: "Two-way AgentScore integration",
      body: "Merchant: conditional AgentScore Gate on selected routes, on by default, with wallet capture after settle. Buyer: four agent tools plus public discover/check routes and MCP exposure.",
      highlights: [
        "Gate on POST /8004/register-agent and POST /payouts/tempo",
        "agentscore-discover, check, passport-status, pay tools",
        "GET /agentscore/discover and /check · GET /skill.md",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How it works",
      headline: "402 first, identity on the paid retry",
      steps: [
        {
          step: "01",
          title: "Anonymous discovery",
          description: "First request without payment still returns HTTP 402 with x402 pricing. Permissionless wallets unchanged.",
        },
        {
          step: "02",
          title: "Pay with x402",
          description: "Agent or playground attaches Payment-Signature. Syra verifies and settles via the existing facilitator path.",
        },
        {
          step: "03",
          title: "Gate when required",
          description: "On gated routes, AgentScore assess runs only when payment headers are present. Missing Passport returns 403 + verify_url.",
        },
        {
          step: "04",
          title: "Buy from merchants",
          description: "agentscore-pay probes, attaches X-Operator-Token, and pays Solana x402 merchants from the agent wallet.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-featured-trio",
      label: "Features",
      kicker: "Under the hood",
      headline: "Commerce stack, not a rewrite",
      cards: [
        {
          title: "AgentScore Gate",
          subtitle: "Merchant · Express",
          detail: "conditionalAgentscoreGate: KYC, sanctions, min age, US jurisdiction on paid retry only.",
          accent: "gold",
        },
        {
          title: "Passport + Pay",
          subtitle: "Buyer · SDK",
          detail: "Operator token via assess. pay402AndRetry with X-Operator-Token for gated checkout.",
          accent: "gold",
        },
        {
          title: "Policy boost",
          subtitle: "Wallet broker",
          detail: "Verified operators get higher spend caps and lower risk scores in the policy engine.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across API and agent",
      items: [
        {
          icon: Bot,
          title: "Agent tools",
          description: "agentscore-discover, check, passport-status, pay via POST /agent/tools/call.",
          href: "https://www.syraa.fun/chat",
        },
        {
          icon: Globe,
          title: "Public discover",
          description: "GET /agentscore/discover and /check for MCP and integrators. No API key.",
          href: "https://api.syraa.fun/agentscore/discover",
        },
        {
          icon: ShieldCheck,
          title: "Gated routes",
          description: "8004 agent registration and Tempo payouts when gate is enabled (default on).",
        },
        {
          icon: UserCheck,
          title: "Passport",
          description: "Verify once with agentscore-pay passport login. Token flows to Syra pay tools.",
          href: "https://docs.agentscore.sh/passport",
        },
        {
          icon: Wallet,
          title: "skill.md",
          description: "Agent commerce doc for discovery: identity requirements and tool IDs.",
          href: "https://api.syraa.fun/skill.md",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "For builders",
      headline: "Sell intelligence. Buy regulated goods.",
      stats: [
        { value: "4", label: "New agent tools" },
        { value: "2", label: "Gated merchant routes" },
        { value: "1", label: "Passport, many merchants" },
      ],
      narrative:
        "Syra stays permissionless for most x402 APIs. Turn the gate on for compliance-sensitive flows, or point your agent at Martin Estate and other AgentScore merchants with the same Passport you verified once.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Try AgentScore on Syra today.",
      subline: "Run agentscore-discover in chat, read skill.md, or enable AGENTSCORE_API_KEY for production gate assess.",
      links: [
        { label: "Agent chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        { label: "skill.md", value: "api.syraa.fun/skill.md", href: "https://api.syraa.fun/skill.md" },
        { label: "AgentScore", value: "docs.agentscore.sh", href: "https://docs.agentscore.sh" },
      ],
    },
  ],
};
