import { Bot, Coins, Layers, Network, Shield, Wallet } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Celo Agentic Payments & DeFAI Hackathon — x402 self-settle + ERC-8021 tags + ERC-8004.
 */
export const CELO_AGENTIC_PAYMENTS_POST = defineVideoUpdate(
  {
    updateNumber: 24,
    id: "celo-agentic-payments-defai",
    title: "Celo Agentic Payments",
    published: "July 2026",
    tagline:
      "Labs x402 on Celo mainnet — self-settled USDC with ERC-8021 attribution for Most Revenue + Most x402 Payments",
    shareCopyVideo: `I am building for the @CeloDevs Agent Hackathon

Working on: Syra — agentic x402 payments with tagged Celo volume for Most Revenue + Most x402 Payments.

→ Labs Celo tab: payers → insights → self-settle USDC
→ ERC-8021 attribution on every settle + refund
→ ERC-8004 identity on Celo → 8004scan.io/agents/celo/9673

Registered onchain. Let's go! @celo

Full breakdown in the video ↓`,
    shareCopyPhoto: `BUILDING ON CELO · Syra for the @CeloDevs Agentic Payments & DeFAI Hackathon.

x402 USDC on Celo mainnet with self-settlement and ERC-8021 tags so revenue + payment count climb the Dune leaderboard.

→ Tracks: Most Revenue Generated + Most x402 Payments
→ Agent identity: 8004scan.io/agents/celo/9673
→ Ops surface: syraa.fun/labs (Celo tab)

@celo Let's go.`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Celo × Syra",
      subtitle:
        "Agentic x402 payments on Celo mainnet — tagged USDC volume for the Agentic Payments & DeFAI Hackathon.",
      badge: "x402 · ERC-8021 · 8004",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Hackathon volume only counts when every tx carries your tag.",
      body: "Celo’s Agentic Payments & DeFAI Hackathon ranks Most Revenue and Most x402 Payments from Dune — but only transfers with your locked ERC-8021 attribution suffix. Syra self-settles Exact EIP-3009 USDC and appends that tag on settle and refund.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "Celo Labs x402 engine + on-chain identity",
      body: "A third Labs rail beside Solana and Base: Celo wallets, ExactEvmScheme payers, self-settlement via the Celo facilitator profile, tagged refunds, and ERC-8004 agent #9673 on Celo.",
      highlights: [
        "Self-settle transferWithAuthorization + ERC-8021 dataSuffix",
        "Labs → Celo tab: wallets, deposit, simulate, schedule",
        "ERC-8004 Syra agent on Celo Identity Registry",
        "Tracks: Most Revenue Generated + Most x402 Payments",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "Payer → 402 → settle tagged → unlock",
      steps: [
        {
          step: "01",
          title: "Fund Celo lab wallet",
          description: "Deposit CELO gas + USDC. Create payers on the Labs Celo tab.",
        },
        {
          step: "02",
          title: "Hit paid /insights",
          description: "Scheduler or sim sends x-lab-x402-chain: celo to Syra APIs.",
        },
        {
          step: "03",
          title: "Self-settle USDC",
          description: "EIP-3009 auth verified; settler submits tagged transferWithAuthorization.",
        },
        {
          step: "04",
          title: "Optional tagged refund",
          description: "Lab refunds also append the same ERC-8021 suffix for clean loops.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-row",
      label: "Stack",
      kicker: "Celo surface",
      headline: "Mainnet checkout stack",
      cards: [
        {
          title: "Network",
          subtitle: "eip155:42220",
          detail: "Celo mainnet · forno.celo.org · USDC native rail.",
          accent: "gold",
        },
        {
          title: "Asset",
          subtitle: "USDC",
          detail: "Exact EIP-3009 micropayments on Celo USDC.",
          accent: "gold",
        },
        {
          title: "Settle",
          subtitle: "Self-settle",
          detail: "Syra settler + api.x402.celo.org verify path.",
        },
        {
          title: "Attribution",
          subtitle: "ERC-8021",
          detail: "Locked hackathon tag on every settle and refund.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across Syra + Celo",
      items: [
        {
          icon: Layers,
          title: "Labs · Celo",
          description: "Wallets, deposit, simulation, and scheduled x402 volume.",
          href: "https://www.syraa.fun/labs",
        },
        {
          icon: Wallet,
          title: "PayTo wallet",
          description: "Merchant receive address for Exact USDC on Celo.",
        },
        {
          icon: Shield,
          title: "ERC-8004",
          description: "On-chain agent identity — Syra #9673 on Celo.",
          href: "https://8004scan.io/agents/celo/9673",
        },
        {
          icon: Coins,
          title: "Leaderboard",
          description: "Tagged volume scored on the Celo Dune dashboard.",
          href: "https://dune.com/celo/agentic-payments-defai-hackathon",
        },
        {
          icon: Bot,
          title: "Agent payers",
          description: "Lab wallets pay ExactEvmScheme on eip155:42220.",
        },
        {
          icon: Network,
          title: "Multi-chain Labs",
          description: "Solana · Base · Celo — same Labs ops model.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "Hackathon proof",
      headline: "Registered. Tagged. Shipping volume.",
      stats: [
        { value: "9673", label: "ERC-8004 agent ID" },
        { value: "2", label: "Prize tracks" },
        { value: "8021", label: "Attribution on settle" },
      ],
      narrative:
        "Project Syra is registered on celobuilders with attribution locked. Agent identity is live on 8004scan. Every Labs Celo settlement appends the ERC-8021 suffix so Most Revenue and Most x402 Payments can count.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Try it",
      headline: "Building on Celo. Tagged payments. Same Syra brain.",
      subline: "Open Labs → Celo. Fund. Run volume. Watch the Dune board.",
      links: [
        { label: "Labs", value: "syraa.fun/labs", href: "https://www.syraa.fun/labs" },
        { label: "8004scan", value: "agents/celo/9673", href: "https://8004scan.io/agents/celo/9673" },
        {
          label: "Hackathon",
          value: "Dune leaderboard",
          href: "https://dune.com/celo/agentic-payments-defai-hackathon",
        },
      ],
    },
  ],
);
