import { AGENTSCORE_POST } from "../agentscoreUpdate";
import type { PostPhotoUpdate } from "./types";

/** Photo-format content for the AgentScore ship log. */
export const AGENTSCORE_PHOTO: PostPhotoUpdate = {
  meta: AGENTSCORE_POST.meta,
  picks: [
    "photo-cover-spotlight",
    "photo-flow-pipeline",
    "photo-cards-quad",
    "photo-stat-trio",
    "photo-comparison",
    "photo-closing-cta",
  ],
  content: {
    eyebrow: "Ship log",
    badge: "Passport · Gate · Pay",
    title: "AgentScore × Syra",
    subtitle: "Identity, compliance, and agent commerce wired into Syra's x402 stack.",
    kicker: "Why this matters",
    headline: "Agents need to pay and comply.",
    body: "Syra sells intelligence over x402. Regulated merchants need KYC before checkout. AgentScore closes the gap with merchant gates and buyer Passport tools without replacing our payment middleware.",
    quote: "402 for price. Passport for identity. Same Syra agent brain.",
    highlights: [
      "AgentScore Gate on 8004 registration + Tempo payouts",
      "agentscore-discover, check, passport-status, pay",
      "Public /agentscore routes, MCP, and skill.md",
      "Policy engine boost for verified operators",
    ],
    steps: [
      { step: "01", title: "Anonymous 402", description: "First request returns x402 pricing. Permissionless unchanged." },
      { step: "02", title: "Pay with x402", description: "Payment-Signature verified via existing facilitator." },
      { step: "03", title: "Gate if required", description: "Assess on paid retry. 403 + verify_url without Passport." },
      { step: "04", title: "Buy merchants", description: "agentscore-pay with X-Operator-Token from agent wallet." },
    ],
    cards: [
      { title: "Gate", subtitle: "Merchant", detail: "KYC, sanctions, age, jurisdiction on paid retry.", accent: "gold" },
      { title: "Passport", subtitle: "Buyer", detail: "Verify once. Works at every gated merchant.", accent: "gold" },
      { title: "Pay tools", subtitle: "4 tools", detail: "Discover, check, status, pay from agent chat." },
      { title: "Policy", subtitle: "Boost", detail: "Higher caps for KYC-verified operators." },
    ],
    stats: [
      { value: "4", label: "New agent tools" },
      { value: "2", label: "Gated routes" },
      { value: "1", label: "Passport, many merchants" },
    ],
    narrative: "Sell intelligence with optional compliance. Buy from regulated merchants with one Passport.",
    links: [
      { label: "Agent chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
      { label: "skill.md", value: "api.syraa.fun/skill.md", href: "https://api.syraa.fun/skill.md" },
      { label: "AgentScore", value: "docs.agentscore.sh", href: "https://docs.agentscore.sh" },
    ],
    items: [
      "Agent tools: agentscore-discover through agentscore-pay",
      "Public GET /agentscore/discover and /check",
      "Gate on 8004 register-agent and Tempo payouts",
      "MCP syra_agentscore_* tools for external agents",
    ],
    compareLeft: {
      title: "Before",
      body: "No KYC gates on Syra. Agents could not checkout at AgentScore-gated merchants.",
    },
    compareRight: {
      title: "Now",
      body: "Optional Gate on sensitive routes. Passport + pay tools for regulated agent commerce.",
    },
    terminalLines: [
      "$ curl api.syraa.fun/agentscore/discover",
      "< merchants: Martin Estate, Sayer & Stone, …",
      "$ agentscore-pay passport login",
      "> verify_url opened · KYC complete · opc_… saved",
      "$ syra agent tools call agentscore-pay --url https://agents.martinestate.com/purchase",
      "> 402 → pay USDC → X-Operator-Token attached",
      "< HTTP/200 · order confirmed",
    ],
  },
};
