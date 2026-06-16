import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Fund Mandate photo deck — 15 distinct voices. */
export const FUND_MANDATE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Most allocators hide their process. We publish ours.

Up Only Fund: onchain capital for high conviction bets on Solana. Published 80/20 mandate. On-chain verification before every position.

Conviction first. Structure always.

uponlyfund.com`,

  thesis: `Honest question for allocators:

How much of a fund's thesis do you actually get to see before capital is deployed?

We publish mandate, sleeve criteria, and portfolio disclosures onchain. No gated PDF behind a typeform.`,

  quote: `"Conviction first. Structure always. No hidden rugs."

That's not marketing copy — it's the allocation gate. Every position passes onchain verification first.`,

  flow: `How Up Only Fund allocates — four steps:

1. Screen the Solana universe by traction and structure
2. Map candidates to our published 80/20 sleeve criteria
3. Verify onchain: liquidity, distribution, rug checks
4. Publish positions and monitor via dashboard

Opaque thesis is a red flag.`,

  timeline: `Fund mandate — what we actually publish:

• 80% utility sleeve with real product traction
• 20% asymmetric sleeve with verified structure
• On-chain verification before every position
• Public portfolio disclosures as treasury goes live
• Explicit risk framing on every sleeve`,

  pillars: `High conviction (80%) — utility tokens with real Solana traction
Asymmetric (20%) — clean memecoins with verified structure
Risk framing — high risk by design, always disclosed
No public LP in v1 — follow disclosures as treasury publishes

Four pillars. One published mandate.`,

  checklist: `What's live today:
— Public fund landing with mandate and thesis
— Fund-grade dashboard and market terminal
— Portfolio disclosures as treasury goes live
— Explicit risk framing on every sleeve
— Onchain verification gate before allocation`,

  metrics: `80/20 published allocation thesis
100% onchain verification gate
0 hidden rug mechanics tolerated

We size by conviction, not hype cycles.`,

  featured: `80/20. Published. Non-negotiable.

80% to utility with real product traction. 20% to asymmetric plays — but only after onchain verification clears liquidity, distribution, and rug checks.

The number that matters: zero tolerance for hidden mechanics.`,

  comparison: `Typical fund:
Opaque thesis. Narrative-driven sizing. Gated disclosures behind closed doors.

Up Only Fund:
Published 80/20 mandate. Onchain verification gates. Transparent portfolio disclosures.

The gap between "trust us" and "verify us" is exactly what we're closing.`,

  launch: `LIVE — Up Only Fund mandate is public.

Onchain capital for high conviction bets on Solana. Published 80/20 thesis. Verification before allocation.

Read the mandate → uponlyfund.com/#mandate`,

  deepDive: `Mandate criteria — for diligence:

→ 80% utility sleeve: working products, durable onchain demand
→ 20% asymmetric sleeve: verified liquidity, no-rug mechanics
→ Every position: liquidity + distribution + rug checks
→ Disclosures published as treasury deploys capital

High risk by design. No return promises.`,

  split: `UTILITY sleeve (80%): real traction, working products, durable demand on Solana.

ASYMMETRIC sleeve (20%): memecoin exposure only after structure clears verification.

Same fund. Two risk profiles. Both gated by onchain checks.`,

  terminal: `$ uof screen --chain solana --sleeve utility
> 847 candidates · 12 pass traction gate

$ uof verify --mint <address> --checks liquidity,distribution,rug
> structure clear · no hidden mechanics

$ uof allocate --sleeve high-conviction --size conviction-weighted
> position logged · disclosure queued`,

  cta: `Ready to follow a conviction allocator that publishes its process?

Fund page → uponlyfund.com
Mandate → uponlyfund.com/#mandate
Dashboard → uponlyfund.com/overview

80% utility. 20% asymmetric. 100% onchain verification.`,
};

/** Unique footer links for cards whose copy has no embedded URL. */
export const FUND_MANDATE_PHOTO_SHARE_FOOTERS: Partial<Record<PostPhotoCardRole, string>> = {
  thesis: "https://uponlyfund.com/#mandate",
  quote: "https://uponlyfund.com",
  pillars: "https://uponlyfund.com/#mandate",
  checklist: "https://uponlyfund.com/overview",
  metrics: "https://uponlyfund.com/#mandate",
  featured: "https://uponlyfund.com/#mandate",
  comparison: "https://uponlyfund.com",
  split: "https://uponlyfund.com/#mandate",
  deepDive: "https://uponlyfund.com/#mandate",
  terminal: "https://uponlyfund.com/overview",
};
