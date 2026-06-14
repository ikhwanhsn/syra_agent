import { SYRA_NARRATIVE_CONTEXT } from "./syraNarrativeConfig.js";

export { SYRA_NARRATIVE_CONTEXT as SYRA_ENGAGEMENT_BRAND_CONTEXT };

/** Accounts to exclude from opportunities (own project handles). */
export const SYRA_ENGAGEMENT_EXCLUDED_HANDLES = Object.freeze([
  "syra_agent",
  "syraa_fun",
]);

/** Topic presets — each maps to a twitterapi.io advanced search query fragment. */
export const SYRA_ENGAGEMENT_TOPICS = Object.freeze([
  {
    id: "solana",
    label: "Solana",
    query: '("Solana" OR $SOL) (agents OR DeFi OR infra)',
  },
  {
    id: "ai-agents",
    label: "AI agents",
    query: '("AI agents" OR "autonomous agents" OR "agent economy")',
  },
  {
    id: "x402",
    label: "x402",
    query: '(x402 OR "micropayments" OR "pay per call") (agents OR API)',
  },
  {
    id: "agent-economy",
    label: "Agent economy",
    query: '("agent economy" OR "machine money" OR "agent wallets")',
  },
  {
    id: "defi-agents",
    label: "DeFi agents",
    query: '("DeFi agents" OR "trading agents" OR "on-chain agents")',
  },
  {
    id: "autonomous",
    label: "Autonomous agents",
    query: '("autonomous agents" OR "agentic" OR "agent stack") (crypto OR Solana)',
  },
]);

/** Time window options for search filters. */
export const SYRA_ENGAGEMENT_WINDOWS = Object.freeze([
  { id: "6h", label: "6 hours", withinTime: "6h" },
  { id: "12h", label: "12 hours", withinTime: "12h" },
  { id: "24h", label: "24 hours", withinTime: "24h" },
  { id: "48h", label: "48 hours", withinTime: "48h" },
]);

/** Minimum likes filter presets. */
export const SYRA_ENGAGEMENT_MIN_FAVES = Object.freeze([
  { id: "10", label: "10+ likes", value: 10 },
  { id: "25", label: "25+ likes", value: 25 },
  { id: "50", label: "50+ likes", value: 50 },
  { id: "100", label: "100+ likes", value: 100 },
]);

export const SYRA_ENGAGEMENT_DEFAULT_TOPIC_IDS = Object.freeze(["ai-agents", "x402", "solana"]);
export const SYRA_ENGAGEMENT_DEFAULT_WINDOW = "24h";
export const SYRA_ENGAGEMENT_DEFAULT_MIN_FAVES = 25;
export const SYRA_ENGAGEMENT_DEFAULT_QUERY_TYPE = "Latest";
export const SYRA_ENGAGEMENT_MAX_RESULTS = 15;
export const SYRA_ENGAGEMENT_MAX_SEARCH_TOPICS = 3;
export const SYRA_ENGAGEMENT_MAX_RETRIES = 5;
export const SYRA_ENGAGEMENT_EXISTING_SAMPLE = 40;

/** Reply tones for founder-led engagement. */
export const SYRA_ENGAGEMENT_REPLY_TONES = Object.freeze([
  {
    id: "insight",
    label: "Sharp insight",
    angle:
      "Add a sharp, founder-level insight that elevates the conversation — then bridge naturally to Syra if relevant.",
  },
  {
    id: "builder",
    label: "Builder peer",
    angle:
      "Founder-to-founder tone — technical respect, ship energy, invite builders to explore syraa.fun.",
  },
  {
    id: "amplify",
    label: "Amplify + bridge",
    angle:
      "Agree with their point, amplify the thesis, then bridge to why Syra is building the infrastructure layer.",
  },
  {
    id: "question",
    label: "Question hook",
    angle:
      "Open with a sharp question inspired by their tweet, answer with Syra thesis, close with syraa.fun or $SYRA.",
  },
  {
    id: "contrast",
    label: "Smart contrast",
    angle:
      "Respect what they're building, then contrast: they're the app — Syra is the machine-money rail agents run on.",
  },
  {
    id: "hype",
    label: "Founder hype",
    angle:
      "Maximum founder energy — validate the trend, position Syra as early to the wave, strong $SYRA curiosity without price promises.",
  },
]);

export const SYRA_ENGAGEMENT_REPLY_SYSTEM_RULES = `You write reply tweets for a Syra founder's personal X account.

The user found a high-traction tweet in their niche. Your job: draft a reply that gets visibility and builds founder-led hype for Syra — without sounding like a bot or spam.

Goals:
- Add genuine value to the conversation (insight, question, builder perspective)
- Show you read and understood their tweet
- Bridge naturally to Syra when relevant: agent economy, x402 micropayments, machine money on Solana
- Drive curiosity about $SYRA and syraa.fun — not hard sell
- Feel native to crypto Twitter: punchy, confident, early, inevitable
- Never attack the author — elevate the conversation

Hard rules:
- Output ONLY the reply text. No quotes around it, no labels, no markdown.
- Do NOT repeat the original tweet verbatim.
- No financial advice, no price targets, no "guaranteed returns".
- Ideal length: 120–280 characters. Can go to ~320 for a strong hook.
- Must be unique vs forbidden list of prior replies.
- Write as a founder replying personally — not as a brand account.`;
