import { OKX_GENESIS_FINANCE_POST } from "../okxGenesisFinanceUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { OKX_GENESIS_FINANCE_PHOTO_SHARE_COPIES } from "./shareCopies/okxGenesisFinanceShareCopies";

const copies = OKX_GENESIS_FINANCE_PHOTO_SHARE_COPIES;

/** Photo-format content for OKX.AI Genesis Finance Copilot ship log. */
export const OKX_GENESIS_FINANCE_PHOTO = definePhotoUpdate(OKX_GENESIS_FINANCE_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Hackathon",
      badge: "Finance · #OKXAI · x402",
      title: "OKX.AI × Syra",
      subtitle:
        "Finance Copilot for agents. Decision-ready crypto intelligence, pay per call.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The bet",
      headline: "Raw data is not a finance copilot.",
      body: "Syra enters OKX.AI Genesis in Finance: signals, risk, and Brain research agents pay for per call.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Ask. Pay. Decide.",
      narrative:
        "HTTP 402 → x402 settle → signal JSON or Brain markdown with toolUsages. Finance Copilot loop.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Copilot loop",
      headline: "Question to decision.",
      steps: [
        { step: "01", title: "Ask", description: "BTC brief, token DD, or arb scan." },
        { step: "02", title: "402", description: "Payment-Required with multi-chain accepts." },
        { step: "03", title: "Pay", description: "Agentic Wallet or payer signs per call." },
        { step: "04", title: "Decide", description: "Signal or Brain report with citations." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What is live",
      headline: "From API to Genesis entry.",
      steps: [
        { step: "01", title: "48+ routes", description: "x402 discovery on api.syraa.fun." },
        { step: "02", title: "Finance bundle", description: "Signal, indicator, sentiment, arb." },
        { step: "03", title: "Brain A2A", description: "Natural-language DD and briefs." },
        { step: "04", title: "X Layer", description: "eip155:196 in production 402s." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One Finance Copilot.",
      cards: [
        { title: "A2MCP", subtitle: "APIs", detail: "Pay-per-call finance routes.", accent: "gold" },
        { title: "A2A", subtitle: "Brain", detail: "Negotiated research tasks.", accent: "gold" },
        { title: "Settle", subtitle: "x402", detail: "Incl. X Layer accepts." },
        { title: "Track", subtitle: "Finance", detail: "Genesis Finance Copilot." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Genesis checklist. Repo ready.",
      highlights: [
        "Finance Copilot ASP profile",
        "A2MCP finance APIs + OpenAPI",
        "A2A Brain Finance Copilot",
        "90s #OKXAI demo script",
        "Google form answer pack",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Built for the Finance track.",
      stats: [
        { value: "48+", label: "x402 resources" },
        { value: "2", label: "A2MCP + A2A" },
        { value: "90s", label: "Demo cap" },
      ],
      narrative: "Decision layer for agents. Pay per call. Ship the #OKXAI demo.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Syra Brain Finance Copilot.",
      stats: [{ value: "$0.50", label: "Standard A2A task" }],
      narrative:
        "Natural-language finance research with toolUsages transparency. Analysis only, not trade execution.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Raw feed vs Finance Copilot.",
      compareLeft: {
        title: "Before",
        body: "Agents stitch prices themselves. No paid decision layer on OKX.AI.",
      },
      compareRight: {
        title: "Now",
        body: "Syra sells signals + Brain briefs. x402 per call. Finance category fit.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Hackathon",
      badge: "OKX.AI Genesis · Finance",
      partnerName: "OKX",
      partnerLogo: "/images/partners/placeholder.svg",
      headline: "Syra × OKX.AI",
      subtitle: "Finance Copilot for agents. #OKXAI · x402 · Brain A2A.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Finance bundle",
      headline: "Routes reviewers should see first.",
      items: [
        "/brain · Finance research A2A",
        "/signal · /indicator · /sentiment",
        "/arbitrage · /bitcoin · /equity · /spcx",
        "/jupiter/quote · /rise scout",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Discovery + settlement",
      headline: "OKX finds you. Syra settles the call.",
      body: "OKX.AI is discovery for Agentic Wallets. Syra is the Finance Copilot. x402 unlocks each call.",
      highlights: [
        "OKX.AI marketplace discovery",
        "Syra finance API + Brain",
        "Multi-chain x402 including X Layer",
        "OpenAPI + .well-known/x402",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Finance call on x402.",
      terminalLines: [
        "$ GET api.syraa.fun/signal?token=bitcoin",
        "< HTTP/402 · eip155:196 + solana + base",
        "$ agentic-wallet pay",
        "< HTTP/200 · signal payload",
        "$ POST /brain · BTC market brief",
        "< markdown + toolUsages[]",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Finance Copilot for agents. #OKXAI",
      subtitle: "Ask Brain. Pay per call. Ship the decision.",
      links: [
        { label: "Site", value: "syraa.fun", href: "https://syraa.fun" },
        { label: "Playground", value: "syraa.fun/marketplace", href: "https://www.syraa.fun/marketplace?tab=custom" },
        {
          label: "Genesis",
          value: "Build X",
          href: "https://web3.okx.com/xlayer/build-x-series",
        },
      ],
    }),
  },
]);
