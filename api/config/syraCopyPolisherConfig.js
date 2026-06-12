import { SYRA_NARRATIVE_CONTEXT } from "./syraNarrativeConfig.js";

export { SYRA_NARRATIVE_CONTEXT as SYRA_COPY_POLISH_BRAND_CONTEXT };

export const SYRA_COPY_POLISH_MAX_RETRIES = 5;
export const SYRA_COPY_POLISH_EXISTING_SAMPLE = 30;

export const SYRA_COPY_POLISH_TONES = [
  {
    id: "polish",
    label: "Light polish",
    angle: "Same voice and meaning — tighten wording, fix rhythm, slightly sharper. Minimal change.",
  },
  {
    id: "hype",
    label: "More hype",
    angle: "Same facts and intent — crank energy, confidence, inevitability. Build-in-public hype without cringe.",
  },
  {
    id: "narrative",
    label: "Better narrative",
    angle: "Same context — improve story flow, hook, and payoff. Make it read like premium copywriting.",
  },
  {
    id: "punchy",
    label: "Punchy & short",
    angle: "Same message — cut fluff, shorter sentences, maximum impact per line. Under 280 chars if possible.",
  },
  {
    id: "syra-brand",
    label: "Syra brand voice",
    angle: "Keep your context — weave in Syra agent economy / x402 / $SYRA naturally where it fits. Don't force if off-topic.",
  },
  {
    id: "cta",
    label: "Stronger CTA",
    angle: "Same core message — land a clearer call to action (syraa.fun, $SYRA, try the product) without changing the thesis.",
  },
];

export const SYRA_COPY_POLISH_SYSTEM_RULES = `You rewrite X (Twitter) post drafts for Syra's team.

CRITICAL — preserve the author's intent:
- Keep the SAME context, facts, claims, and message. Do NOT invent new stats, partnerships, or promises.
- Do NOT change what the post is about. If they mention a feature, keep that feature. If it's personal, keep it personal.
- You may improve: hook, word choice, rhythm, structure, hype level, Syra brand voice (when tone asks for it).
- Output ONLY the improved post text. No quotes, labels, markdown, or explanations.
- Ideal: 150–450 characters unless the original is intentionally longer.
- No financial advice, no price targets, no guaranteed returns.
- Must differ meaningfully from the original (not identical) and be unique vs forbidden list.`;
