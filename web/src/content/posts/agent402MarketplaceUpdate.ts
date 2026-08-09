import { Bot, Compass, Sparkles, Store, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Syra is live on the Agent402 marketplace.
 * Slide copy: avoid em dashes; use commas, periods, or colons instead.
 */
export const AGENT402_MARKETPLACE_POST = defineVideoUpdate(
  {
    updateNumber: 46,
    id: "agent402-marketplace",
    title: "Syra on Agent402",
    published: "August 2026",
    tagline:
      "Syra is live on Agent402. Agents find paid crypto intelligence in one place and pay as they go.",
    shareCopyVideo: `SHIP LOG · Syra is live on Agent402.

The 402 hub just got sharper vision. Agents can find Syra, unlock 83 tools, and pay only when they call.

Find Syra. Ask once. Pay as you go.

agent402.tools
syraa.fun`,
    shareCopyPhoto: `SHIP LOG · Syra is live on Agent402.

Agents looking for crypto intelligence can find Syra in the Agent402 marketplace. Browse once. Call what you need. Pay per use.

agent402.tools
syraa.fun`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-spotlight",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Syra × Agent402",
      subtitle:
        "Syra just landed on Agent402. Find paid crypto intelligence in the 402 hub, then pay only when you call.",
      badge: "Live · 83 tools · Pay as you go",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agents should not hunt for hidden links.",
      body: "Great tools are useless if nobody can find them. Agent402 is where agents browse what they can buy. Syra is now in that marketplace so discovery feels instant and spending stays simple.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-checklist",
      label: "Shipped",
      kicker: "What is live",
      headline: "Syra is discoverable on Agent402",
      body: "Syra shows up under its own name, ready for agents that want market signal, news, and research without signing up for another API key ritual.",
      highlights: [
        "Listed as Syra on agent402.tools",
        "83 tools ready for agents to call",
        "Pay only when you use a tool",
        "One marketplace door into Syra intelligence",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-pipeline",
      label: "Flow",
      kicker: "How users win",
      headline: "Find → call → pay → win",
      steps: [
        {
          step: "01",
          title: "Open Agent402",
          description: "Browse the marketplace where agents shop for tools.",
        },
        {
          step: "02",
          title: "Find Syra",
          description: "Syra is listed by name with a full tool shelf waiting.",
        },
        {
          step: "03",
          title: "Call what you need",
          description: "Ask for signal, news, research, or market reads on demand.",
        },
        {
          step: "04",
          title: "Pay as you go",
          description: "No giant subscription. Spend only on the calls that matter.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-row",
      label: "Features",
      kicker: "What users get",
      headline: "Four reasons this listing hits different",
      cards: [
        {
          title: "Discovery",
          subtitle: "One hub",
          detail: "Agents find Syra without digging through random links.",
          accent: "gold",
        },
        {
          title: "Depth",
          subtitle: "83 tools",
          detail: "A full shelf of crypto intelligence, not a single demo endpoint.",
          accent: "gold",
        },
        {
          title: "Freedom",
          subtitle: "Pay per use",
          detail: "Spend when the call is worth it. Skip when it is not.",
          accent: "gold",
        },
        {
          title: "Momentum",
          subtitle: "Syra energy",
          detail: "More doors into Syra means more agents that can move with the market.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Where to go next",
      headline: "Start on Agent402. Stay with Syra.",
      items: [
        {
          icon: Store,
          title: "Agent402",
          description: "Find Syra in the marketplace and start calling tools.",
          href: "https://agent402.tools",
        },
        {
          icon: Compass,
          title: "Syra home",
          description: "See the full product surface beyond the listing.",
          href: "https://www.syraa.fun",
        },
        {
          icon: Bot,
          title: "Agent chat",
          description: "Talk to Syra and spend from a ready agent wallet.",
          href: "https://www.syraa.fun/chat",
        },
        {
          icon: Sparkles,
          title: "Playground",
          description: "Try paid intelligence calls in a guided surface.",
          href: "https://www.syraa.fun/playground",
        },
        {
          icon: Zap,
          title: "Marketplace",
          description: "Browse Syra Spend tools when you already know the brand.",
          href: "https://www.syraa.fun/marketplace",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "Proof on Agent402",
      headline: "Listed. Ready. Call it.",
      stats: [
        { value: "LIVE", label: "On Agent402" },
        { value: "83", label: "Tools" },
        { value: "1", label: "Name: Syra" },
      ],
      narrative:
        "Syra is indexed on Agent402 under its real brand name with a healthy, routable listing. Agents can find the shelf and start calling.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "CTA",
      kicker: "Next step",
      headline: "Go find Syra on Agent402.",
      subline:
        "Open the marketplace, call a tool, and feel how fast paid crypto intelligence should move.",
      links: [
        { label: "Agent402", value: "agent402.tools", href: "https://agent402.tools" },
        { label: "Syra", value: "syraa.fun", href: "https://www.syraa.fun" },
        {
          label: "Playground",
          value: "syraa.fun/playground",
          href: "https://www.syraa.fun/playground",
        },
      ],
    },
  ],
);
