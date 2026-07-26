import { Network, Shield, Terminal, Wallet, Zap, Layers } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: GoPlausible expands from Algorand-only to Solana + Base Labs failover.
 */
export const GOPLAUSIBLE_SOLANA_BASE_FAILOVER_POST = defineVideoUpdate(
  {
    updateNumber: 39,
    id: "goplausible-solana-base-failover",
    title: "GoPlausible Solana + Base",
    published: "July 2026",
    tagline:
      "Labs x402 on Solana and Base now fails over Dexter → GoPlausible → PayAI, same partner that already settles Algorand.",
    shareCopyVideo: `SHIP LOG · GoPlausible just leveled up on Syra.

Algorand was step one. Solana + Base failover is step two.

Labs payments now chain:
Dexter → GoPlausible → PayAI

When Dexter's fee payer runs dry, GoPlausible picks up Solana and Base. Agents keep paying. Intelligence keeps flowing.

→ Same facilitator.goplausible.xyz
→ Exact scheme on Solana + Base
→ Automatic, no client changes

Resilience is a product feature.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · GoPlausible on Solana + Base.

Labs x402 failover: Dexter → GoPlausible → PayAI.
Algorand still settles via GoPlausible AVM.

One partner. Three chains. Zero downtime drama.

Try → syraa.fun/labs`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-hero-type",
      label: "Cover",
      eyebrow: "Ship log",
      title: "GoPlausible × Solana + Base",
      subtitle:
        "Labs x402 now fails over through GoPlausible when Dexter is unhealthy, Solana and Base stay payable.",
      badge: "Failover · Solana · Base",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-highlight-line",
      label: "Context",
      kicker: "Why this matters",
      headline: "A single facilitator is a single point of payment failure.",
      body: "Labs Exact SVM payments depend on a healthy fee payer. When Dexter runs low on SOL, every Solana settle can fail with InsufficientFundsForRent. Agents should not lose access because one sponsor wallet is dry.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-masonry",
      label: "Shipped",
      kicker: "What we built",
      headline: "Three-rail offer-time failover",
      body: "GoPlausible already verifies Algorand for Syra. Now the same facilitator backs Solana and Base as the middle hop when Dexter is unhealthy, before falling back to PayAI.",
      highlights: [
        "Dexter → GoPlausible → PayAI on Labs Solana/Base",
        "Live /supported: Solana mainnet + Base exact",
        "Fee-payer health probes (fail open on RPC blips)",
        "Algorand AVM path unchanged",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-arrow-chain",
      label: "Flow",
      kicker: "How failover works",
      headline: "Healthy first. Then next rail.",
      steps: [
        {
          step: "01",
          title: "Probe Dexter",
          description: "Solana fee-payer balance or Base /supported for eip155:8453.",
        },
        {
          step: "02",
          title: "Offer Dexter accepts",
          description: "If healthy, 402 lists Dexter's Exact SVM / EVM offers.",
        },
        {
          step: "03",
          title: "Else GoPlausible",
          description: "Same merchant payTo, GoPlausible fee payer sponsors Solana gas.",
        },
        {
          step: "04",
          title: "Else PayAI",
          description: "Final rail so Labs never ships a dead checkout.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-mosaic",
      label: "Stack",
      kicker: "What users get",
      headline: "Resilience you feel as uptime",
      cards: [
        {
          title: "Solana",
          subtitle: "Exact SVM",
          detail: "GoPlausible fee payer 8a8fFN… when Dexter is underfunded.",
          accent: "gold",
        },
        {
          title: "Base",
          subtitle: "eip155:8453",
          detail: "Exact EVM USDC when Dexter /supported drops Base.",
          accent: "gold",
        },
        {
          title: "Algorand",
          subtitle: "Still AVM",
          detail: "GoPlausible continues to verify + settle USDC ASA on mainnet.",
        },
        {
          title: "Automatic",
          subtitle: "Offer-time",
          detail: "Clients pick the accept they get, no new headers required.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-orbit",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Labs stays paid. Agents keep calling.",
      items: [
        {
          icon: Zap,
          title: "Labs /insights/*",
          description: "Solana and Base offers rotate by facilitator health.",
          href: "https://www.syraa.fun/labs",
        },
        {
          icon: Shield,
          title: "Health probes",
          description: "Cached fee-payer + /supported checks warm on boot.",
        },
        {
          icon: Network,
          title: "Multi-facilitator",
          description: "Dexter primary · GoPlausible mid · PayAI last resort.",
        },
        {
          icon: Wallet,
          title: "Same payTo",
          description: "Merchant wallets unchanged, only the sponsor rail switches.",
        },
        {
          icon: Terminal,
          title: "Playground",
          description: "Paid routes still return standard x402 v2 accepts.",
          href: "https://www.syraa.fun/playground",
        },
        {
          icon: Layers,
          title: "Algorand intact",
          description: "AVM accepts still append via GoPlausible facilitator.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-duo",
      label: "Impact",
      kicker: "Why ship this",
      headline: "Uptime is a payment feature.",
      stats: [
        { value: "3", label: "Facilitator rails" },
        { value: "2", label: "New chains on GP" },
        { value: "0", label: "Client changes" },
      ],
      narrative:
        "GoPlausible is no longer Algorand-only on Syra. Labs Solana and Base inherit a second healthy sponsor before PayAI, so underfunded Dexter fee payers do not strand agent traffic.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-banner",
      label: "Try it",
      headline: "One partner. Three chains. Failover built in.",
      subline: "Hit Labs on Solana or Base, payment rails choose themselves.",
      links: [
        { label: "Labs", value: "syraa.fun/labs", href: "https://www.syraa.fun/labs" },
        {
          label: "GoPlausible",
          value: "facilitator docs",
          href: "https://facilitator.goplausible.xyz/docs",
        },
        {
          label: "Supported",
          value: "live networks",
          href: "https://facilitator.goplausible.xyz/supported",
        },
      ],
    },
  ],
);
