import { SYRA_NARRATIVE_CONTEXT } from "./syraNarrativeConfig.js";

export { SYRA_NARRATIVE_CONTEXT as SYRA_KOL_TRACKER_BRAND_CONTEXT };

const DEFAULT_KOLS = [
  "aeyakovenko",
  "mert",
  "0xMert_",
  "blknoiz06",
  "ansem",
  "pumpdotfun",
  "JupiterExchange",
  "heliuslabs",
];

export const SYRA_KOL_DEFAULT_HANDLES = Object.freeze(
  (process.env.SYRA_KOL_HANDLES || DEFAULT_KOLS.join(","))
    .split(",")
    .map((h) => h.trim().replace(/^@/, ""))
    .filter(Boolean)
    .slice(0, 12),
);

export const SYRA_KOL_MAX_HANDLES = 12;
export const SYRA_KOL_TWEETS_PER_HANDLE = 10;
export const SYRA_KOL_MAX_RESULTS = 20;

export const SYRA_KOL_ENGAGEMENT_MODES = Object.freeze([
  { id: "reply", label: "Reply", angle: "Sharp founder reply that adds insight and gets visibility." },
  { id: "quote", label: "Quote tweet", angle: "Quote caption that bridges their point to Syra thesis." },
  { id: "amplify", label: "Amplify", angle: "Agree and amplify — position Syra as complementary infrastructure." },
]);

export const SYRA_KOL_MAX_RETRIES = 5;
export const SYRA_KOL_EXISTING_SAMPLE = 40;

export const SYRA_KOL_DRAFT_SYSTEM_RULES = `You write engagement copy for a Syra founder engaging with crypto KOL tweets.

Goals:
- Add value to the KOL's conversation — insight, question, builder perspective
- Get visibility in high-traffic threads
- Bridge to Syra when relevant without hard sell
- Founder voice — personal, confident, early

Hard rules:
- Output ONLY the reply/quote text. No quotes, labels, or markdown.
- Ideal length: 120–280 characters`;
