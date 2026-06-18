import { BadgeCheck, Bot, Fingerprint, Globe, ShieldCheck, Terminal } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: SAID Protocol verified on-chain agent identity for Syra.
 */
export const SAID_PROTOCOL_POST: PostUpdate = {
  meta: {
    updateNumber: 14,
    id: "said-protocol-integration",
    title: "SAID Protocol Integration",
    published: "June 2026",
    tagline: "Verified on-chain agent identity for Syra on Solana",
    shareCopyVideo: `SHIP LOG · Syra just registered on SAID Protocol.

Verified on-chain agent identity — register once, build reputation, prove who you are across platforms. Syra is live with the verification badge on Solana mainnet.

→ On-chain register + verify via said-sdk
→ GET /said/status · /said/verify · /said/trust · /said/agent
→ npm run register-said for idempotent setup
→ Profile on saidprotocol.com

402 for commerce. SAID for trust. Same Syra brain.

Full breakdown in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · Syra × SAID Protocol is live.

Syra now has verified on-chain agent identity on Solana. Persistent reputation. Trust tier reads. Runtime API routes on Syra.

Register once. Verify forever. Query from any integration.

Profile → saidprotocol.com/agents/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "SAID × Syra",
      subtitle: "Verified on-chain agent identity on Solana. Register once. Build reputation. Prove who you are.",
      badge: "Identity · Verified · Solana",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agents need identity, not just wallets.",
      body: "Syra already runs machine money over x402 and registers agents on 8004. Platforms still ask: is this agent real? SAID Protocol adds persistent, verifiable on-chain identity with a permanent verification badge — the trust layer autonomous agents were missing.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What we built",
      headline: "SAID adapter + runtime routes",
      body: "Full integration: said-sdk for on-chain register/verify, HTTP reads against api.saidprotocol.com, and API-key-protected /said/* routes on Syra for status, trust, and agent lookups.",
      highlights: [
        "saidClient.js adapter + register-said script",
        "Syra verified on SAID mainnet",
        "GET /said/status · /said/verify/:wallet",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How it works",
      headline: "Register. Verify. Query.",
      steps: [
        {
          step: "01",
          title: "On-chain register",
          description: "AgentCard metadata pinned to IPFS. SAID program creates persistent identity PDA on Solana.",
        },
        {
          step: "02",
          title: "Verification badge",
          description: "0.01 SOL one-time fee. Permanent verified status on-chain and in SAID directory.",
        },
        {
          step: "03",
          title: "Directory sync",
          description: "Syra profile visible on saidprotocol.com with trust tier and reputation surface.",
        },
        {
          step: "04",
          title: "Runtime checks",
          description: "Integrators query GET /said/verify/:wallet or /said/trust/:wallet from Syra API.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-featured-trio",
      label: "Stack",
      kicker: "Under the hood",
      headline: "Identity infrastructure",
      cards: [
        {
          title: "said-sdk",
          subtitle: "On-chain",
          detail: "registerAgent + verifyAgent against program 5dpw6KEQ… on Solana mainnet.",
          accent: "gold",
        },
        {
          title: "saidClient",
          subtitle: "Syra adapter",
          detail: "Flexible account parser, IPFS AgentCard upload, HTTP verify/trust/agent reads.",
          accent: "gold",
        },
        {
          title: "/said routes",
          subtitle: "Runtime API",
          detail: "status · verify · trust · agent — API-key protected, no x402.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across Syra stack",
      items: [
        {
          icon: BadgeCheck,
          title: "SAID profile",
          description: "Syra agent profile on saidprotocol.com with verified badge and trust score.",
          href: "https://www.saidprotocol.com/agents/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t",
        },
        {
          icon: Terminal,
          title: "/said/status",
          description: "Query Syra's own SAID identity from the API gateway.",
          href: "https://api.syraa.fun/said/status",
        },
        {
          icon: ShieldCheck,
          title: "Trust gating",
          description: "GET /said/trust/:wallet for fast trust tier checks before sensitive actions.",
        },
        {
          icon: Fingerprint,
          title: "Agent lookup",
          description: "GET /said/verify/:wallet returns full verification + reputation payload.",
        },
        {
          icon: Bot,
          title: "Identity stack",
          description: "SAID complements 8004 registry and AgentScore Passport — commerce + compliance + trust.",
        },
        {
          icon: Globe,
          title: "Cross-platform",
          description: "SAID identity persists across wallet rotations via multi-wallet support.",
          href: "https://www.saidprotocol.com/docs",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "For builders",
      headline: "Trust you can verify",
      stats: [
        { value: "✓", label: "Verified badge" },
        { value: "4", label: "Runtime endpoints" },
        { value: "402", label: "Commerce unchanged" },
      ],
      narrative:
        "Platforms can gate token launches, escrow, and agent marketplaces on SAID verification without building identity infrastructure from scratch. Syra ships the adapter — you query /said/trust/:wallet.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Syra is SAID-verified.",
      subline: "Check our profile on SAID Protocol or query /said/status from the API.",
      links: [
        { label: "SAID profile", value: "saidprotocol.com/agents", href: "https://www.saidprotocol.com/agents/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t" },
        { label: "SAID docs", value: "saidprotocol.com/docs", href: "https://www.saidprotocol.com/docs" },
        { label: "Syra API", value: "api.syraa.fun/said/status", href: "https://api.syraa.fun/said/status" },
      ],
    },
  ],
};
