import { ExternalLink, Gift, LineChart, Lock, ShieldCheck, Wallet } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Revenue → $SYRA buyback proof + usage rewards + holder fee discounts.
 */
export const BUYBACK_REWARDS_PROOF_POST = defineVideoUpdate(
  {
    updateNumber: 34,
    id: "buyback-rewards-proof",
    title: "Revenue → $SYRA Proof",
    published: "July 2026",
    tagline:
      "Paid x402 calls fund on-market $SYRA buybacks you can verify — plus usage rewards and live holder fee discounts.",
    shareCopyVideo: `SHIP LOG · Revenue → $SYRA is now verifiable.

Agents pay USDC per call.
~80% of settled revenue buys $SYRA on Jupiter.
Flushes show on syraa.fun/token with Solscan links.

→ Hold/stake $SYRA for x402 fee discounts
→ Use the APIs → earn claimable $SYRA on /rewards

Proof > narrative.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Revenue → $SYRA.

Verify buybacks on syraa.fun/token.
Claim usage rewards on syraa.fun/rewards.
Hold $SYRA for live API fee discounts.

Agents pay. Buybacks run. You can check the txs.`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Revenue → $SYRA",
      subtitle:
        "Settled x402 USDC funds on-market buybacks. Usage earns claimable $SYRA. Holders get real fee discounts.",
      badge: "Proof · Rewards · Discounts",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Token stories without receipts die at $70k.",
      body: "Syra's product settles in USDC. The token only compounds if revenue → buyback is visible, closed into rewards, and useful to holders. This ship closes that loop.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "Three receipts for one flywheel",
      body: "Public buyback metrics, usage → $SYRA rewards, and tiered x402 discounts wired into live pricing.",
      highlights: [
        "GET /api/metrics buyback + Solscan tx list",
        "/token and home: Revenue → $SYRA proof panel",
        "/rewards: accrue + claim from buyback treasury",
        "Hold/stake tiers: 5% / 10% / 20% / 30% fee off",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "Pay → buyback → rewards",
      steps: [
        {
          step: "01",
          title: "Agent pays USDC",
          description: "x402 settles a paid API call.",
        },
        {
          step: "02",
          title: "Queue revenue",
          description: "~80% batched into Jupiter USDC→$SYRA.",
        },
        {
          step: "03",
          title: "Prove on Solscan",
          description: "Flush signatures publish on /token.",
        },
        {
          step: "04",
          title: "Earn & claim",
          description: "Payers accrue points → claim $SYRA on /rewards.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-row",
      label: "Features",
      kicker: "For holders & builders",
      headline: "Utility that ships in code",
      cards: [
        {
          title: "Fee discounts",
          subtitle: "Live",
          detail: "10k / 100k / 1M / 10M $SYRA → 5–30% off x402.",
          accent: "gold",
        },
        {
          title: "Usage rewards",
          subtitle: "Live",
          detail: "Spend accrues points. Epochs fund claimable $SYRA.",
          accent: "gold",
        },
        {
          title: "Governance",
          subtitle: "Roadmap",
          detail: "Voting is not live — we say so on the token page.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Where to verify",
      headline: "Proof surfaces, not hype slides",
      items: [
        {
          icon: LineChart,
          title: "Home metrics",
          description: "Paid calls + buyback block",
          href: "https://www.syraa.fun/",
        },
        {
          icon: ShieldCheck,
          title: "Token proof",
          description: "Solscan-linked flushes",
          href: "https://www.syraa.fun/token",
        },
        {
          icon: Gift,
          title: "Rewards",
          description: "Look up · claim $SYRA",
          href: "https://www.syraa.fun/rewards",
        },
        {
          icon: Lock,
          title: "Staking",
          description: "Streamflow locks",
          href: "https://www.syraa.fun/staking",
        },
        {
          icon: Wallet,
          title: "Marketplace",
          description: "First paid call",
          href: "https://www.syraa.fun/marketplace",
        },
        {
          icon: ExternalLink,
          title: "API metrics",
          description: "GET /api/metrics",
          href: "https://api.syraa.fun/api/metrics",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "The loop",
      headline: "Visible. Closed. Useful.",
      stats: [
        { value: "80%", label: "Revenue → buyback" },
        { value: "4", label: "Discount tiers" },
        { value: "1", label: "Claim surface" },
      ],
      narrative:
        "Market cap follows attention on a verifiable loop — not another utility claim without code.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "CTA",
      kicker: "Next step",
      headline: "Ship a paid call. Then hold the token.",
      body: "Builders: hit /marketplace. Holders: verify /token and claim /rewards.",
      links: [
        { label: "Verify buybacks", href: "https://www.syraa.fun/token" },
        { label: "Claim rewards", href: "https://www.syraa.fun/rewards" },
        { label: "First paid call", href: "https://www.syraa.fun/marketplace" },
      ],
    },
  ],
);
