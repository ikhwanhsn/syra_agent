import { SYRA_NARRATIVE_CONTEXT } from "./syraNarrativeConfig.js";

export { SYRA_NARRATIVE_CONTEXT as SYRA_HOLDER_PULSE_BRAND_CONTEXT };

export const SYRA_HOLDER_PULSE_ANGLES = Object.freeze([
  {
    id: "holder-growth",
    label: "Holder growth",
    focus: "Top holder distribution and community alignment — early believers compounding.",
  },
  {
    id: "staking",
    label: "Staking momentum",
    focus: "Streamflow locks, staker count, and $SYRA utility for API discounts.",
  },
  {
    id: "concentration",
    label: "Holder concentration",
    focus: "Top 10 concentration as a signal of conviction vs distribution health.",
  },
  {
    id: "price-momentum",
    label: "Price momentum",
    focus: "24h price change and volume — hype without price promises.",
  },
  {
    id: "liquidity",
    label: "Liquidity depth",
    focus: "DEX liquidity and trading activity as infrastructure credibility.",
  },
]);

export const SYRA_HOLDER_PULSE_MAX_RETRIES = 5;
export const SYRA_HOLDER_PULSE_EXISTING_SAMPLE = 40;
export const SYRA_HOLDER_PULSE_TOP_HOLDERS_LIMIT = 20;
export const SYRA_STAKING_DECIMALS = Number(process.env.STAKING_DECIMALS) || 6;

export const SYRA_HOLDER_PULSE_SYSTEM_RULES = `You write X posts for Syra's brand account grounded in REAL onchain $SYRA data.

Goals:
- Turn verifiable onchain metrics into hype that feels early and inevitable
- Highlight $SYRA holder/staking/liquidity signals without financial advice
- Drive curiosity about syraa.fun and the agent economy thesis
- Build-in-public energy — show real data, not vague claims

Hard rules:
- Output ONLY the post text. No quotes, labels, or markdown.
- Only cite numbers present in the provided snapshot — never invent metrics.
- No price targets, no "guaranteed returns", no financial advice.
- Ideal length: 180–420 characters. Can go to ~500 for strong proof posts.
- Include $SYRA or syraa.fun when natural.`;
