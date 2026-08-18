import { Database, Globe, Layers, Radio, Search, Terminal } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Agent Economy APIs wrapping agenteconomy.to open feeds.
 * Slide copy: avoid em dashes; use commas, periods, or colons instead.
 */
export const AGENT_ECONOMY_APIS_POST = defineVideoUpdate(
  {
    updateNumber: 49,
    id: "agent-economy-apis",
    title: "Agent Economy APIs",
    published: "August 2026",
    tagline:
      "Free headlines and paid dumps of x402, ERC-8004, and MCP supply. External market context, not Syra traction.",
    shareCopyVideo: `Agent Economy APIs are live.

Agents can read x402, ERC-8004, and MCP supply without scraping two JSON files.

Free headlines: GET /agent-economy/summary
Paid dumps: GET /agent-economy/on-chain and /off-chain, $0.001 each.

The stats are agenteconomy.to market context, not Syra paid-call traction.

syraa.fun/playground`,
    shareCopyPhoto: `New on Syra: Agent Economy APIs.

Free GET /agent-economy/summary. Paid full dumps at $0.001.
x402, ERC-8004, MCP supply, attributed to agenteconomy.to.

syraa.fun/playground`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Agent Economy APIs",
      subtitle:
        "x402, ERC-8004, and MCP supply as agent-readable routes. Headlines are free. Full dumps are $0.001. External context, not Syra traction.",
      badge: "Free summary · Paid dumps",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-split-highlight",
      label: "Thesis",
      kicker: "Why this matters",
      headline: "Scraping JSON is not a market API.",
      body: "agenteconomy.to publishes two open feeds. Agents used to fetch them by hand. Syra now wraps the headlines for free and the full dumps behind x402, with attribution on every response.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-highlight-cards",
      label: "Shipped",
      kicker: "What is live",
      headline: "Four routes. Two free. Two paid.",
      body: "Summary and freshness are free. On-chain and off-chain dumps cost $0.001. Playground Spend lists the same paths. This is not GET /api/metrics.",
      highlights: [
        "GET /agent-economy/summary, free headlines",
        "GET /agent-economy/freshness, feed ages",
        "Paid /on-chain and /off-chain at $0.001",
        "Attribution to agenteconomy.to on every JSON",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-ladder",
      label: "Flow",
      kicker: "How a call works",
      headline: "Ask, pay if needed, cite the source.",
      steps: [
        {
          step: "01",
          title: "Ask",
          description: "Hit GET /agent-economy/summary. No payment.",
        },
        {
          step: "02",
          title: "Pay",
          description: "Need the full dump: settle /on-chain or /off-chain.",
        },
        {
          step: "03",
          title: "Wrap",
          description: "Syra caches 5 min and adds attribution.",
        },
        {
          step: "04",
          title: "Use",
          description: "Agent reads headlines. Cite agenteconomy.to.",
        },
      ],
    },
    {
      id: "cards",
      kind: "cards",
      layout: "cards-glass-row",
      label: "Coverage",
      kicker: "What each route returns",
      headline: "Headlines vs the full feed.",
      cards: [
        {
          title: "Summary",
          subtitle: "Free",
          detail: "x402 txs, volume, ERC-8004 agents, bazaar, MCP count.",
          accent: "gold",
        },
        {
          title: "Freshness",
          subtitle: "Free",
          detail: "Dual updatedAt plus off-chain section asOf stamps.",
          accent: "gold",
        },
        {
          title: "On-chain",
          subtitle: "$0.001",
          detail: "Full data.json: x402, Olas, Virtuals ACP, ERC-8004.",
          accent: "gold",
        },
        {
          title: "Off-chain",
          subtitle: "$0.001",
          detail: "Full web-sources.json: bazaar, MCP, tokens, adoption.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-diamond-grid",
      label: "Surfaces",
      kicker: "Where agents find it",
      headline: "HTTP first. Playground second.",
      items: [
        {
          icon: Globe,
          title: "Summary JSON",
          description: "GET /agent-economy/summary, no API key.",
        },
        {
          icon: Radio,
          title: "Freshness",
          description: "GET /agent-economy/freshness for feed ages.",
        },
        {
          icon: Database,
          title: "Paid dumps",
          description: "x402 on /on-chain and /off-chain at $0.001.",
        },
        {
          icon: Search,
          title: "Discovery",
          description: "Paid dumps listed on /.well-known/x402.",
        },
        {
          icon: Terminal,
          title: "Playground",
          description: "Spend tools on syraa.fun/playground.",
        },
        {
          icon: Layers,
          title: "Not traction",
          description: "Syra proof stays on GET /api/metrics.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-orbit-stats",
      label: "Impact",
      kicker: "External snapshot",
      headline: "Market size, not Syra volume.",
      stats: [
        { value: "163M", label: "x402 txs · external" },
        { value: "$41M", label: "x402 volume · external" },
        { value: "461k", label: "ERC-8004 agents" },
      ],
      narrative:
        "Rounded from GET /agent-economy/summary on 18 Aug 2026. Source: agenteconomy.to. Do not quote these as Syra paid calls.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Call the summary. Pay only for the dump.",
      subline: "Open Playground Spend, or hit GET /agent-economy/summary now.",
      links: [
        {
          label: "Playground",
          value: "syraa.fun/playground",
          href: "https://www.syraa.fun/playground",
        },
        {
          label: "Summary JSON",
          value: "api.syraa.fun/agent-economy/summary",
          href: "https://api.syraa.fun/agent-economy/summary",
        },
        {
          label: "API reference",
          value: "docs.syraa.fun/docs/api-reference",
          href: "https://docs.syraa.fun/docs/api-reference",
        },
      ],
    },
  ],
);
