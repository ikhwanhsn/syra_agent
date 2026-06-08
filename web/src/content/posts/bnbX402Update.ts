import { Bot, Layers, Terminal, Wallet } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: x402 payments on BNB Smart Chain via Binance B402.
 * Update this file (or swap ACTIVE_POST in index.ts) when publishing the next build update.
 * Slide copy: avoid em dashes; use commas, periods, or colons instead.
 * Give each slide a unique `layout` from layouts.ts (see validatePostUpdate).
 */
export const BNB_X402_POST: PostUpdate = {
  meta: {
    id: "bnb-x402-b402",
    title: "x402 on BNB Smart Chain",
    published: "June 2026",
    tagline: "Binance B402 settlement for Syra intelligence APIs",
    shareCopyVideo: `SHIP LOG · Syra just shipped x402 on BNB Smart Chain.

Binance B402 settlement is live, end to end. Payment Required on BSC, MetaMask signing, verify and settle through Binance's facilitator, wired into the same x402 pipeline as Solana and Base.

→ eip155:56 in every 402 accept
→ USD1, U, USDC, USDT on mainnet
→ Live in Playground, agent wallet, and chat tools

Your agents should not leave their chain to pay for intelligence. Now they do not have to.

Multi-chain treasuries. One Syra brain. Pay per call, not per seat.

Full breakdown in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · x402 is live on BNB Smart Chain through Binance B402.

Syra intelligence APIs now settle natively on BSC. Hit a paid endpoint, get 402, sign with MetaMask, unlock the response. No bridge. No subscription. No compromise.

402 → sign on BSC → intelligence delivered.

3 chains live. 4 BSC stables. HTTP-native micropayments for autonomous agents.

If you build on BNB, this is the stack your agents have been waiting for.`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-spotlight",
      label: "Cover",
      eyebrow: "Ship log",
      title: "x402 on BNB",
      subtitle: "Pay-per-call intelligence APIs now settle on BNB Smart Chain via Binance B402.",
      badge: "B402 · eip155:56",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-accent-bar",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agents don't stop at one chain.",
      body: "Syra already powers autonomous traders on Solana and Base. BNB Smart Chain is one of the largest EVM ecosystems, so our APIs needed native x402 settlement there, not a bridge workaround.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-split",
      label: "Shipped",
      kicker: "What we built",
      headline: "Binance B402 × Syra x402 v2",
      body: "Full merchant inbound on BSC: Payment Required responses, EIP-712 signing in the browser, and verify/settle through Binance's B402 facilitator, wired into the same x402 pipeline as Solana and Base.",
      highlights: [
        "BSC network id eip155:56 in 402 accepts",
        "B402 verify + settle on paid API calls",
        "Micro-unit pricing mapped to 18-decimal BSC stables",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-timeline",
      label: "Flow",
      kicker: "How it works",
      headline: "Four steps. Zero subscriptions.",
      steps: [
        {
          step: "01",
          title: "Call the API",
          description: "Agent or playground hits a paid Syra endpoint, same x402 v2 surface as Solana.",
        },
        {
          step: "02",
          title: "402 + BSC option",
          description: "Server returns Payment Required with a B402 kind: network eip155:56 and your stable (USD1, U, USDC, or USDT).",
        },
        {
          step: "03",
          title: "Sign on BSC",
          description: "Wallet signs EIP-3009 (USD1, U) or Permit2 path (USDC, USDT) via MetaMask on BNB Smart Chain.",
        },
        {
          step: "04",
          title: "Unlock intelligence",
          description: "B402 facilitator verifies and settles; Syra retries the request and returns the paid result.",
        },
      ],
    },
    {
      id: "tokens",
      kind: "cards",
      layout: "cards-bento",
      label: "Tokens",
      kicker: "BSC stables",
      headline: "Four settlement assets on mainnet",
      cards: [
        {
          title: "USD1",
          subtitle: "EIP-3009 · exact",
          detail: "World Liberty Financial USD with gasless-style transfer authorization.",
          accent: "gold",
        },
        {
          title: "U",
          subtitle: "EIP-3009 · exact",
          detail: "United Stables. Same signing flow as USD1 in the playground.",
          accent: "gold",
        },
        {
          title: "USDC",
          subtitle: "Permit2 · exact",
          detail: "BNB-pegged USDC on BSC via Permit2 witness signing path.",
        },
        {
          title: "USDT",
          subtitle: "Permit2 · exact",
          detail: "Tether on BSC. Configurable via B402_TOKEN on the API.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-list",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across the Syra stack",
      items: [
        {
          icon: Terminal,
          title: "API Playground",
          description: "Binance chain tab: pay with MetaMask on BSC and replay 402 → pay → 200 flows.",
          href: "https://www.syraa.fun/playground",
        },
        {
          icon: Wallet,
          title: "Agent wallet",
          description: "BSC chain on agent wallets. Fund and sign B402 payments from the same session.",
          href: "https://www.syraa.fun/wallet",
        },
        {
          icon: Bot,
          title: "Agent chat tools",
          description: "Injected x402 tools call paid partner APIs; BSC options appear when the server advertises B402.",
        },
        {
          icon: Layers,
          title: "x402 v2 core",
          description: "Shared payment middleware for Solana, Base, and BSC/B402 in one verify/settle path.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-featured-stat",
      label: "Impact",
      kicker: "For builders",
      headline: "BNB-native agents, same Syra brain",
      stats: [
        { value: "3", label: "Payment chains live" },
        { value: "4", label: "BSC stable options" },
        { value: "402", label: "HTTP-native micropayments" },
      ],
      narrative:
        "List once on x402 directories, settle where your treasury lives. BNB agents can now pay for Nansen-grade flows, market data, and research tools without leaving their chain.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "Try it on BSC today.",
      subline: "Open the playground, pick Binance, connect MetaMask, and pay only for the calls you need.",
      links: [
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "Docs", value: "B402 · x402 reference", href: "https://docs.syraa.fun/docs/api-reference" },
        { label: "B402 spec", value: "Binance Onchain Pay", href: "https://developers.binance.com/docs/onchainpay-x402/introduction" },
      ],
    },
  ],
};
