import { Bot, BookOpen, Network, Shield, Terminal, Wallet } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Dexter onchain x402 APIs beyond Labs facilitator settlement.
 */
export const DEXTER_INTEGRATION_POST = defineVideoUpdate(
  {
    updateNumber: 31,
    id: "dexter-integration",
    title: "Dexter Onchain x402",
    published: "July 2026",
    tagline:
      "Beyond Labs facilitator settle — Syra agents call Dexter activity and entity APIs over Solana x402.",
    shareCopyVideo: `SHIP LOG · Syra × Dexter goes deeper.

Facilitator settle was step one. Onchain intel is step two.

→ dexter-onchain-activity · dexter-onchain-entity
→ Free dexter-x402-catalog discovery
→ Agent Solana USDC pays x402.dexter.cash

Trade summaries. Entity insight. Same Syra wallet.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Syra × Dexter onchain x402.

Agents call activity + entity APIs (~$0.05) and browse the free Dexter catalog.
Labs still settles via the Dexter facilitator.

X → x.com/dexteraisol
Try → syraa.fun/chat`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Dexter × Syra",
      subtitle:
        "Solana x402 onchain activity and entity intelligence — plus the facilitator rails Labs already uses.",
      badge: "x402 · Onchain · Catalog",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Settlement rails without market context are half a stack.",
      body: "Syra already settles Labs routes through the Dexter facilitator. Agents still needed Dexter’s paid onchain summaries — trade activity, wallet/token entities, counterparties — so we wired x402.dexter.cash into agent tools.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-split",
      label: "Shipped",
      kicker: "What we built",
      headline: "Facilitator + spend tools",
      body: "Three agent tools sit beside the existing Labs facilitator path: free catalog discovery and two paid onchain routes settled from the agent Solana USDC wallet.",
      highlights: [
        "dexter-x402-catalog — free /.well-known/x402 list",
        "dexter-onchain-activity — trade summaries (~$0.05)",
        "dexter-onchain-entity — token/wallet/trade insight (~$0.05)",
        "Labs facilitator settlement unchanged",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "402 on Dexter. Pay from Syra.",
      steps: [
        {
          step: "01",
          title: "Agent picks a tool",
          description: "Catalog (free) or activity/entity with scope + mint/wallet.",
        },
        {
          step: "02",
          title: "Probe Dexter x402",
          description: "Syra hits x402.dexter.cash and receives Payment Required.",
        },
        {
          step: "03",
          title: "Agent wallet pays",
          description: "Solana USDC settles the Dexter accept offer.",
        },
        {
          step: "04",
          title: "Onchain payload",
          description: "Volumes, counterparties, and entity deltas return to chat.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-row",
      label: "Stack",
      kicker: "Two layers",
      headline: "Settle + intelligence",
      cards: [
        {
          title: "Facilitator",
          subtitle: "Labs",
          detail: "Existing Dexter settle path for Labs x402 routes — unchanged.",
          accent: "gold",
        },
        {
          title: "Activity",
          subtitle: "Spend",
          detail: "Token/wallet/trade summaries with volumes and top counterparties.",
          accent: "gold",
        },
        {
          title: "Entity",
          subtitle: "Spend",
          detail: "Deeper entity insight with SOL/token deltas for scoped queries.",
        },
        {
          title: "Catalog",
          subtitle: "Discover",
          detail: "Free well-known document for agents exploring Dexter resources.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-list",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Agents and Labs share Dexter",
      items: [
        {
          icon: Bot,
          title: "Agent tools",
          description: "dexter-* tools via chat and POST /agent/tools/call.",
        },
        {
          icon: BookOpen,
          title: "Free catalog",
          description: "dexter-x402-catalog lists activity, entity, shield, and more.",
        },
        {
          icon: Wallet,
          title: "Agent wallet",
          description: "Solana USDC pays x402.dexter.cash — same treasury model.",
          href: "https://www.syraa.fun/wallet",
        },
        {
          icon: Shield,
          title: "Labs facilitator",
          description: "Settlement rails for Labs stay on Dexter where already wired.",
          href: "https://www.syraa.fun/labs",
        },
        {
          icon: Network,
          title: "Partner page",
          description: "syraa.fun/partner/dexter for capabilities and X handle.",
          href: "https://www.syraa.fun/partner/dexter",
        },
        {
          icon: Terminal,
          title: "MCP catalog",
          description: "Tools mirrored for Cursor and Claude agent-direct calls.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "Depth",
      headline: "One partner. Two Syra surfaces.",
      stats: [
        { value: "3", label: "Agent tools" },
        { value: "$0.05", label: "Activity / entity" },
        { value: "402", label: "Solana checkout" },
      ],
      narrative:
        "Dexter is no longer only a facilitator. Agents buy onchain context per call while Labs keeps the settle path that already works.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Try it",
      headline: "Call Dexter from a Syra agent.",
      subline: "Start with dexter-x402-catalog, then pay for activity or entity on a mint or wallet.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        { label: "Partner", value: "syraa.fun/partner/dexter", href: "https://www.syraa.fun/partner/dexter" },
        { label: "Dexter", value: "dexter.cash", href: "https://dexter.cash" },
      ],
    },
  ],
);
