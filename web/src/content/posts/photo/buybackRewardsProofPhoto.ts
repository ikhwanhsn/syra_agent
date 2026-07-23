import { BUYBACK_REWARDS_PROOF_POST } from "../buybackRewardsProofUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { BUYBACK_REWARDS_PROOF_PHOTO_SHARE_COPIES } from "./shareCopies/buybackRewardsProofShareCopies";

const copies = BUYBACK_REWARDS_PROOF_PHOTO_SHARE_COPIES;

/** Photo-format content for Revenue → $SYRA proof ship log. */
export const BUYBACK_REWARDS_PROOF_PHOTO = definePhotoUpdate(BUYBACK_REWARDS_PROOF_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Proof · Rewards · Discounts",
      title: "Revenue → $SYRA",
      subtitle: "Verifiable buybacks, claimable usage rewards, live holder fee discounts.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "Token stories without receipts die at microcap.",
      body: "Syra closes the loop: paid calls → buyback → rewards → hold utility — with Solscan links.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Pay → buyback → rewards.",
      narrative: "Visible on /token. Claimable on /rewards. Useful as fee discounts.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "Four steps. One flywheel.",
      steps: [
        { step: "01", title: "Pay USDC", description: "x402 settles the call." },
        { step: "02", title: "Buy $SYRA", description: "~80% via Jupiter." },
        { step: "03", title: "Publish proof", description: "Solscan on /token." },
        { step: "04", title: "Claim rewards", description: "Payers on /rewards." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "Receipts in the product.",
      steps: [
        { step: "01", title: "Metrics", description: "buyback on /api/metrics." },
        { step: "02", title: "Token page", description: "proof panel live." },
        { step: "03", title: "Rewards", description: "accrue + claim." },
        { step: "04", title: "Discounts", description: "wired into pricing." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Live utility. Honest roadmap.",
      cards: [
        { title: "Discounts", subtitle: "Live", detail: "5–30% off x402 by tier.", accent: "gold" },
        { title: "Rewards", subtitle: "Live", detail: "Spend → claimable $SYRA.", accent: "gold" },
        { title: "Buybacks", subtitle: "Live", detail: "Solscan-linked flushes." },
        { title: "Governance", subtitle: "Roadmap", detail: "Not shipped — labeled as such." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      kicker: "Verify",
      headline: "Don't trust. Check.",
      highlights: [
        "/token — buyback proof",
        "/rewards — claim surface",
        "/api/metrics — JSON",
        "Solscan — every flush",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "The loop in numbers.",
      stats: [
        { value: "80%", label: "→ buyback" },
        { value: "4", label: "discount tiers" },
        { value: "1", label: "claim page" },
      ],
    }),
  },
  {
    role: "featured",
    layout: "photo-hero-split",
    shareCopy: copies.featured,
    content: photoContent({
      kicker: "Path",
      headline: "Call → proof → claim → hold.",
      body: "Marketplace for first paid call. Token page for receipts. Rewards for claim. Stake for deeper discounts.",
      highlights: ["Marketplace", "Token proof", "Rewards", "Staking"],
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Narrative vs receipts.",
      compareLeft: {
        title: "Before",
        body: "Buyback story. Invisible loop. Whale-only perks.",
      },
      compareRight: {
        title: "Now",
        body: "Solscan proofs. Claimable rewards. Tiered discounts in code.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Live",
      title: "Revenue → $SYRA proof",
      subtitle: "Holders can verify. Builders can earn. Discounts are real.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-statement-boxed",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Tiers",
      headline: "Hold or stake for fee off.",
      body: "10k → 5%. 100k → 10%. 1M → 20% + free agent tools. 10M → 30%.",
    }),
  },
  {
    role: "split",
    layout: "photo-hero-compact",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Same rails",
      headline: "Builders pay. Holders see receipts.",
      body: "USDC x402 volume funds buybacks. Rewards close the loop to active payers.",
      highlights: ["Paid calls", "Buybacks", "Rewards", "Discounts"],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "In the API.",
      terminalLines: [
        "GET /api/metrics",
        "→ buyback · holders · rewards",
        "GET /rewards/me?wallet=",
        "→ claimable $SYRA",
        "POST /rewards/claim",
        "→ treasury SPL transfer",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-banner",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Ship a paid call. Then hold the token.",
      subtitle: "Verify on /token. Claim on /rewards. Discount by holding $SYRA.",
    }),
  },
]);
