import { Bot, Globe, Layers, Network, Terminal, Wallet } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: PayAI facilitator migration. All PayAI x402 networks live on Syra.
 */
export const PAYAI_X402_POST: PostUpdate = {
  meta: {
    updateNumber: 12,
    id: "payai-x402-all-networks",
    title: "PayAI × All Networks",
    published: "June 2026",
    tagline: "Syra now settles x402 across every PayAI-supported network",
    shareCopyVideo: `SHIP LOG · Syra now runs on PayAI across every supported network.

We migrated our x402 facilitator to PayAI and turned on all 16 networks from their stack: Solana, Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, X Layer, plus testnets.

→ PayAI verify + settle on every paid Syra API
→ 8 mainnets in production · 16 networks in dev
→ Agent-to-agent x402 still works on the same rails
→ BSC B402 stays live alongside PayAI

One brain. Every chain PayAI supports. Pay per call.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Syra now uses all PayAI x402 networks.

Paid intelligence APIs settle through facilitator.payai.network on Solana, Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, and X Layer.

402 → pay on your chain → unlock the response. Agents, playground, and external callers on the same stack.

16 PayAI networks. One Syra checkout.

Try it → syraa.fun/playground`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-split",
      label: "Cover",
      eyebrow: "Ship log",
      title: "PayAI × Syra",
      subtitle: "Every PayAI-supported x402 network is live on Syra intelligence APIs.",
      badge: "16 networks · PayAI facilitator",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-centered",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agents should not be limited by one chain or one facilitator.",
      body: "Syra agents, external callers, and the playground all share one x402 surface. PayAI is now our default facilitator, with every network they document enabled so treasuries can pay where they already hold USDC.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-checklist",
      label: "Shipped",
      kicker: "What we built",
      headline: "Full PayAI network coverage",
      body: "Migrated verify and settle to PayAI, aligned USDC assets with their facilitator, and advertise all supported CAIP-2 networks in every 402 Payment Required response.",
      highlights: [
        "Default facilitator: facilitator.payai.network",
        "16 PayAI networks in dev · 8 mainnets in production",
        "Solana + Base + Polygon + Arbitrum + Avalanche + Sei + SKALE + X Layer",
        "Agent-to-agent and external x402 clients unchanged",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "Same x402. More chains.",
      steps: [
        {
          step: "01",
          title: "Call any paid API",
          description: "Playground, Syra agent, or external agent hits a Syra endpoint.",
        },
        {
          step: "02",
          title: "402 with PayAI offers",
          description: "Server returns Payment Required with every enabled PayAI network and USDC asset.",
        },
        {
          step: "03",
          title: "Pay on your chain",
          description: "Wallet or agent signs USDC on Solana, Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, or X Layer.",
        },
        {
          step: "04",
          title: "PayAI settles",
          description: "Facilitator verifies and settles on-chain. Syra returns the paid intelligence payload.",
        },
      ],
    },
    {
      id: "networks",
      kind: "cards",
      layout: "cards-row",
      label: "Networks",
      kicker: "PayAI stack",
      headline: "All documented PayAI networks",
      cards: [
        {
          title: "Solana",
          subtitle: "Mainnet + Devnet",
          detail: "solana:5eykt… · solana:EtWTR…. Agent auto-pay and playground checkout.",
          accent: "gold",
        },
        {
          title: "Core EVM",
          subtitle: "4 mainnets",
          detail: "Base · Polygon · Arbitrum One · Avalanche. Native USDC on each chain.",
          accent: "gold",
        },
        {
          title: "SKALE · Sei · X Layer",
          subtitle: "3 more mainnets",
          detail: "eip155:1187947933 · eip155:1329 · eip155:196. Same EVM payTo, chain-specific USDC.",
        },
        {
          title: "Testnets",
          subtitle: "8 networks",
          detail: "Base Sepolia, Polygon Amoy, Arbitrum Sepolia, Avalanche Fuji, Sei, SKALE, X Layer testnets, Solana Devnet.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across the Syra stack",
      items: [
        {
          icon: Terminal,
          title: "API Playground",
          description: "Every paid route shows multi-network 402 accepts. Pick Solana, Base, or any enabled EVM chain.",
          href: "https://www.syraa.fun/playground",
        },
        {
          icon: Bot,
          title: "Syra agents",
          description: "Agent-to-agent and tool calls use the same PayAI-backed x402 path. Solana auto-pay unchanged.",
        },
        {
          icon: Wallet,
          title: "Agent wallet",
          description: "Fund once, pay upstream and Syra APIs per call. External agents can pay from any offered network.",
          href: "https://www.syraa.fun/wallet",
        },
        {
          icon: Globe,
          title: "External agents",
          description: "Any x402 v2 client can call api.syraa.fun and settle through PayAI on their preferred chain.",
        },
        {
          icon: Network,
          title: "BSC B402",
          description: "Binance B402 on eip155:56 remains alongside PayAI for BNB-native treasuries.",
        },
        {
          icon: Layers,
          title: "x402 v2 core",
          description: "One payment middleware. PayAI default. Corbits opt-in retired as shutdown approaches.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Coverage",
      headline: "Pay where your treasury lives",
      stats: [
        { value: "16", label: "PayAI networks" },
        { value: "8", label: "Mainnets live" },
        { value: "402", label: "HTTP-native checkout" },
      ],
      narrative:
        "Syra intelligence APIs no longer depend on a single facilitator or a narrow chain list. PayAI handles verify and settle; you pick the network that matches your USDC.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Try it",
      headline: "Every PayAI network. One Syra brain.",
      subline: "Open the playground, hit a paid endpoint, and pay on the chain you already use.",
      links: [
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "PayAI docs", value: "Supported networks", href: "https://docs.payai.network/x402/supported-networks" },
        { label: "API docs", value: "x402 reference", href: "https://docs.syraa.fun/docs/api-reference" },
      ],
    },
  ],
};
