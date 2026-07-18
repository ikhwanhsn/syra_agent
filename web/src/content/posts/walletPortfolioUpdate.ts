import { Layers, PieChart, RefreshCw, Wallet } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: Agent wallet Portfolio tab on /wallet.
 */
export const WALLET_PORTFOLIO_POST: PostUpdate = {
  meta: {
    updateNumber: 7,
    id: "wallet-portfolio-tab",
    title: "Agent Wallet Portfolio",
    published: "June 2026",
    tagline: "See every token your agent wallets hold in one portfolio view",
    shareCopyVideo: `SHIP LOG · Wallets just got a Portfolio tab.

Your agent treasuries are not just SOL and USDC anymore. Open Wallets → Portfolio to see every SPL token across Chat and LP wallets, total USD value, and per-token allocation.

→ Treasuries + Portfolio tabs on /wallet
→ All wallets, Chat, or LP filters
→ Real token names, logos, and live USD prices
→ Hide dust, refresh on demand, Solscan links

Fund agents, let them trade, then audit the full bag in one place.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Agent Wallet Portfolio is live on Syra.

Wallets page now has a Portfolio tab. See every token your Chat and LP agent wallets hold, with USD value and allocation %.

Treasuries for funding. Portfolio for the full picture.

Try it → syraa.fun/wallet?view=portfolio`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-minimal",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Wallet Portfolio",
      subtitle: "A new Portfolio tab on Wallets shows every token your agent treasuries hold, with live USD value.",
      badge: "Portfolio · Chat + LP",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Treasuries show funding. Portfolio shows the bag.",
      body: "Agent wallets accumulate SOL, USDC, memecoins, and swap leftovers as agents trade and receive tokens. Treasuries tracked balances for operations. Portfolio answers what you actually own across every agent wallet.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "Portfolio tab on the Wallets page",
      body: "Switch between Treasuries and Portfolio without leaving /wallet. Portfolio loads full SPL holdings from server-side Solana RPC, enriches names and prices, and merges Chat + LP into one view.",
      highlights: [
        "Treasuries · Portfolio segmented tabs with shareable URL",
        "Total portfolio value hero with asset count",
        "Per-token row: logo, symbol, balance, USD value, allocation %",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "From connect to full holdings",
      steps: [
        {
          step: "01",
          title: "Open Wallets",
          description: "Connect your Solana wallet and open /wallet from the nav menu.",
        },
        {
          step: "02",
          title: "Switch to Portfolio",
          description: "Tap Portfolio next to Treasuries. URL persists as ?view=portfolio for sharing.",
        },
        {
          step: "03",
          title: "Filter wallets",
          description: "View All wallets, Chat only, or LP only. Wallet pills show where each token lives.",
        },
        {
          step: "04",
          title: "Audit and refresh",
          description: "Hide dust under $0.01, refresh balances, and open Solscan for any mint.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-row",
      label: "Features",
      kicker: "Under the hood",
      headline: "Built for real agent wallets",
      cards: [
        {
          title: "Multi-source metadata",
          subtitle: "Names that stick",
          detail: "DexScreener, Jupiter, pump.fun, Tokens.xyz, and on-chain Metaplex metadata.",
          accent: "gold",
        },
        {
          title: "Live USD pricing",
          subtitle: "Portfolio total",
          detail: "DEX liquidity quotes plus SOL/USDC anchors so value and allocation % stay current.",
          accent: "gold",
        },
        {
          title: "Readable balances",
          subtitle: "No sci notation",
          detail: "Micro amounts use zero-subscript formatting. Hover for full precision.",
        },
        {
          title: "Dust filter",
          subtitle: "< $0.01",
          detail: "Toggle to focus on meaningful positions without cluttering the list.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "One page, two lenses",
      items: [
        {
          icon: Wallet,
          title: "Treasuries tab",
          description: "Total USDC/SOL, billing spend, deposit and withdraw flows for Chat and LP wallets.",
          href: "https://www.syraa.fun/wallet",
        },
        {
          icon: PieChart,
          title: "Portfolio tab",
          description: "Full SPL holdings, USD value, allocation bars, and per-wallet filters.",
          href: "https://www.syraa.fun/wallet?view=portfolio",
        },
        {
          icon: Layers,
          title: "All wallets view",
          description: "Merged holdings across Chat and LP with wallet badges on each row.",
        },
        {
          icon: RefreshCw,
          title: "Refresh control",
          description: "On-demand portfolio reload without reloading the page.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "For operators",
      headline: "Know what your agents hold",
      stats: [
        { value: "2", label: "Wallet filters (Chat · LP)" },
        { value: "5+", label: "Metadata sources" },
        { value: "1", label: "Merged portfolio view" },
      ],
      narrative:
        "Agents trade, receive airdrops, and sweep tokens. Portfolio gives you the same clarity a funded trading desk expects: names, balances, USD value, and links to verify on-chain.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Try it",
      headline: "Open Portfolio on Wallets today.",
      subline: "Connect, fund your agents, then switch to Portfolio to see the full holdings picture.",
      links: [
        { label: "Wallets", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet" },
        { label: "Portfolio", value: "?view=portfolio", href: "https://www.syraa.fun/wallet?view=portfolio" },
        { label: "Settings", value: "Agent wallets", href: "https://www.syraa.fun/settings" },
      ],
    },
  ],
};
