/** Timing + copy for the Relay Bridge launch promo (~38s @ 30fps). */

export const BRIDGE_PROMO_FPS = 30;
export const BRIDGE_PROMO_WIDTH = 1920;
export const BRIDGE_PROMO_HEIGHT = 1080;
export const BRIDGE_PROMO_DURATION = 1140;

export type PromoScene = {
  id: string;
  from: number;
  to: number;
};

export const PROMO_SCENES: PromoScene[] = [
  { id: "cover", from: 0, to: 120 },
  { id: "problem", from: 108, to: 258 },
  { id: "reveal", from: 246, to: 396 },
  { id: "chains", from: 384, to: 534 },
  { id: "widget", from: 522, to: 702 },
  { id: "fee", from: 690, to: 855 },
  { id: "buyback", from: 843, to: 1023 },
  { id: "cta", from: 1011, to: 1140 },
];

/** Relative reveal offsets (tight so mid-scene stills show full layout). */
export const PROMO_REVEALS: Record<
  string,
  { title: number; elements: number[]; caption: number }
> = {
  cover: { title: 8, elements: [22, 38], caption: 48 },
  problem: { title: 6, elements: [18, 30], caption: 48 },
  reveal: { title: 8, elements: [18, 32, 48], caption: 56 },
  chains: { title: 6, elements: [14, 22, 30, 38], caption: 52 },
  widget: { title: 6, elements: [14, 28], caption: 48 },
  fee: { title: 6, elements: [14, 26, 38, 50], caption: 60 },
  buyback: { title: 6, elements: [14, 26, 38, 50], caption: 64 },
  cta: { title: 10, elements: [24, 38, 52], caption: 72 },
};

export const COPY = {
  cover: {
    eyebrow: "Ship log · Earn",
    title: "Bridge",
    subtitle: "Move assets across chains. One Syra surface.",
    caption: "Cross-chain. Instant. Settled.",
  },
  problem: {
    eyebrow: "The gap",
    title: "Funds sit on the wrong chain. Bridging is the tax.",
    left: {
      title: "Before",
      body: "Hop tabs. Trust random bridges. Miss fills. Restart when gas spikes.",
    },
    right: {
      title: "After",
      body: "One Syra page. Relay routes. Quote, sign, fill. Fee funds $SYRA.",
    },
    caption: "One surface. Many chains.",
  },
  reveal: {
    eyebrow: "Live path",
    title: "/bridge",
    body: "RelayKit widget on Syra. EVM and Solana wallets. Same quote flow.",
    caption: "Powered by Relay.",
  },
  chains: {
    eyebrow: "Routes",
    title: "Popular chains. Same widget.",
    items: [
      { id: "base", label: "Base", detail: "USDC native · free fee claim" },
      { id: "solana", label: "Solana", detail: "Privy wallet · SVM adapter" },
      { id: "ethereum", label: "Ethereum", detail: "Injected + major L2s" },
      { id: "arbitrum", label: "Arbitrum", detail: "Fast fills · low gas" },
    ],
    caption: "Same widget. Any direction.",
  },
  widget: {
    eyebrow: "Product",
    title: "Quote. Sign. Fill.",
    caption: "From Base USDC to Solana USDC in one panel.",
  },
  fee: {
    eyebrow: "App fee",
    title: "0.25% funds $SYRA buybacks",
    points: [
      { label: "25 bps", detail: "App fee on input value" },
      { label: "Off-chain USDC", detail: "Accrues to Syra claim address" },
      { label: "Verified", detail: "API checks paidAppFees per request" },
      { label: "Queued", detail: "USD enters the buyback accumulator" },
    ],
    caption: "Fee accrues to Syra. Users keep the fill.",
  },
  buyback: {
    eyebrow: "Buyback loop",
    title: "Aggregate first. Buy once every 24h.",
    steps: [
      { step: "01", title: "Bridge", detail: "User completes Relay fill" },
      { step: "02", title: "Verify", detail: "Server reads paid app fee" },
      { step: "03", title: "Queue", detail: "USD joins pendingRevenue" },
      { step: "04", title: "Swap", detail: "Jupiter USDC to $SYRA daily" },
    ],
    caption: "One buyback. Not spam.",
  },
  cta: {
    eyebrow: "Live now",
    title: "Bridge on Syra.",
    links: [
      { label: "Bridge", value: "syraa.fun/bridge" },
      { label: "Relay docs", value: "docs.relay.link" },
      { label: "Metrics", value: "api.syraa.fun/api/metrics" },
    ],
    caption: "Open Earn > Bridge, or go to syraa.fun/bridge.",
  },
} as const;

export function sceneById(id: string): PromoScene {
  const s = PROMO_SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`Missing scene ${id}`);
  return s;
}
