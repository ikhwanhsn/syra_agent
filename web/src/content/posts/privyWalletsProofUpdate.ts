import { Bot, MessageCircle, ShieldCheck, Wallet, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Privy dashboard proof flex for Syra agent wallets.
 * Numbers from Privy Overview (Aug 2026): 4,333 wallets · 150 users · $501 assets.
 */
export const PRIVY_WALLETS_PROOF_POST = defineVideoUpdate(
  {
    updateNumber: 45,
    id: "privy-wallets-proof",
    title: "Agent Wallets on Privy",
    published: "August 2026",
    tagline:
      "Syra agent wallets run on Privy. 4,333 wallets provisioned, 150 users, $501 in assets. Login, fund, pay per call.",
    shareCopyVideo: `SHIP LOG · Syra agent wallets on Privy.

4,333 wallets. 150 users. $501 in assets.

Login creates a ready-to-spend agent wallet. Custody stays on Privy. Settlement stays x402 USDC.

syraa.fun/chat`,
    shareCopyPhoto: `SHIP LOG · Syra agent wallets on Privy.

4,333 wallets. 150 users. $501 in assets.

Agents need a wallet before they can pay. Syra provisions that on Privy so chat, Telegram, and Spend share the same custody path.

syraa.fun/chat`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-spotlight",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Agent wallets on Privy",
      subtitle:
        "Syra provisions ready-to-spend agent wallets on Privy. Login once. Fund. Pay per call with x402.",
      badge: "Privy · Wallets · Live",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agents need a wallet before they can pay.",
      body: "Paid intelligence is useless if the agent has no address. Syra uses Privy so every user gets an agent wallet that can hold USDC and settle x402 calls across chat, Telegram, and Spend.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-checklist",
      label: "Shipped",
      kicker: "What is live",
      headline: "Custody that matches the product",
      body: "Privy backs Syra agent wallets end to end. Users connect, get an address, fund it, and spend on paid tools without rewriting custody per surface.",
      highlights: [
        "Privy login and embedded agent wallets",
        "Same custody path for chat, Telegram, and Spend",
        "x402 USDC settlement after the wallet is funded",
        "Dashboard proof: wallets, users, and assets in one view",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-pipeline",
      label: "Flow",
      kicker: "How it works",
      headline: "Login → wallet → fund → pay",
      steps: [
        {
          step: "01",
          title: "Connect",
          description: "Log in with Privy on syraa.fun or start the Telegram bot.",
        },
        {
          step: "02",
          title: "Wallet ready",
          description: "Syra provisions an agent address under Privy custody.",
        },
        {
          step: "03",
          title: "Fund",
          description: "Deposit USDC (and a little SOL when needed) into the agent treasury.",
        },
        {
          step: "04",
          title: "Pay per call",
          description: "Spend tools settle with x402. Same wallet across surfaces.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-row",
      label: "Features",
      kicker: "What users get",
      headline: "Three pillars of the wallet stack",
      cards: [
        {
          title: "Custody",
          subtitle: "Privy",
          detail: "Embedded agent wallets. Keys stay with Privy custody, not a DIY key dump.",
          accent: "gold",
        },
        {
          title: "Surfaces",
          subtitle: "Multi",
          detail: "Chat, Telegram, and Spend share the same agent address path.",
          accent: "gold",
        },
        {
          title: "Settlement",
          subtitle: "x402",
          detail: "Fund once. Agents micropay USDC per paid intelligence call.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Where wallets show up",
      headline: "One custody path. Many doors.",
      items: [
        {
          icon: Bot,
          title: "Agent chat",
          description: "Connect on syraa.fun/chat and spend from the agent wallet.",
          href: "https://www.syraa.fun/chat",
        },
        {
          icon: MessageCircle,
          title: "Telegram",
          description: "/start provisions a walleted agent in chat.",
          href: "https://t.me/syra_trading_bot",
        },
        {
          icon: Wallet,
          title: "Wallet page",
          description: "See address, balances, and funding options.",
          href: "https://www.syraa.fun/wallet",
        },
        {
          icon: Zap,
          title: "Spend / marketplace",
          description: "Paid tools settle x402 against the same treasury.",
          href: "https://www.syraa.fun/marketplace",
        },
        {
          icon: ShieldCheck,
          title: "Privy custody",
          description: "Dashboard-backed wallet count and asset totals.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "Privy Overview",
      headline: "Wallets ready to spend",
      stats: [
        { value: "4,333", label: "Wallets" },
        { value: "150", label: "Users" },
        { value: "$501", label: "Assets" },
      ],
      narrative:
        "Privy Overview as of early August 2026. Agent wallets scale faster than human logins because Syra provisions wallets for the product surfaces that need them.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "CTA",
      kicker: "Next step",
      headline: "Get an agent wallet. Then spend.",
      subline: "Connect on chat, fund USDC, and run a paid call. Custody stays Privy. Settlement stays x402.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        { label: "Wallet", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet" },
        {
          label: "Marketplace",
          value: "syraa.fun/marketplace",
          href: "https://www.syraa.fun/marketplace",
        },
      ],
    },
  ],
);
