import { CreditCard, Coins, Shield, Wallet, Zap, ArrowRight } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Crossmint card → USDC into Syra agent wallets (activation onramp).
 */
export const CROSSMINT_ONRAMP_POST = defineVideoUpdate(
  {
    updateNumber: 41,
    id: "crossmint-onramp",
    title: "Crossmint Onramp",
    published: "July 2026",
    tagline:
      "Buy USDC with a card. Fund your Syra agent wallet in minutes. Then pay for APIs per call.",
    shareCopyVideo: `SHIP LOG · Card to USDC on Syra.

You no longer need crypto already in a wallet to start. Buy USDC with a card, land it on your Syra agent treasury, then run paid Spend calls.

→ Buy USDC with card on syraa.fun/wallet
→ Funds go to your existing agent address (Privy custody unchanged)
→ Agents still pay Syra with x402, not with a card per API call

Full breakdown in the video.`,
    shareCopyPhoto: `SHIP LOG · Buy USDC with a card on Syra.

Open your agent wallet, tap Buy USDC, pay with card, then call paid tools. Manual transfer still works if you already hold USDC.

syraa.fun/wallet`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Syra × Crossmint",
      subtitle:
        "Buy USDC with a card. Fund your agent. Start paying for crypto intelligence in minutes.",
      badge: "Onramp · Wallet · x402",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "The hardest step was getting USDC, not calling the API.",
      body: "New builders stalled at Fund wallet. Crossmint lets you buy USDC with a card and send it straight to your Syra agent treasury. Your wallet stack stays the same. Syra still settles paid calls with x402.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "Card checkout on the wallet page",
      body: "A Buy USDC with card flow on syraa.fun/wallet. Orders create on the server, checkout embeds Crossmint, and delivery targets your existing agent address.",
      highlights: [
        "Card / Apple Pay style checkout via Crossmint",
        "USDC lands on your Syra agent treasury",
        "Manual Deposit transfer still available",
        "Privy custody unchanged. No wallet rewrite",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "Card → USDC → first paid call",
      steps: [
        {
          step: "01",
          title: "Open your agent wallet",
          description: "Go to syraa.fun/wallet and pick a treasury (Spend is the usual one).",
        },
        {
          step: "02",
          title: "Buy USDC with card",
          description: "Enter email and amount (from $10). Complete Crossmint checkout and KYC if asked.",
        },
        {
          step: "03",
          title: "Refresh balance",
          description: "USDC shows on the agent address. Deposit remains available for existing crypto.",
        },
        {
          step: "04",
          title: "Call a paid API",
          description: "MCP, SDK, or marketplace. Agents pay Syra per call with x402 USDC.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-row",
      label: "Stack",
      kicker: "What each piece does",
      headline: "Simple roles. Clear money path.",
      cards: [
        {
          title: "You",
          subtitle: "Fund",
          detail: "Buy USDC with a card when you need to top up.",
          accent: "gold",
        },
        {
          title: "Crossmint",
          subtitle: "Onramp",
          detail: "Handles card payment and delivers USDC to your agent address.",
          accent: "gold",
        },
        {
          title: "Syra wallet",
          subtitle: "Treasury",
          detail: "Same Privy / agent address you already use for Spend.",
        },
        {
          title: "x402",
          subtitle: "Pay per call",
          detail: "Agents settle tiny USDC payments for each API call.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where to try it",
      headline: "Live on Syra today",
      items: [
        {
          icon: Wallet,
          title: "Agent wallet",
          description: "Buy USDC with card next to Deposit.",
          href: "https://www.syraa.fun/wallet",
        },
        {
          icon: CreditCard,
          title: "Card checkout",
          description: "Crossmint embedded onramp. Staging first, then production.",
        },
        {
          icon: Zap,
          title: "Marketplace",
          description: "After funding, run a paid Spend call from the catalog.",
          href: "https://www.syraa.fun/marketplace",
        },
        {
          icon: Coins,
          title: "Manual deposit",
          description: "Still send USDC yourself if you already hold it.",
        },
        {
          icon: Shield,
          title: "Same custody",
          description: "Privy stays. Crossmint is funding only, not a new wallet login.",
        },
        {
          icon: ArrowRight,
          title: "Docs",
          description: "Crossmint Base agents can also pay Syra over x402.",
          href: "https://docs.syraa.fun/docs/build/crossmint-x402",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Activation",
      headline: "Fewer steps between signup and first paid call.",
      stats: [
        { value: "$10+", label: "Typical card pack" },
        { value: "1 tap", label: "Buy USDC on /wallet" },
        { value: "0", label: "Custody rewrite" },
      ],
      narrative:
        "Keep the zero-KYC path (send USDC yourself). Use card when you want speed. Agents still micropay with x402 after the wallet is funded.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "Fund with a card. Call an API.",
      subline:
        "Open your agent wallet, buy USDC with a card, then hit a paid Spend route. Manual transfer still works.",
      links: [
        { label: "Wallet", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet" },
        {
          label: "Marketplace",
          value: "syraa.fun/marketplace",
          href: "https://www.syraa.fun/marketplace",
        },
        {
          label: "Docs",
          value: "Crossmint → Syra",
          href: "https://docs.syraa.fun/docs/build/crossmint-x402",
        },
      ],
    },
  ],
);
