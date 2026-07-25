import { SETTLEMENT_RECOVERY_POST } from "../settlementRecoveryUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { SETTLEMENT_RECOVERY_PHOTO_SHARE_COPIES } from "./shareCopies/settlementRecoveryShareCopies";

const copies = SETTLEMENT_RECOVERY_PHOTO_SHARE_COPIES;

/** Photo-format content for settlement recovery proof ship log. */
export const SETTLEMENT_RECOVERY_PHOTO = definePhotoUpdate(SETTLEMENT_RECOVERY_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Proof · x402 · Live",
      title: "Settlement healthy again",
      subtitle:
        "Settle fail rate fell from ~62% to 0.03% in 24h. Paid calls, wallets, and rails you can verify.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "Why this matters",
      headline: "Broken settle kills trust faster than missing features.",
      body: "Agents stop paying when settlement fails. We removed the broken Celo Labs path and the 24h fail rate dropped to 0.03% on 3,370 attempts.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Pay. Settle. Prove.",
      narrative: "Public metrics count only paid outcomes. Failures are not marketed as revenue.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "Pay → settle → prove",
      steps: [
        { step: "01", title: "Hit a paid route", description: "x402 asks for USDC." },
        { step: "02", title: "Settle on a healthy rail", description: "Solana + Algorand lead." },
        { step: "03", title: "Count paid only", description: "GMV = outcome paid." },
        { step: "04", title: "Verify live", description: "/api/metrics + Solscan." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "This week",
      headline: "Recovery plus shipping.",
      steps: [
        { step: "01", title: "Celo Labs path out", description: "Broken facilitator removed." },
        { step: "02", title: "0.03% fail (24h)", description: "3,370 settle attempts." },
        { step: "03", title: "Crossmint onramp", description: "Card → USDC on /wallet." },
        { step: "04", title: "Flint + OKX Genesis", description: "Depth and finance surfaces." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Interesting user signals.",
      cards: [
        {
          title: "72 wallets",
          subtitle: "7d payers",
          detail: "Unique wallets with a paid call in 7 days.",
          accent: "gold",
        },
        {
          title: "100%",
          subtitle: "402 → paid",
          detail: "Every wallet that saw 402 converted to paid.",
          accent: "gold",
        },
        {
          title: "61%",
          subtitle: "D7 repeat",
          detail: "22 of 36 eligible payers returned in 7 days.",
        },
        {
          title: "$207",
          subtitle: "Settled 24h",
          detail: "3,369 paid calls. Avg about $0.05 each.",
        },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What you can verify yourself.",
      highlights: [
        "24h settle fail rate: 0.03%",
        "3,369 paid calls / ~$207 settled (24h)",
        "72 unique paying wallets (7d)",
        "Buyback Solscan links on /token",
        "Crossmint, Flint, OKX Genesis live this week",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Healthy settle. Real demand.",
      stats: [
        { value: "0.03%", label: "Settle fail 24h" },
        { value: "3,369", label: "Paid calls 24h" },
        { value: "72", label: "Payers 7d" },
      ],
      narrative:
        "Top paths: gas-oracle, network-health, market-pulse. Leading rails: Algorand and Solana.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "The trust number.",
      stats: [{ value: "0.03%", label: "Settle fail rate (24h)" }],
      narrative: "Down from about 62% the day before. Same public /api/metrics endpoint.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Broken settle vs healthy settle.",
      compareLeft: {
        title: "Before",
        body: "About 62% of settle attempts failed in a day. Agents could not trust paid calls.",
      },
      compareRight: {
        title: "Now",
        body: "0.03% fail on 3,370 attempts. 3,369 paid calls and about $207 settled in 24h.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Live",
      title: "Settlement proof is public",
      subtitle: "Metrics, Solscan buybacks, and paid-call surfaces stay open for everyone.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Traffic mix",
      headline: "What users are actually calling.",
      items: [
        "Top paths: /gas-oracle, /network-health, /market-pulse",
        "Leading rails by settled USDC: Algorand, then Solana",
        "Lifetime: ~16.8k paid calls, $812 settled, 77 payers",
        "62 usage reward earners accruing points",
        "Buyback treasury holding ~165k $SYRA",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Same proof",
      headline: "Builders pay. Holders verify.",
      body: "Fund a wallet, make a paid call, or check buybacks and rewards. Everyone reads the same metrics.",
      highlights: [
        "Builders: /marketplace + /wallet",
        "Holders: /token + /rewards",
        "Everyone: /api/metrics",
        "On-chain: Solscan buyback txs",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Verify in one request.",
      terminalLines: [
        "$ GET https://api.syraa.fun/api/metrics",
        "→ settlement.last24h.settleFailRate",
        "→ northStar.uniquePayingWalletsLast7d",
        "→ last24h.calls / usdSettled",
        "→ byPath · byNetwork · buyback",
        "→ funnel.d7RepeatRate",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Verify the settle. Then make a paid call.",
      subtitle:
        "Read public metrics, check buybacks on /token, start on marketplace if you are building.",
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
          label: "Token",
          value: "syraa.fun/token",
          href: "https://www.syraa.fun/token",
        },
      ],
    }),
  },
]);
