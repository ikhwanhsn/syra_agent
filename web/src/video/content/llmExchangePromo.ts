/** Timing + copy for the LLM Exchange launch promo (~40s @ 30fps). */

export const LLM_EXCHANGE_PROMO_FPS = 30;
export const LLM_EXCHANGE_PROMO_WIDTH = 1920;
export const LLM_EXCHANGE_PROMO_HEIGHT = 1080;
export const LLM_EXCHANGE_PROMO_DURATION = 1200;

export type PromoScene = {
  id: string;
  from: number;
  to: number;
};

export const PROMO_SCENES: PromoScene[] = [
  { id: "cover", from: 0, to: 120 },
  { id: "problem", from: 108, to: 258 },
  { id: "reveal", from: 246, to: 396 },
  { id: "protocols", from: 384, to: 534 },
  { id: "listUi", from: 522, to: 702 },
  { id: "routing", from: 690, to: 855 },
  { id: "money", from: 843, to: 1023 },
  { id: "cta", from: 1011, to: 1200 },
];

/** Relative reveal offsets inside each scene (tight so mid-scene frames show full layout). */
export const PROMO_REVEALS: Record<
  string,
  { title: number; elements: number[]; caption: number }
> = {
  cover: { title: 8, elements: [22, 38], caption: 48 },
  problem: { title: 6, elements: [18, 30], caption: 48 },
  reveal: { title: 8, elements: [18, 32, 48], caption: 56 },
  protocols: { title: 6, elements: [14, 22, 30, 38], caption: 52 },
  listUi: { title: 6, elements: [14, 28], caption: 48 },
  routing: { title: 6, elements: [14, 24, 34, 44], caption: 56 },
  money: { title: 6, elements: [14, 26, 38, 50], caption: 64 },
  cta: { title: 10, elements: [24, 38, 52], caption: 72 },
};

export const COPY = {
  cover: {
    eyebrow: "Ship log · Earn",
    title: "LLM Exchange",
    subtitle: "Sell any model. Agents pay once. Syra routes the call.",
    caption: "Claude, Gemini, DeepSeek, or custom. Settled in USDC.",
  },
  problem: {
    eyebrow: "The gap",
    title: "Agents want one checkout. Sellers want passive USDC.",
    left: {
      title: "Callers today",
      body: "Hardcode one vendor. Eat downtime. Rebuild payment each time.",
    },
    right: {
      title: "Sellers today",
      body: "Spare LLM access sits idle. No x402, no routing, no payout rail.",
    },
    caption: "Two sides. No marketplace. Until now.",
  },
  reveal: {
    eyebrow: "One route",
    title: "POST /llm/route",
    body: "OpenAI-shaped body in. Syra translates to Claude, Gemini, or any OpenAI-compatible upstream.",
    caption: "Pay via x402. Never pick a vendor yourself.",
  },
  protocols: {
    eyebrow: "List anything",
    title: "Four protocols. One marketplace.",
    items: [
      { id: "openai", label: "OpenAI-compatible", detail: "DeepSeek · Groq · vLLM · Together" },
      { id: "anthropic", label: "Anthropic", detail: "Claude Messages API" },
      { id: "google", label: "Google", detail: "Gemini generateContent" },
      { id: "custom", label: "Custom", detail: "Your path + auth header" },
    ],
    caption: "Pick a provider type. Paste a key. Set a price.",
  },
  listUi: {
    eyebrow: "Earn · LLM",
    title: "List an LLM in one dialog",
    caption: "Encrypted keys. Connection test. Activate into the router.",
  },
  routing: {
    eyebrow: "Smart router",
    title: "Cheapest. Reliable. Fastest. Quality.",
    policies: ["cheapest", "reliable", "fastest", "quality"],
    caption: "Header X-Syra-Route. Automatic failover. Never empty.",
  },
  money: {
    eyebrow: "Money flow",
    title: "List · Route · Split · Buyback",
    steps: [
      { step: "01", title: "List", detail: "Seller sets protocol + price" },
      { step: "02", title: "Route", detail: "Agent pays /llm/route" },
      { step: "03", title: "Split", detail: "20% fee · 80% seller" },
      { step: "04", title: "Buyback", detail: "Fee queues into $SYRA" },
    ],
    caption: "Platform fees feed the same Jupiter buyback loop.",
  },
  cta: {
    eyebrow: "Live now",
    title: "List a model. Route a call.",
    links: [
      { label: "Earn LLM", value: "syraa.fun/earn?track=llm" },
      { label: "API docs", value: "docs.syraa.fun/docs/api/llm-route" },
      { label: "Metrics", value: "api.syraa.fun/api/metrics" },
    ],
    caption: "Open Earn > LLM, or POST /llm/route with X-Syra-Route: cheapest.",
  },
} as const;

export function sceneById(id: string): PromoScene {
  const s = PROMO_SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`Missing scene ${id}`);
  return s;
}
