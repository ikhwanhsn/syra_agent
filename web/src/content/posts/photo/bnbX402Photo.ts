import { BNB_X402_POST } from "../bnbX402Update";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { BNB_X402_PHOTO_SHARE_COPIES } from "./shareCopies/bnbX402ShareCopies";

const copies = BNB_X402_PHOTO_SHARE_COPIES;

/** Photo-format content for the BNB x402 ship log — 15 cards, 15 X posts. */
export const BNB_X402_PHOTO = definePhotoUpdate(BNB_X402_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "B402 · eip155:56",
      title: "x402 on BNB",
      subtitle: "Pay-per-call intelligence APIs now settle on BNB Smart Chain via Binance B402.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "Why this matters",
      headline: "Agents don't stop at one chain.",
      body: "Syra already powers autonomous traders on Solana and Base. BNB Smart Chain is one of the largest EVM ecosystems — our APIs needed native x402 settlement there, not a bridge workaround.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "List once on x402 directories, settle where your treasury lives.",
      narrative: "Solana, Base, and BSC — one intelligence stack, three native payment rails.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "BNB settlement flow",
      headline: "402 → sign on BSC → unlock intelligence.",
      steps: [
        { step: "01", title: "Call the API", description: "Agent or playground hits a paid Syra endpoint." },
        { step: "02", title: "402 + BSC option", description: "Server returns Payment Required with B402 on eip155:56." },
        { step: "03", title: "Sign on BSC", description: "Wallet signs EIP-3009 or Permit2 via MetaMask on BSC." },
        { step: "04", title: "Unlock intelligence", description: "B402 verifies and settles; Syra returns the result." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Checkout path",
      headline: "Native BSC treasury. No bridge.",
      steps: [
        { step: "01", title: "Paid endpoint", description: "Agent chat or playground calls a Syra intelligence API." },
        { step: "02", title: "HTTP 402", description: "B402 accept header with eip155:56 and stablecoin options." },
        { step: "03", title: "Sign on BSC", description: "MetaMask EIP-3009 or Permit2 — USD1, U, USDC, or USDT." },
        { step: "04", title: "Payload unlocked", description: "B402 verify + settle. Intelligence returned natively." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four BSC stablecoins. One checkout.",
      cards: [
        { title: "USD1", subtitle: "EIP-3009", detail: "World Liberty Financial USD with transfer authorization.", accent: "gold" },
        { title: "U", subtitle: "EIP-3009", detail: "United Stables. Same signing flow as USD1.", accent: "gold" },
        { title: "USDC", subtitle: "Permit2", detail: "BNB-pegged USDC on BSC via Permit2 signing." },
        { title: "USDT", subtitle: "Permit2", detail: "Tether on BSC. Configurable via B402_TOKEN." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What's live for BNB builders.",
      highlights: [
        "BSC network id eip155:56 in 402 accepts",
        "B402 verify + settle on paid API calls",
        "Micro-unit pricing mapped to 18-decimal BSC stables",
        "Full merchant inbound on BSC via Binance B402",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Multi-chain treasuries deserve multi-chain checkout.",
      stats: [
        { value: "3", label: "Payment chains live" },
        { value: "4", label: "BSC stable options" },
        { value: "402", label: "HTTP-native micropayments" },
      ],
      narrative: "BNB-native agents can now pay for Nansen-grade flows, market data, and research tools without leaving their chain.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "HTTP-native micropayments.",
      stats: [{ value: "402", label: "Pay per call · no subscription" }],
      narrative: "Hit an endpoint, get a price, sign on your chain, unlock intelligence. Now native on BSC via Binance B402.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Before vs now.",
      compareLeft: {
        title: "Before",
        body: "BNB agents bridged or skipped paid Syra APIs. No native B402 settlement path.",
      },
      compareRight: {
        title: "Now",
        body: "402 → sign on BSC → verify/settle via Binance B402. Same brain, BNB-native treasury.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · B402 · eip155:56",
      partnerName: "Binance",
      partnerLogo: "/images/partners/binance.png",
      headline: "Syra × Binance B402",
      subtitle: "Pay-per-call intelligence APIs settle natively on BNB Smart Chain.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Shared x402 v2 core across three chains.",
      items: [
        "API Playground with Binance chain tab",
        "Agent wallet BSC funding and signing",
        "Agent chat tools with x402 injection",
        "Shared x402 v2 core across Solana, Base, BSC",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Multi-chain",
      headline: "One stack. Three native treasuries.",
      body: "Solana and Base x402 rails for existing agents. B402 on eip155:56 for BNB builders — no bridge workaround.",
      highlights: [
        "Solana: autonomous traders + x402",
        "Base: agent wallet + facilitator",
        "BSC: B402 EIP-3009 + Permit2",
        "Same intelligence APIs across all three",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "x402 on BSC from CLI.",
      terminalLines: [
        "$ curl api.syraa.fun/v1/intelligence",
        "< HTTP/402 Payment Required",
        "< x402-accepts: B402 eip155:56 USD1",
        "$ syra-x402 pay --chain bsc --token USD1",
        "> signing EIP-3009 on MetaMask…",
        "< HTTP/200 OK · intelligence payload unlocked",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "BNB-native agents: your payment rail is live.",
      subtitle: "Hit a paid endpoint. Get 402. Sign with MetaMask. Unlock intelligence.",
      links: [
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "Docs", value: "B402 · x402 reference", href: "https://docs.syraa.fun/docs/api-reference" },
        { label: "B402 spec", value: "Binance Onchain Pay", href: "https://developers.binance.com/docs/onchainpay-x402/introduction" },
      ],
    }),
  },
]);
