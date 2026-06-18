import { Bot, Globe, Layers, Network, Terminal, Wallet } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: x402 payments on Algorand Mainnet via GoPlausible facilitator.
 */
export const ALGORAND_X402_POST: PostUpdate = {
  meta: {
    updateNumber: 13,
    id: "algorand-x402-goplausible",
    title: "x402 on Algorand",
    published: "June 2026",
    tagline: "Syra intelligence APIs now settle USDC on Algorand Mainnet via GoPlausible",
    shareCopyVideo: `SHIP LOG · Syra just shipped x402 on Algorand Mainnet.

GoPlausible verify + settle is live, end to end. Payment Required on every paid API, USDC ASA transfer, fee abstraction through the facilitator, wired into the same x402 v2 pipeline as Solana, PayAI EVM, and BSC B402.

→ algorand mainnet CAIP-2 in every 402 accept
→ USDC ASA 31566704 · GoPlausible facilitator
→ 402 → sign → verify → settle → 200 validated on /news
→ Agent wallet can pay on Algorand with ALGORAND_AGENT_PRIVATE_KEY

Algorand treasuries should not bridge to pay for intelligence. Now they do not have to.

Built for the Global x402 Challenge. Pay per call. Stay on Algorand.

Full breakdown in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · x402 is live on Algorand Mainnet through GoPlausible.

Syra intelligence APIs now settle USDC on AVM. Hit a paid endpoint, get 402, sign the ASA transfer, unlock the response. Fee payer covered. No bridge. No subscription.

402 → pay USDC on Algorand → intelligence delivered.

Solana · PayAI EVM · BSC B402 · Algorand. One Syra brain.

Try it → syraa.fun/playground`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-gradient-ring",
      label: "Cover",
      eyebrow: "Ship log",
      title: "x402 on Algorand",
      subtitle: "Pay-per-call intelligence APIs now settle USDC on Algorand Mainnet via GoPlausible.",
      badge: "AVM · USDC ASA · Mainnet",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-inverted-panel",
      label: "Context",
      kicker: "Why this matters",
      headline: "Algorand builders should not bridge to pay for APIs.",
      body: "Syra already powers agents on Solana, Base, Polygon, and BSC. Algorand is a top AVM ecosystem for payments and agent wallets. Intelligence APIs needed native x402 settlement there, not a workaround.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-highlight-cards",
      label: "Shipped",
      kicker: "What we built",
      headline: "GoPlausible × Syra x402 v2",
      body: "Full merchant inbound on Algorand Mainnet: Payment Required responses, USDC ASA exact transfers, verify and settle through facilitator.goplausible.xyz, and agent clients that select algorand:* accepts automatically.",
      highlights: [
        "Algorand Mainnet CAIP-2 in every paid 402 response",
        "USDC ASA 31566704 · 6-decimal micropayments",
        "Fee payer abstraction via GoPlausible facilitator",
        "E2E validated: 402 → pay → verify → settle → 200",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-ladder",
      label: "Flow",
      kicker: "How it works",
      headline: "402 → AVM → intelligence.",
      steps: [
        {
          step: "01",
          title: "Call a paid API",
          description: "Playground, agent, or external x402 client hits api.syraa.fun.",
        },
        {
          step: "02",
          title: "402 with Algorand accept",
          description: "Server returns Payment Required with algorand:* network, USDC ASA, and fee payer extra.",
        },
        {
          step: "03",
          title: "Sign USDC transfer",
          description: "Wallet or agent signs the ASA transfer group. GoPlausible covers ALGO fees.",
        },
        {
          step: "04",
          title: "GoPlausible settles",
          description: "Facilitator verifies genesis hash and settles on-chain. Syra returns the paid payload.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-accent-strip",
      label: "Stack",
      kicker: "AVM surface",
      headline: "Algorand-native checkout",
      cards: [
        {
          title: "Network",
          subtitle: "Mainnet CAIP-2",
          detail: "algorand:wGHE2… — genesis hash verified on every settlement.",
          accent: "gold",
        },
        {
          title: "Asset",
          subtitle: "USDC ASA",
          detail: "ASA ID 31566704 · exact scheme · 6-decimal atomic amounts.",
          accent: "gold",
        },
        {
          title: "Facilitator",
          subtitle: "GoPlausible",
          detail: "facilitator.goplausible.xyz — verify, settle, and fee payer sponsorship.",
        },
        {
          title: "Challenge",
          subtitle: "Global x402",
          detail: "Built for the Algorand Global x402 Challenge leaderboard volume.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across the Syra stack",
      items: [
        {
          icon: Terminal,
          title: "API Playground",
          description: "Paid routes show Algorand alongside Solana, PayAI EVM, and B402.",
          href: "https://www.syraa.fun/playground",
        },
        {
          icon: Bot,
          title: "Syra agents",
          description: "X402_PREFERRED_NETWORK=algorand routes agent payments on AVM USDC.",
        },
        {
          icon: Wallet,
          title: "Agent wallet",
          description: "Fund ALGO + opt into USDC ASA. Pay upstream and Syra APIs per call.",
          href: "https://www.syraa.fun/wallet",
        },
        {
          icon: Globe,
          title: "External agents",
          description: "Any x402 v2 client can select the algorand:* accept from 402 offers.",
        },
        {
          icon: Network,
          title: "Multi-rail checkout",
          description: "Solana, PayAI EVM chains, BSC B402, and Algorand in one 402 response.",
        },
        {
          icon: Layers,
          title: "x402 v2 core",
          description: "One payment middleware. Network-aware verify and settle routing.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-spotlight-narrative",
      label: "Impact",
      kicker: "Proof",
      headline: "Mainnet E2E confirmed",
      stats: [
        { value: "402", label: "HTTP-native checkout" },
        { value: "AVM", label: "Algorand exact scheme" },
        { value: "200", label: "Paid /news response" },
      ],
      narrative:
        "We validated the full loop on localhost and mainnet: capabilities show algorand enabled, 402 offers include the AVM accept, payment signs with mainnet genesis hash, GoPlausible verifies and settles, and the resource unlocks.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Algorand-native agents. Same Syra brain.",
      subline: "Open the playground, hit a paid endpoint, and pay USDC on Algorand Mainnet.",
      links: [
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "GoPlausible", value: "AVM x402 docs", href: "https://facilitator.goplausible.xyz/docs" },
        { label: "Challenge", value: "Global x402", href: "https://algorand.co/global-x402-challenge" },
      ],
    },
  ],
};
