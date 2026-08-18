import { AGENT_ECONOMY_APIS_POST } from "../agentEconomyApisUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { AGENT_ECONOMY_APIS_PHOTO_SHARE_COPIES } from "./shareCopies/agentEconomyApisShareCopies";

const copies = AGENT_ECONOMY_APIS_PHOTO_SHARE_COPIES;

/** Photo-format content for the Agent Economy APIs ship log. */
export const AGENT_ECONOMY_APIS_PHOTO = definePhotoUpdate(AGENT_ECONOMY_APIS_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-aurora",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Free summary · Paid dumps",
      title: "Agent Economy APIs",
      subtitle:
        "x402, ERC-8004, and MCP supply as agent-readable APIs. Headlines are free. Full dumps are $0.001. External context, not Syra traction.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-beam",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The moment",
      headline: "Scraping JSON is not a market API.",
      body: "agenteconomy.to publishes two open feeds. Agents used to fetch them by hand. Syra now wraps the headlines for free and the full dumps behind x402.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote-gilded",
    shareCopy: copies.quote,
    content: photoContent({
      kicker: "The rule",
      quote: "External market context, wrapped for agents. Not Syra traction.",
      narrative:
        "Syra caches both feeds for five minutes and returns attribution on every response. Use GET /api/metrics for Syra paid-call proof.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-conduit",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Call flow",
      headline: "Ask, pay if needed, cite the source.",
      steps: [
        { step: "01", title: "Ask", description: "Hit GET /agent-economy/summary. No payment." },
        { step: "02", title: "Pay", description: "Need the dump: settle /on-chain or /off-chain." },
        { step: "03", title: "Wrap", description: "Syra caches 5 min and adds attribution." },
        { step: "04", title: "Use", description: "Agent reads headlines. Cite agenteconomy.to." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-flow-ledger",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Ship sequence",
      headline: "From open feeds to public routes.",
      steps: [
        { step: "01", title: "Routes", description: "Summary, freshness, on-chain, off-chain." },
        { step: "02", title: "Cache", description: "Five-minute TTL plus attribution wrapper." },
        { step: "03", title: "Catalog", description: "Paid dumps listed on /.well-known/x402." },
        { step: "04", title: "Public", description: "GET /agent-economy/summary is live." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-glass-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      kicker: "Coverage",
      headline: "Four routes. Two prices.",
      cards: [
        {
          title: "Summary",
          subtitle: "Free",
          detail: "x402 txs, volume, ERC-8004, bazaar, MCP count.",
          accent: "gold",
        },
        {
          title: "Freshness",
          subtitle: "Free",
          detail: "Dual updatedAt plus section asOf stamps.",
          accent: "gold",
        },
        {
          title: "On-chain",
          subtitle: "$0.001",
          detail: "Full data.json: x402, Olas, Virtuals, ERC-8004.",
          accent: "gold",
        },
        {
          title: "Off-chain",
          subtitle: "$0.001",
          detail: "Full web-sources.json: bazaar, MCP, tokens.",
        },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-tiered",
    shareCopy: copies.checklist,
    content: photoContent({
      kicker: "Today",
      headline: "What you can call now.",
      highlights: [
        "GET /agent-economy/summary (free)",
        "GET /agent-economy/freshness (free)",
        "Pay /on-chain or /off-chain at $0.001",
        "Open Playground Spend to try it",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-halo",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Market size, not Syra volume.",
      stats: [
        { value: "163M", label: "x402 txs · external" },
        { value: "$41M", label: "x402 volume · external" },
        { value: "461k", label: "ERC-8004 agents" },
      ],
      narrative: "Rounded from GET /agent-economy/summary on 18 Aug 2026. Source: agenteconomy.to.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-monolith",
    shareCopy: copies.featured,
    content: photoContent({
      kicker: "Ecosystem, not Syra",
      headline: "agenteconomy.to x402 txs, via Syra.",
      stats: [{ value: "163M", label: "x402 txs · external" }],
      narrative: "Snapshot 18 Aug 2026. Not GET /api/metrics.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-compare-slide",
    shareCopy: copies.comparison,
    content: photoContent({
      kicker: "The wedge",
      headline: "DIY scrape vs Syra x402.",
      compareLeft: {
        title: "DIY scrape",
        body: "Fetch two JSON files. No cache, no 402, no catalog.",
      },
      compareRight: {
        title: "Syra x402",
        body: "Free headlines, $0.001 dumps, 5 min cache, attribution.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live",
      headline: "Agent Economy APIs are live.",
      body: "Free summary and freshness. Paid on-chain and off-chain dumps at $0.001. Source: agenteconomy.to.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Next stops",
      headline: "Where to go after this ship.",
      items: [
        "GET /agent-economy/summary for headlines",
        "GET /agent-economy/freshness for feed ages",
        "Pay /on-chain for full data.json",
        "Pay /off-chain for web-sources.json",
        "Discover paid dumps on /.well-known/x402",
        "Playground Spend. Syra proof is /api/metrics",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-frost",
    shareCopy: copies.split,
    content: photoContent({
      kicker: "Split of labor",
      headline: "Syra owns the wrap. They own the data.",
      body: "You get cached JSON with attribution. The numbers stay agenteconomy.to market context.",
      highlights: ["5 min cache", "Attribution wrapper", "Free + $0.001 dumps"],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "From headline to paid dump.",
      terminalLines: [
        "$ GET /agent-economy/summary",
        "# free x402 / 8004 / MCP headlines",
        "$ GET /agent-economy/on-chain",
        "# pay $0.001, full data.json",
        "$ GET /agent-economy/off-chain",
        "# pay $0.001, web-sources.json",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-banner",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Call the summary. Pay only for the dump.",
      subtitle: "Open Playground Spend, or hit GET /agent-economy/summary now.",
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
    }),
  },
]);
