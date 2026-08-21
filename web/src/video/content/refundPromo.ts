/** Timing + copy for the in-house x402 refund promo (~42s @ 30fps). */

export const REFUND_PROMO_FPS = 30;
export const REFUND_PROMO_WIDTH = 1920;
export const REFUND_PROMO_HEIGHT = 1080;
export const REFUND_PROMO_DURATION = 1260;

export type PromoScene = {
  id: string;
  from: number;
  to: number;
};

export const PROMO_SCENES: PromoScene[] = [
  { id: "cover", from: 0, to: 120 },
  { id: "stakes", from: 110, to: 250 },
  { id: "roundtrip", from: 240, to: 410 },
  { id: "classify", from: 400, to: 540 },
  { id: "rails", from: 530, to: 680 },
  { id: "sdk", from: 670, to: 840 },
  { id: "proof", from: 830, to: 1000 },
  { id: "cta", from: 990, to: 1260 },
];

/** Relative reveal offsets (tight so mid-scene stills show full layout). */
export const PROMO_REVEALS: Record<
  string,
  { title: number; elements: number[]; caption: number }
> = {
  cover: { title: 8, elements: [22, 38], caption: 48 },
  stakes: { title: 6, elements: [14, 26], caption: 48 },
  roundtrip: { title: 8, elements: [16, 32, 52], caption: 60 },
  classify: { title: 6, elements: [12, 22, 34], caption: 48 },
  rails: { title: 6, elements: [12, 20, 28, 36], caption: 50 },
  sdk: { title: 6, elements: [14, 26, 40], caption: 52 },
  proof: { title: 6, elements: [12, 22, 34], caption: 52 },
  cta: { title: 10, elements: [24, 38, 52], caption: 72 },
};

export const COPY = {
  cover: {
    eyebrow: "Ship log · Refund",
    title: "Money-back rail",
    subtitle: "Your agent pays per call. If the call fails, the money comes back.",
    caption: "On-chain USDC. Same rail it paid on.",
  },
  stakes: {
    eyebrow: "The risk",
    title: "Paid. Then 5xx. Money gone.",
    left: {
      title: "Agent pays",
      body: "x402 settles. USDC leaves the wallet.",
    },
    right: {
      title: "Provider fails",
      body: "Timeout. Network drop. Upstream 500. No receipt.",
    },
    caption: "One 402. One payment. No receipt if it breaks.",
  },
  roundtrip: {
    eyebrow: "In-house refund",
    title: "The call fails. The money comes back.",
    caption: "Classify. Cap. Ledger. Send USDC back.",
  },
  classify: {
    eyebrow: "How it pays back",
    title: "Classify. Cap. Stamp the ledger.",
    chips: [
      { id: "5xx", label: "5xx", detail: "upstream_5xx" },
      { id: "timeout", label: "Timeout", detail: "request_timeout" },
      { id: "network", label: "Network", detail: "network_error" },
    ],
    cap: { label: "Per-call cap", value: "$1 default" },
    ledger: {
      statusFrom: "pending",
      statusTo: "sent",
      amount: "$0.03",
      chain: "solana",
      signature: "5kRfndDemoTx…sent",
    },
    caption: "Idempotent. One payout per paid call.",
  },
  rails: {
    eyebrow: "Same rail",
    title: "Refunded on the rail it paid on.",
    items: [
      { id: "solana", label: "Solana", detail: "USDC SPL" },
      { id: "base", label: "Base", detail: "eip155:8453" },
      { id: "xlayer", label: "X Layer", detail: "eip155:196" },
      { id: "algorand", label: "Algorand", detail: "USDC ASA" },
    ],
    caption: "Treasury sends USDC. The receipt is the tx.",
  },
  sdk: {
    eyebrow: "Agent path",
    title: "Wrap fetch. Cover the call.",
    codeLines: [
      'import { wrapFetchWithSyraRefund } from "@syra-ai/x402-refund";',
      "",
      "const fetch = wrapFetchWithSyraRefund(paid, {",
      "  refundTo: process.env.AGENT_WALLET,",
      "  payer: paid,",
      "});",
    ],
    notes: [
      { label: "Relay", value: "POST /refund/relay" },
      { label: "Premium", value: "$0.002 flat" },
      { label: "Hosted", value: "Coverage rolling out" },
    ],
    caption: "npm i @syra-ai/x402-refund. Check GET /refund/status first.",
  },
  proof: {
    eyebrow: "Receipts",
    title: "The payout is a transaction.",
    stats: [
      { label: "Paid / 7d", value: "43,465" },
      { label: "Settled / 7d", value: "$5,924" },
      { label: "Lookup", value: "GET /refund/claims" },
    ],
    rows: [
      { chain: "solana", amount: "$0.03", status: "sent", sig: "5kRfnd…aH2s" },
      { chain: "base", amount: "$0.20", status: "sent", sig: "0xf4e1…c91b" },
      { chain: "xlayer", amount: "$0.05", status: "sent", sig: "0x7ab2…e044" },
    ],
    caption: "Scale on Syra rails. Refunds return on those same rails.",
  },
  cta: {
    eyebrow: "Live on Syra routes",
    title: "Wrap your fetch. Get your money back.",
    links: [
      { label: "SDK", value: "npm i @syra-ai/x402-refund" },
      { label: "Docs", value: "docs.syraa.fun/docs/build/refund" },
      { label: "Status", value: "api.syraa.fun/refund/status" },
    ],
    caption: "Internal refunds live. Hosted coverage rolling out.",
  },
} as const;

export function sceneById(id: string): PromoScene {
  const s = PROMO_SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`Missing scene ${id}`);
  return s;
}
