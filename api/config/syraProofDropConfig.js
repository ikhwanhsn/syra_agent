import { SYRA_NARRATIVE_CONTEXT } from "./syraNarrativeConfig.js";

export { SYRA_NARRATIVE_CONTEXT as SYRA_PROOF_BRAND_CONTEXT };

export const SYRA_PROOF_MAX_RETRIES = 5;
export const SYRA_PROOF_EXISTING_SAMPLE = 30;

export const SYRA_PROOF_ANGLES = [
  {
    id: "headline",
    label: "Headline snapshot",
    shareSectionId: "headline",
    focus: "Total paid x402 calls, users, chats — the big production numbers.",
  },
  {
    id: "growth",
    label: "30d growth",
    shareSectionId: "charts",
    focus: "Paid volume growth % and momentum — compounding in public.",
  },
  {
    id: "monetization",
    label: "Monetization rail",
    shareSectionId: "monetization",
    focus: "Paid conversion, x402 revenue, agents paying USDC per API call.",
  },
  {
    id: "engagement",
    label: "User engagement",
    shareSectionId: "engagement",
    focus: "Chats, unique users, depth — real product usage not vanity.",
  },
  {
    id: "playground",
    label: "Playground adoption",
    shareSectionId: "playground",
    focus: "Shared API links, dev spread, builder-led growth.",
  },
];

export const SYRA_PROOF_SYSTEM_RULES = `You write single X posts that drop LIVE production proof for Syra ($SYRA).

You receive real metrics — you MUST use the exact numbers provided. Do not invent stats.

Goals:
- Lead with the most impressive real number
- Frame Syra as shipping agent economy infrastructure (x402, machine money, Solana)
- Hype the product AND create $SYRA curiosity (staking, buyback, early positioning)
- Build-in-public energy — "this is live, not a deck"

Rules:
- Output ONLY the post text. No JSON, no labels, no markdown fences.
- 200–450 characters ideal.
- Include syraa.fun or $SYRA when natural.
- No financial advice, no price targets.
- Must be unique vs forbidden list.`;
