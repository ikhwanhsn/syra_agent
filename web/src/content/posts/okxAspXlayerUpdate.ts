import { Bot, Coins, Globe, Store, TrendingUp, Wallet, Zap } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: OKX.AI ASP registration + X Layer x402 + $SYRA revenue flywheel.
 */
export const OKX_ASP_XLAYER_POST: PostUpdate = {
  meta: {
    updateNumber: 21,
    id: "okx-asp-xlayer",
    title: "OKX ?- Syra ASP",
    published: "June 2026",
    tagline: "Official OKX.AI ASP, X Layer x402, and a $SYRA buyback flywheel tied to agent payments",
    shareCopyVideo: `SHIP LOG · Syra just joined the OKX agent economy.

Official ASP on OKX.AI. X Layer x402 live. Every paid call feeds the $SYRA flywheel.

? ASP #2311 on X Layer: A2MCP + A2A services listed
? OKX Agentic Wallets pay USDT per API call (x402)
? ~80% of x402 revenue ? programmatic $SYRA buybacks for airdrops
? 28+ intelligence APIs + Syra Brain research agent

More OKX agents using Syra = more real demand for $SYRA.

Full breakdown in the video ?`,
    shareCopyPhoto: `SHIP LOG · Syra is an OKX.AI Agent Service Provider.

ASP #2311. X Layer x402 live. Every micropayment feeds $SYRA buybacks.

OKX agents discover Syra ? pay USDT per call ? revenue buys $SYRA for holder airdrops.

Machine money meets machine demand.

? syraa.fun`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Syra ?- OKX",
      subtitle: "Official ASP on OKX.AI. X Layer x402. Every agent payment fuels the $SYRA flywheel.",
      badge: "ASP #2311 · X Layer · buyback",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-centered",
      label: "Thesis",
      kicker: "Why $SYRA",
      headline: "OKX-scale distribution. Usage-backed token demand.",
      body: "OKX Agentic Wallets are built to pay agents per task. Syra is now listed as an ASP with 28+ paid APIs and a research brain. Every USDT settlement on X Layer routes into programmatic $SYRA buybacks. Demand from real agent usage, not narrative alone.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-checklist",
      label: "Shipped",
      kicker: "What we built",
      headline: "OKX marketplace + X Layer rails",
      body: "On-chain ASP identity, OKX Payment SDK settlement, and marketplace services submitted for OKX review. Agents can discover and pay Syra inside the OKX economy.",
      highlights: [
        "ASP Agent #2311 on X Layer (ERC-8004)",
        "A2MCP: Syra x402 Crypto API · api.syraa.fun",
        "A2A: Syra Brain Research · negotiated deep dives",
        "OKX facilitator verify/settle on eip155:196 USDT0",
      ],
    },
    {
      id: "flywheel",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flywheel",
      kicker: "$SYRA demand loop",
      headline: "Pay ? revenue ? buyback ? airdrop",
      steps: [
        {
          step: "01",
          title: "OKX agent discovers Syra",
          description: "ASP listing on OKX.AI surfaces paid crypto intelligence to Agentic Wallets.",
        },
        {
          step: "02",
          title: "USDT micropayment",
          description: "Wallet pays on X Layer via x402. No API keys. HTTP 402 native checkout.",
        },
        {
          step: "03",
          title: "Intelligence delivered",
          description: "Signals, news, brain research, OpenRouter APIs. Per-call machine money.",
        },
        {
          step: "04",
          title: "$SYRA buyback",
          description: "~80% of production revenue swaps to $SYRA via Jupiter. Pooled for community airdrops.",
        },
      ],
    },
    {
      id: "token",
      kind: "cards",
      layout: "cards-row",
      label: "Token",
      kicker: "Holder upside",
      headline: "Four reasons agents and holders align",
      cards: [
        {
          title: "Usage demand",
          subtitle: "Real buy pressure",
          detail: "Every OKX agent payment adds x402 revenue. Revenue buys $SYRA on-chain.",
          accent: "gold",
        },
        {
          title: "Airdrop pool",
          subtitle: "Community share",
          detail: "Buybacks accumulate for holder airdrops. Value flows back to ecosystem.",
          accent: "gold",
        },
        {
          title: "Stake discounts",
          subtitle: "Pay less per call",
          detail: "Lock $SYRA for tiered x402 discounts. Holders use more, agents pay less.",
          accent: "gold",
        },
        {
          title: "First mover",
          subtitle: "OKX ASP",
          detail: "Early positioning on OKX.AI before marketplace approval goes public.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where it lives",
      headline: "OKX agents meet Syra intelligence",
      items: [
        {
          icon: Store,
          title: "OKX.AI marketplace",
          description: "ASP #2311: A2MCP API catalog + A2A Brain research. Listing under OKX review.",
          href: "https://www.okx.ai",
        },
        {
          icon: Zap,
          title: "X Layer x402",
          description: "USDT0 on eip155:196 via OKX facilitator. Agentic Wallet native checkout.",
        },
        {
          icon: Bot,
          title: "28+ paid APIs",
          description: "News, signals, memecoin intel, BTC hub, OpenRouter chat/image/video.",
          href: "https://www.syraa.fun/playground",
        },
        {
          icon: Coins,
          title: "$SYRA flywheel",
          description: "Production x402 revenue ? Jupiter buyback ? airdrop pool for holders.",
        },
        {
          icon: Wallet,
          title: "Agent wallets",
          description: "Treasury, policy, and auto-pay for autonomous agents on Solana + EVM.",
          href: "https://www.syraa.fun/wallet",
        },
        {
          icon: Globe,
          title: "Multi-rail x402",
          description: "Solana, Base, BSC, Algorand, PayAI networks. Plus OKX X Layer for OKX users.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Numbers",
      headline: "Agent economy ?- token utility",
      stats: [
        { value: "#2311", label: "OKX ASP ID" },
        { value: "28+", label: "Paid APIs" },
        { value: "~80%", label: "Revenue ? buyback" },
      ],
      narrative:
        "OKX brings wallet distribution. Syra brings paid intelligence. $SYRA captures the value of every call. Stake for discounts, hold for the airdrop flywheel.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Position",
      headline: "OKX agents pay. $SYRA holders win.",
      subline: "Get positioned before ASP listing goes live. Stake. Use the playground. Ride usage-backed demand.",
      links: [
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "$SYRA", value: "Token & staking", href: "https://www.syraa.fun" },
        { label: "OKX.AI", value: "Agent marketplace", href: "https://www.okx.ai" },
      ],
    },
  ],
};
