import { TOKENS_OSS_POST } from "../tokensOssUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { TOKENS_OSS_PHOTO_SHARE_COPIES } from "./shareCopies/tokensOssShareCopies";

const copies = TOKENS_OSS_PHOTO_SHARE_COPIES;

/** Photo-format content for the Tokens open-source ship log. */
export const TOKENS_OSS_PHOTO = definePhotoUpdate(TOKENS_OSS_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Open source · Canonical assets · Agents",
      title: "Syra × Tokens OSS",
      subtitle:
        "Solana Foundation Tokens is open source. Syra is the agent decision layer on that canonical truth.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-gold-frame",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The moment",
      headline: "Canonical assets just became public infrastructure.",
      body: "Tokens is the Solana Foundation source of truth for assets. Open source means builders can read the code and ship with confidence. Syra already consumes that board.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Canonical mint in. Research decision out.",
      narrative:
        "Foundation identity and risk first. Syra intelligence next. Agents act with both.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How agents win",
      headline: "Resolve → risk → intel → action.",
      steps: [
        { step: "01", title: "Resolve", description: "Ticker or mint becomes a Tokens assetId." },
        { step: "02", title: "Risk", description: "Canonical risk summary from Tokens." },
        { step: "03", title: "Intel", description: "Syra news, sentiment, events, and signal." },
        { step: "04", title: "Act", description: "Decide with identity and context together." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Ship sequence",
      headline: "From hosted API to open monorepo.",
      steps: [
        { step: "01", title: "Consume", description: "Syra calls hosted Tokens.xyz for identity." },
        { step: "02", title: "Expose", description: "Board, dossier, and token tools for agents." },
        { step: "03", title: "Stack", description: "Syra intelligence on every asset page." },
        { step: "04", title: "Point", description: "Builders track solana-foundation/tokens." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-stack",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four reasons this stack holds.",
      cards: [
        {
          title: "Canonical",
          subtitle: "Foundation truth",
          detail: "Tokens owns assetId, variants, markets, and risk.",
          accent: "gold",
        },
        {
          title: "Intel",
          subtitle: "Syra layer",
          detail: "News, sentiment, events, and signal on the same asset.",
          accent: "gold",
        },
        {
          title: "Spend",
          subtitle: "Pay per call",
          detail: "MCP and x402 charge only when agents call.",
          accent: "gold",
        },
        {
          title: "Upstream",
          subtitle: "Open repo",
          detail: "Contribute and track the live Tokens monorepo.",
        },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What you can do today.",
      highlights: [
        "Browse the full board on syraa.fun/assets",
        "Open a mint dossier with risk and markets",
        "Call token tools from MCP or chat",
        "Use asset-research for one-shot decisions",
        "Read the Tokens monorepo on GitHub",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Proof on Tokens OSS.",
      stats: [
        { value: "OSS", label: "Tokens open source" },
        { value: "13", label: "token tools" },
        { value: "1", label: "Research path" },
      ],
      narrative:
        "Syra does not fork the registry. Syra wraps Foundation-canonical assets with agent UX.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-monolith",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Token tools ready to call.",
      stats: [{ value: "13", label: "Canonical asset tools on Syra" }],
      narrative: "Search, resolve, detail, markets, OHLCV, risk, curated lists, snapshots.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Fork the registry vs wrap it.",
      compareLeft: {
        title: "Weak play",
        body: "Clone Tokens and compete with Foundation hosting.",
      },
      compareRight: {
        title: "Syra play",
        body: "Stay on canonical Tokens. Own the agent decision layer.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-beacon",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Now open",
      badge: "Syra × Tokens",
      partnerName: "Tokens",
      headline: "Syra × Tokens OSS",
      subtitle: "Foundation-canonical assets. Open monorepo. Syra intelligence on top.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Next stops",
      headline: "Where to go after Tokens went open.",
      items: [
        "Assets hub: browse the Tokens universe on Syra",
        "asset-research: resolve, risk, and Syra intel in one call",
        "Tokens docs: API quickstart at docs.tokens.xyz",
        "GitHub: track solana-foundation/tokens",
        "Marketplace: paid /assets routes for agents",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Truth · Decisions",
      headline: "Tokens owns truth. Syra owns decisions.",
      body: "Tokens delivers assetId, variants, markets, and risk. Syra delivers news, sentiment, events, signal, and pay-per-call agent UX.",
      highlights: [
        "Tokens: canonical identity",
        "Syra: intelligence shelf",
        "Agents: one research path",
        "Spend: pay only when you call",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Mint to decision.",
      terminalLines: [
        "$ resolve ticker|mint",
        "-> Tokens assetId",
        "$ risk summary",
        "-> canonical grade",
        "$ syra intel",
        "< ready to act",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Canonical mint in. Decision out.",
      subtitle: "Open the Assets hub, call asset-research, or read the Tokens monorepo.",
      links: [
        { label: "Assets", value: "syraa.fun/assets", href: "https://www.syraa.fun/assets" },
        {
          label: "Tokens OSS",
          value: "github.com/solana-foundation/tokens",
          href: "https://github.com/solana-foundation/tokens",
        },
        {
          label: "Docs",
          value: "docs.tokens.xyz",
          href: "https://docs.tokens.xyz/v1/quickstart",
        },
      ],
    }),
  },
]);
