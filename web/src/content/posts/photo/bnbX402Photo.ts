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
      subtitle: "Pay-per-call intelligence APIs settle on BSC via Binance B402. Your treasury stays on BNB.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "BNB builders shouldn't bridge to pay.",
      body: "Syra agents trade on Solana and Base. BNB Smart Chain is one of the largest EVM ecosystems. Intelligence APIs needed native x402 settlement there, not a bridge workaround.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "List once. Settle where your treasury lives.",
      narrative: "Solana, Base, and BSC: one intelligence stack, three native payment rails.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "402 → sign on BSC → unlock data.",
      steps: [
        { step: "01", title: "Call the API", description: "Agent or playground hits a paid Syra endpoint." },
        { step: "02", title: "402 + BSC option", description: "Server returns Payment Required with B402 on eip155:56." },
        { step: "03", title: "Sign on BSC", description: "Wallet signs EIP-3009 or Permit2 via MetaMask." },
        { step: "04", title: "Payload unlocked", description: "B402 verifies and settles. Intelligence returned." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Checkout path",
      headline: "Native BSC treasury. Zero bridges.",
      steps: [
        { step: "01", title: "Paid endpoint", description: "Agent chat or playground calls a Syra intelligence API." },
        { step: "02", title: "HTTP 402", description: "B402 accept header with eip155:56 and stablecoin options." },
        { step: "03", title: "Sign on BSC", description: "MetaMask EIP-3009 or Permit2: USD1, U, USDC, or USDT." },
        { step: "04", title: "Settled natively", description: "B402 verify + settle. Payload unlocked on BSC." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Pay with the stable your treasury holds.",
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
      headline: "Live for BNB builders today.",
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
      headline: "Your treasury's chain. Native checkout.",
      stats: [
        { value: "3", label: "Payment chains live" },
        { value: "4", label: "BSC stable options" },
        { value: "402", label: "HTTP-native micropayments" },
      ],
      narrative: "BNB-native agents pay for Nansen-grade flows, market data, and research without bridging or leaving BSC.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Pay per call. Not per month.",
      stats: [{ value: "402", label: "HTTP-native micropayments" }],
      narrative: "Hit an endpoint, get a price, sign on BSC, unlock intelligence. No API keys. No subscriptions.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Bridge to pay vs pay on BNB.",
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
      subtitle: "Intelligence APIs settle natively on BNB Smart Chain. Pay per call.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "Shared x402 v2 core. Three chains.",
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
      body: "Solana and Base x402 for existing agents. B402 on eip155:56 for BNB builders. No bridge workaround.",
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
      headline: "x402 checkout from terminal.",
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
      headline: "Build on BNB. Pay on BNB. Stay on BNB.",
      subtitle: "Hit a paid endpoint. Get 402. Sign with MetaMask. Unlock intelligence.",
      links: [
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "Docs", value: "B402 · x402 reference", href: "https://docs.syraa.fun/docs/api-reference" },
        { label: "B402 spec", value: "Binance Onchain Pay", href: "https://developers.binance.com/docs/onchainpay-x402/introduction" },
      ],
    }),
  },
]);
