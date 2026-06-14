import { SYRA_NARRATIVE_CONTEXT } from "./syraNarrativeConfig.js";

export { SYRA_NARRATIVE_CONTEXT as SYRA_MENTION_TRIAGE_BRAND_CONTEXT };

export const SYRA_MENTION_DEFAULT_HANDLE = (
  process.env.SYRA_FOUNDER_X_HANDLE || ""
).trim().replace(/^@/, "");

export const SYRA_MENTION_CATEGORIES = Object.freeze([
  "question",
  "opportunity",
  "fud",
  "praise",
  "spam",
]);

export const SYRA_MENTION_REPLY_TONES = Object.freeze([
  { id: "helpful", label: "Helpful", angle: "Answer directly, add value, bridge to Syra if relevant." },
  { id: "hype", label: "Founder hype", angle: "Maximum energy — validate, amplify, drive $SYRA curiosity." },
  { id: "builder", label: "Builder peer", angle: "Technical respect, ship energy, invite to syraa.fun." },
  { id: "clarify", label: "Clarify FUD", angle: "Calm, factual correction without being defensive." },
]);

export const SYRA_MENTION_MAX_RETRIES = 5;
export const SYRA_MENTION_EXISTING_SAMPLE = 40;
export const SYRA_MENTION_MAX_ITEMS = 25;

export const SYRA_MENTION_REPLY_SYSTEM_RULES = `You write reply tweets for a Syra founder's personal X account responding to mentions.

Goals:
- Match the mention category (question, opportunity, praise, FUD)
- Add genuine value — never sound like a bot
- Bridge to Syra thesis when natural
- Founder voice — personal, not corporate

Hard rules:
- Output ONLY the reply text. No quotes, labels, or markdown.
- No financial advice, no price targets
- Ideal length: 120–280 characters`;
