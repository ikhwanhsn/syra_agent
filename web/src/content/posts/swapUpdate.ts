import {
  ArrowLeftRight,
  Coins,
  Lock,
  Search,
  Settings,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: Jupiter Swap on /swap under Earn nav — wallet-signed swaps with Syra referral adapter.
 */
export const SWAP_POST: PostUpdate = {
  meta: {
    updateNumber: 16,
    id: "jupiter-swap-earn",
    title: "Jupiter Swap",
    published: "June 2026",
    tagline: "Wallet-signed token swaps at Jupiter prices, now live under Earn on Syra",
    shareCopyVideo: `SHIP LOG · Syra just shipped Jupiter Swap.

Trade any Solana token from your connected wallet — best-route quotes, slippage controls, and instant submit after you sign. Staking and Swap now live together under Earn in the navbar.

→ /swap with Jupiter quote + build adapter on Syra API
→ Sign in Phantom, Privy, Solflare, or Backpack — non-custodial
→ Token search, balances, slippage presets, live quote refresh
→ Syra referral platform fee on routed swaps when configured

Research on Syra. Swap on Syra. Same wallet.

Full walkthrough in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · Jupiter Swap is live on Syra.

Earn in the navbar: Staking + Swap. Connect your wallet, pick tokens, review the quote, sign once, done.

Best routes via Jupiter. Non-custodial. syraa.fun/swap`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-tagline-stack",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Jupiter Swap",
      subtitle:
        "Wallet-signed swaps at Jupiter prices. Earn nav groups Staking and Swap. Connect, quote, sign, submit.",
      badge: "Earn · Jupiter · Non-custodial",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-highlight-line",
      label: "Context",
      kicker: "Why this matters",
      headline: "Research and execution should not need two apps.",
      body: "Syra already surfaces intelligence, agents, and portfolio context. Traders still bounced to external DEX UIs to act on a token. Swap closes the loop: same connected wallet, Jupiter routing, and a premium flow built into the dashboard.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-numbered-cards",
      label: "Shipped",
      kicker: "What we built",
      headline: "Earn section + full swap stack",
      body: "Navbar Earn dropdown groups Staking and Swap. The /swap page ships a production swap card: debounced Jupiter quotes, token picker with verified search, slippage settings, and client-side signing through the wallet you already use on Syra.",
      highlights: [
        "Earn nav: Staking locks + Jupiter Swap in one menu",
        "GET /jupiter/ui/quote · POST /jupiter/ui/swap · GET /jupiter/ui/tokens",
        "Connected wallet signs — Phantom, Privy, Solflare, Backpack",
        "Referral platform fee via Syra backend when configured",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-arrow-chain",
      label: "Flow",
      kicker: "How to swap",
      headline: "Four taps from quote to chain",
      steps: [
        {
          step: "01",
          title: "Open Swap",
          description:
            "Go to Earn → Swap or syraa.fun/swap. Connect the same wallet you use across Syra.",
        },
        {
          step: "02",
          title: "Pick tokens",
          description:
            "Search verified tokens or use presets. Balances load for input mint. Set amount or tap Max.",
        },
        {
          step: "03",
          title: "Review quote",
          description:
            "Live Jupiter quote refreshes with slippage tolerance. Expand details for price impact and route.",
        },
        {
          step: "04",
          title: "Sign and submit",
          description:
            "Syra builds the swap tx server-side. You sign in wallet. Tx broadcasts immediately with Solscan link.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-mosaic",
      label: "Features",
      kicker: "Under the hood",
      headline: "Built for real wallets, not demos",
      cards: [
        {
          title: "Quote adapter",
          subtitle: "Jupiter + referral",
          detail: "Syra API proxies Jupiter with platform feeAccount when JUPITER_REFERRAL_ACCOUNT is set.",
          accent: "gold",
        },
        {
          title: "Token search",
          subtitle: "Verified list",
          detail: "Jupiter Tokens V2 search with lazy scroll, popular presets, and icon bootstrap on load.",
          accent: "gold",
        },
        {
          title: "Slippage control",
          subtitle: "User settings",
          detail: "Preset bps or custom tolerance. Quote debounce + auto-refresh while you edit amount.",
        },
        {
          title: "Fast submit UX",
          subtitle: "Sign → broadcast",
          detail: "UI success on sendRawTransaction. Background confirm with Jupiter lastValidBlockHeight.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Earn lives in the navbar",
      items: [
        {
          icon: Coins,
          title: "Earn menu",
          description: "Navbar dropdown with Staking and Swap. Active state on /staking and /swap routes.",
        },
        {
          icon: ArrowLeftRight,
          title: "Swap page",
          description: "Premium swap card with token picker, quote details, and wallet CTA.",
          href: "https://www.syraa.fun/swap",
        },
        {
          icon: Lock,
          title: "Staking",
          description: "Streamflow locks stay under Earn alongside Swap — one section for yield actions.",
          href: "https://www.syraa.fun/staking",
        },
        {
          icon: Wallet,
          title: "Your wallet",
          description: "Same Privy or external wallet as chat and agents. Non-custodial signing only.",
        },
        {
          icon: Search,
          title: "Dashboard quick action",
          description: "Overview quick action links to /swap for operators jumping from research to trade.",
          href: "https://www.syraa.fun/overview",
        },
        {
          icon: ShieldCheck,
          title: "Free UI routes",
          description: "Quote, swap build, and token search on /jupiter/ui — no x402 required for the swap UI.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "For traders",
      headline: "Act on Syra intelligence in one session",
      stats: [
        { value: "1", label: "Connected wallet" },
        { value: "3", label: "Free UI routes" },
        { value: "0", label: "Custodial keys" },
      ],
      narrative:
        "Read the signal on Assets, check portfolio balances, then swap without leaving Syra or reconnecting a wallet. Jupiter handles routing. Syra handles quote, build, referral, and UX.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Swap any Solana token today.",
      subline: "Open Earn → Swap, connect your wallet, and trade at Jupiter prices with slippage you control.",
      links: [
        { label: "Swap", value: "syraa.fun/swap", href: "https://www.syraa.fun/swap" },
        { label: "Staking", value: "syraa.fun/staking", href: "https://www.syraa.fun/staking" },
        { label: "Overview", value: "syraa.fun/overview", href: "https://www.syraa.fun/overview" },
      ],
    },
  ],
};
