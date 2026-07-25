import {
  Activity,
  ExternalLink,
  LineChart,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: x402 settlement health recovery + live traction proof (July 25 2026 metrics).
 */
export const SETTLEMENT_RECOVERY_POST = defineVideoUpdate(
  {
    updateNumber: 43,
    id: "settlement-recovery",
    title: "Settlement Healthy Again",
    published: "July 2026",
    tagline:
      "Settle fail rate dropped from ~62% to 0.03% in 24h. Paid calls, wallets, and rails you can verify on /api/metrics.",
    shareCopyVideo: `SHIP LOG · Settlement is healthy again.

Yesterday settle fail rate was ~62%.
Last 24h: 0.03% fail on 3,370 attempts.
$207 settled. 72 paying wallets in 7d.
61% of eligible payers come back by day 7.

Also shipped this week:
Crossmint card to USDC onramp
Flint market data
OKX Genesis finance surfaces

Proof: syraa.fun + Solscan buyback txs on /token

Builders: syraa.fun/marketplace`,
    shareCopyPhoto: `SHIP LOG · x402 settle fail rate: 0.03% (24h).

Was ~62% yesterday. Now 3,369 paid calls and $207 settled in 24h.
72 paying wallets in 7d. 100% of wallets that saw a 402 converted to paid.

Verify live: api.syraa.fun/api/metrics
Buybacks: syraa.fun/token
Start: syraa.fun/marketplace`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Settlement healthy again",
      subtitle:
        "From ~62% settle fails to 0.03% in 24 hours. Real paid volume. Real wallets. Public metrics.",
      badge: "Proof · x402 · Live",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Broken settle kills trust faster than missing features.",
      body: "Agents will not keep paying if settlement fails. We removed the broken Celo Labs facilitator path, tightened settlement rails, and the 24h fail rate fell from about 62% to 0.03% on 3,370 attempts.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What changed",
      headline: "Trust first. Then keep shipping.",
      body: "Settlement recovery landed alongside activation and partner surfaces so builders can fund, pay, and prove.",
      highlights: [
        "Celo Labs x402 path removed from production settle",
        "24h settle fail rate: 0.03% (1 fail / 3,370 attempts)",
        "Crossmint card → USDC onramp on /wallet",
        "Flint depth + OKX Genesis finance surfaces",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How settlement works now",
      headline: "Pay → settle → prove",
      steps: [
        {
          step: "01",
          title: "Agent hits a paid route",
          description: "x402 returns payment required, then the wallet pays USDC.",
        },
        {
          step: "02",
          title: "Settle on a healthy rail",
          description: "Solana and Algorand dominate live paid traffic right now.",
        },
        {
          step: "03",
          title: "Count only paid outcomes",
          description: "Public GMV uses outcome=paid. Failures are not marketed as revenue.",
        },
        {
          step: "04",
          title: "Verify yourself",
          description: "GET /api/metrics and Solscan buyback links on /token.",
        },
      ],
    },
    {
      id: "traction",
      kind: "cards",
      layout: "cards-bento",
      label: "Traction",
      kicker: "Interesting right now",
      headline: "What the numbers say about users",
      cards: [
        {
          title: "72 wallets",
          subtitle: "7d payers",
          detail: "Unique wallets that completed a paid call in the last 7 days.",
          accent: "gold",
        },
        {
          title: "100%",
          subtitle: "402 → paid",
          detail: "Every wallet that saw payment required converted to at least one paid call.",
          accent: "gold",
        },
        {
          title: "61%",
          subtitle: "D7 repeat",
          detail: "22 of 36 eligible first-time payers came back within 7 days.",
        },
        {
          title: "$207",
          subtitle: "Settled 24h",
          detail: "3,369 paid calls in the last day. Average paid call is about $0.05.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Where to look",
      kicker: "Proof surfaces",
      headline: "Do not take our word for it",
      items: [
        {
          icon: Activity,
          title: "Live metrics",
          description: "Settle rates, wallets, paths, networks",
          href: "https://api.syraa.fun/api/metrics",
        },
        {
          icon: ShieldCheck,
          title: "Token proof",
          description: "Buybacks with Solscan links",
          href: "https://www.syraa.fun/token",
        },
        {
          icon: Wallet,
          title: "Marketplace",
          description: "First paid call",
          href: "https://www.syraa.fun/marketplace",
        },
        {
          icon: Zap,
          title: "Card onramp",
          description: "Buy USDC into agent wallet",
          href: "https://www.syraa.fun/wallet",
        },
        {
          icon: LineChart,
          title: "Rewards",
          description: "62 earners accruing from usage",
          href: "https://www.syraa.fun/rewards",
        },
        {
          icon: ExternalLink,
          title: "Solscan buyback",
          description: "Latest on-market $SYRA buy",
          href: "https://solscan.io/tx/3jz7qTsz14SQpJVxnaK5UWHVFjGP38GtDDuhGuK6ziNajDZciU62ZqwjYDUPGUMuzoHDAvM6ZxpSj8Mp1S21ED33",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Last 24 hours",
      headline: "Healthy settle. Real demand.",
      stats: [
        { value: "0.03%", label: "Settle fail rate" },
        { value: "3,369", label: "Paid calls" },
        { value: "72", label: "Payers (7d)" },
      ],
      narrative:
        "Top paid paths right now: gas-oracle, network-health, and market-pulse. Leading rails by settled USDC: Algorand and Solana. Lifetime: 16.8k paid calls, $812 settled, 77 unique payers.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "Verify the settle. Then make a paid call.",
      subline:
        "Builders start on marketplace. Holders check buybacks on /token. Everyone can read the same public metrics.",
      links: [
        {
          label: "Metrics",
          value: "api.syraa.fun/api/metrics",
          href: "https://api.syraa.fun/api/metrics",
        },
        {
          label: "Marketplace",
          value: "syraa.fun/marketplace",
          href: "https://www.syraa.fun/marketplace",
        },
        {
          label: "Token proof",
          value: "syraa.fun/token",
          href: "https://www.syraa.fun/token",
        },
      ],
    },
  ],
);
