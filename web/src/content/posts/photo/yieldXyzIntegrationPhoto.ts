import { YIELD_XYZ_INTEGRATION_POST } from "../yieldXyzIntegrationUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { YIELD_XYZ_INTEGRATION_PHOTO_SHARE_COPIES } from "./shareCopies/yieldXyzIntegrationShareCopies";

const copies = YIELD_XYZ_INTEGRATION_PHOTO_SHARE_COPIES;

/** Photo-format content for the Yield.xyz discovery ship log. */
export const YIELD_XYZ_INTEGRATION_PHOTO = definePhotoUpdate(YIELD_XYZ_INTEGRATION_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Invest · 8 tools",
      title: "Yield.xyz × Syra",
      subtitle:
        "Search 3,000+ yields across 80+ networks. Compare rates, check risk, track balances. Pay per call.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The shift",
      headline: "Yield is fragmented by design.",
      body: "Every protocol has its own app and risk profile. Yield.xyz aggregates thousands of opportunities. Syra now packages that catalog so agents can search, compare, and diligence in one place.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Find the yield. Check the risk. Then decide.",
      narrative: "Eight Invest tools. Pay per call. Discovery and diligence only for now.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "Ask → compare → decide.",
      steps: [
        { step: "01", title: "Search", description: "yield-find by token or network." },
        { step: "02", title: "Diligence", description: "get · risk · history." },
        { step: "03", title: "Pay per call", description: "x402 or agent wallet." },
        { step: "04", title: "Track", description: "yield-balances for a wallet." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "Yield.xyz end to end.",
      steps: [
        { step: "01", title: "Bridge", description: "Yield AgentKit MCP client." },
        { step: "02", title: "Tools", description: "Eight Invest agent tools." },
        { step: "03", title: "MCP", description: "syra_invest_yield_* curated." },
        { step: "04", title: "Scope", description: "Read-only. Enter/exit later." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "What users actually get.",
      cards: [
        {
          title: "Find",
          subtitle: "Search",
          detail: "Filter thousands of yields by token and network.",
          accent: "gold",
        },
        {
          title: "Risk",
          subtitle: "Diligence",
          detail: "Letter grade and score before you chase APY.",
          accent: "gold",
        },
        {
          title: "History",
          subtitle: "Trends",
          detail: "Reward-rate and TVL history for candidates.",
        },
        {
          title: "Balances",
          subtitle: "Track",
          detail: "Positions and claimable rewards for a wallet.",
        },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What ships with this update.",
      highlights: [
        "yield-find / get / networks / providers",
        "yield-risk / reward-history / tvl-history",
        "yield-balances for wallet tracking",
        "Curated MCP: syra_invest_yield_*",
        "Read-only: no enter or exit yet",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Yield without protocol homework.",
      stats: [
        { value: "3K+", label: "Opportunities" },
        { value: "80+", label: "Networks" },
        { value: "8", label: "Agent tools" },
      ],
      narrative:
        "Yield.xyz supplies the catalog. Syra packages it for agents with pay-per-call pricing.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Cross-chain yield inside Syra.",
      stats: [{ value: "8", label: "Live tools" }],
      narrative: "Search. Risk. History. Balances. Ask once.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Many apps vs one Syra ask.",
      compareLeft: {
        title: "Before",
        body: "Agents juggled separate apps for each protocol and chain.",
      },
      compareRight: {
        title: "Now",
        body: "yield-find returns filtered opportunities. Risk and history tools help compare in the same chat.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · Discovery",
      partnerName: "Yield.xyz",
      partnerLogo: "/images/partners/yield.png",
      partnerLogoSolidBg: true,
      headline: "Syra × Yield.xyz",
      subtitle:
        "3,000+ yields across 80+ networks for agents. Pay per call. Find and diligence before you deploy.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "Yield.xyz AgentKit via Syra.",
      items: [
        "MCP bridge to mcp.yield.xyz",
        "Free allowance first, then Base x402",
        "Agents pay Syra per call on Invest tools",
        "MCP syra_invest_yield_* in curated profile",
        "Enter and exit execution deferred",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Research → decide",
      headline: "Discovery in. Decision out.",
      body: "Read Yield.xyz opportunities first, then use risk and history before sizing capital or calling other Syra tools.",
      highlights: [
        "Research: yield-find + yield-get",
        "Diligence: yield-risk + history",
        "Track: yield-balances",
        "Action: other Invest / Spend tools",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Call Yield from Syra.",
      terminalLines: [
        "$ MCP syra_invest_yield_find",
        "→ token=USDC networks=[base]",
        "$ MCP syra_invest_yield_risk",
        "→ letter grade + score",
        "$ MCP syra_invest_yield_balances",
        "→ positions + claimable rewards",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Ask Syra for better yields.",
      subtitle:
        "Try yield-find on USDC Base or ETH staking. Discovery and diligence only. No deposit txs in this release.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        {
          label: "MCP",
          value: "syra_invest_yield_find",
          href: "https://www.syraa.fun/chat",
        },
        {
          label: "Yield.xyz",
          value: "docs.yield.xyz",
          href: "https://docs.yield.xyz/docs/agents-overview",
        },
      ],
    }),
  },
]);
