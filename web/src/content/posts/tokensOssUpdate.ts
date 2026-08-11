import { BookOpen, Compass, Sparkles, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Tokens is open source. Syra is the agent decision layer on top.
 * Slide copy: avoid em dashes; use commas, periods, or colons instead.
 */
export const TOKENS_OSS_POST = defineVideoUpdate(
  {
    updateNumber: 47,
    id: "tokens-oss",
    title: "Syra × Tokens OSS",
    published: "August 2026",
    tagline:
      "Solana Foundation Tokens is open source. Syra is the agent layer on that canonical asset truth.",
    shareCopyVideo: `SHIP LOG · Tokens is open source. Syra is ready.

Solana Foundation just opened Tokens. Syra already runs on that canonical board for agents: resolve, risk, dossier, then Syra news, sentiment, and signal.

Canonical mint in. Research decision out.

github.com/solana-foundation/tokens
syraa.fun/assets`,
    shareCopyPhoto: `SHIP LOG · Syra × Tokens open source.

Tokens.xyz is now the open Solana Foundation registry. Syra stays the pay-per-call agent layer: board, dossier, MCP tools, and intelligence on every asset.

syraa.fun/assets
github.com/solana-foundation/tokens`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-spotlight",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Syra × Tokens OSS",
      subtitle:
        "Solana Foundation Tokens is open source. Syra is the agent decision layer on that canonical truth.",
      badge: "Open source · Canonical assets · Agents",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Canonical assets just became public infrastructure.",
      body: "Tokens is the Solana Foundation source of truth for assets. Open source means builders can read the code, file issues, and ship with confidence. Syra already consumes that board for agents and humans.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-checklist",
      label: "Shipped",
      kicker: "What is live",
      headline: "Syra already builds on Tokens",
      body: "Assets hub, mint dossiers, MCP tokens tools, and paid /assets routes sit on Tokens.xyz. Open source upgrades the story: Foundation-canonical identity, Syra intelligence on top.",
      highlights: [
        "Full Tokens.xyz board on syraa.fun/assets",
        "13 tokens-* agent and MCP tools",
        "x402 /assets and /assets/detail",
        "asset-research: resolve, risk, then Syra intel",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-pipeline",
      label: "Flow",
      kicker: "How agents win",
      headline: "Resolve → risk → intel → action",
      steps: [
        {
          step: "01",
          title: "Resolve",
          description: "Ticker or mint becomes a Tokens assetId.",
        },
        {
          step: "02",
          title: "Risk",
          description: "Canonical risk summary from Tokens.",
        },
        {
          step: "03",
          title: "Intel",
          description: "Syra news, sentiment, events, and signal.",
        },
        {
          step: "04",
          title: "Act",
          description: "Agent decides with identity and context together.",
        },
      ],
    },
    {
      id: "cards",
      kind: "cards",
      layout: "cards-bento",
      label: "Features",
      kicker: "What you get",
      headline: "Foundation truth. Syra decisions.",
      cards: [
        {
          title: "Canonical identity",
          subtitle: "Tokens.xyz",
          detail: "Tokens owns assetId, variants, markets, and risk.",
        },
        {
          title: "Syra intelligence",
          subtitle: "On top",
          detail: "News, sentiment, events, and signal on the same asset.",
        },
        {
          title: "Pay per call",
          subtitle: "x402",
          detail: "MCP and x402 charge only when agents call.",
        },
        {
          title: "Open upstream",
          subtitle: "GitHub",
          detail: "Contribute and track github.com/solana-foundation/tokens.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Where to find it",
      headline: "Board, API, MCP, docs",
      items: [
        {
          icon: Compass,
          title: "Assets hub",
          description: "Browse the Tokens universe on syraa.fun/assets.",
          href: "https://www.syraa.fun/assets",
        },
        {
          icon: BookOpen,
          title: "Tokens OSS",
          description: "Read the live monorepo on GitHub.",
          href: "https://github.com/solana-foundation/tokens",
        },
        {
          icon: Zap,
          title: "Agent tools",
          description: "tokens-* plus asset-research for one-shot decisions.",
        },
        {
          icon: Sparkles,
          title: "Marketplace",
          description: "Paid /assets routes under the tokens.xyz brand.",
          href: "https://www.syraa.fun/marketplace",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "Proof",
      headline: "Already integrated. Now amplified.",
      stats: [
        { value: "OSS", label: "Tokens open source" },
        { value: "13", label: "tokens-* tools" },
        { value: "1", label: "Agent research path" },
      ],
      narrative:
        "Syra does not fork the registry. Syra wraps Foundation-canonical assets with agent UX and pay-per-call intelligence.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "CTA",
      headline: "Canonical mint in. Decision out.",
      subline:
        "Open the Assets hub, call asset-research from an agent, or read the Tokens monorepo.",
      links: [
        { label: "Assets", value: "syraa.fun/assets", href: "https://www.syraa.fun/assets" },
        {
          label: "Tokens OSS",
          value: "github.com/solana-foundation/tokens",
          href: "https://github.com/solana-foundation/tokens",
        },
        { label: "Docs", value: "docs.tokens.xyz", href: "https://docs.tokens.xyz/v1/quickstart" },
      ],
    },
  ],
);
