import { BNB_X402_POST } from "../bnbX402Update";
import type { PostPhotoUpdate } from "./types";

/**
 * Photo-format content for the BNB x402 ship log.
 * Swap ACTIVE_PHOTO_POST in index.ts when publishing the next update.
 * Meta and share copy live in the video post file (single source of truth).
 */
export const BNB_X402_PHOTO: PostPhotoUpdate = {
  meta: BNB_X402_POST.meta,
  /** Best templates for this update — tuned to announcement, flow, tokens, impact, and CTA. */
  picks: [
    "photo-cover-spotlight",
    "photo-flow-pipeline",
    "photo-cards-quad",
    "photo-stat-trio",
    "photo-comparison",
    "photo-closing-cta",
  ],
  content: {
    eyebrow: "Ship log",
    badge: "B402 · eip155:56",
    title: "x402 on BNB",
    subtitle: "Pay-per-call intelligence APIs now settle on BNB Smart Chain via Binance B402.",
    kicker: "Why this matters",
    headline: "Agents don't stop at one chain.",
    body: "Syra already powers autonomous traders on Solana and Base. BNB Smart Chain is one of the largest EVM ecosystems, so our APIs needed native x402 settlement there, not a bridge workaround.",
    quote: "List once on x402 directories, settle where your treasury lives.",
    highlights: [
      "BSC network id eip155:56 in 402 accepts",
      "B402 verify + settle on paid API calls",
      "Micro-unit pricing mapped to 18-decimal BSC stables",
      "Full merchant inbound on BSC via Binance B402",
    ],
    steps: [
      { step: "01", title: "Call the API", description: "Agent or playground hits a paid Syra endpoint." },
      { step: "02", title: "402 + BSC option", description: "Server returns Payment Required with B402 on eip155:56." },
      { step: "03", title: "Sign on BSC", description: "Wallet signs EIP-3009 or Permit2 via MetaMask on BSC." },
      { step: "04", title: "Unlock intelligence", description: "B402 verifies and settles; Syra returns the result." },
    ],
    cards: [
      { title: "USD1", subtitle: "EIP-3009", detail: "World Liberty Financial USD with transfer authorization.", accent: "gold" },
      { title: "U", subtitle: "EIP-3009", detail: "United Stables. Same signing flow as USD1.", accent: "gold" },
      { title: "USDC", subtitle: "Permit2", detail: "BNB-pegged USDC on BSC via Permit2 signing." },
      { title: "USDT", subtitle: "Permit2", detail: "Tether on BSC. Configurable via B402_TOKEN." },
    ],
    stats: [
      { value: "3", label: "Payment chains live" },
      { value: "4", label: "BSC stable options" },
      { value: "402", label: "HTTP-native micropayments" },
    ],
    narrative: "BNB-native agents can now pay for Nansen-grade flows, market data, and research tools without leaving their chain.",
    links: [
      { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
      { label: "Docs", value: "B402 · x402 reference", href: "https://docs.syraa.fun/docs/api-reference" },
      { label: "B402 spec", value: "Binance Onchain Pay", href: "https://developers.binance.com/docs/onchainpay-x402/introduction" },
    ],
    items: [
      "API Playground with Binance chain tab",
      "Agent wallet BSC funding and signing",
      "Agent chat tools with x402 injection",
      "Shared x402 v2 core across Solana, Base, BSC",
    ],
    compareLeft: {
      title: "Before",
      body: "BNB agents bridged or skipped paid Syra APIs. No native B402 settlement path.",
    },
    compareRight: {
      title: "Now",
      body: "402 → sign on BSC → verify/settle via Binance B402. Same brain, BNB-native treasury.",
    },
    terminalLines: [
      "$ curl api.syraa.fun/v1/intelligence",
      "< HTTP/402 Payment Required",
      "< x402-accepts: B402 eip155:56 USD1",
      "$ syra-x402 pay --chain bsc --token USD1",
      "> signing EIP-3009 on MetaMask…",
      "< HTTP/200 OK · intelligence payload unlocked",
    ],
  },
};
