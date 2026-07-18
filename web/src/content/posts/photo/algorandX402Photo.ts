import { ALGORAND_X402_POST } from "../algorandX402Update";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { ALGORAND_X402_PHOTO_SHARE_COPIES } from "./shareCopies/algorandX402ShareCopies";

const copies = ALGORAND_X402_PHOTO_SHARE_COPIES;

/** Photo-format content for the Algorand x402 ship log: 15 cards, 15 X posts. */
export const ALGORAND_X402_PHOTO = definePhotoUpdate(ALGORAND_X402_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-aurora",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "AVM · USDC · Mainnet",
      title: "x402 on Algorand",
      subtitle: "Pay-per-call intelligence APIs settle USDC on Algorand Mainnet via GoPlausible. Your treasury stays on Algorand.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-neon",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Algorand builders should not bridge to pay.",
      body: "Syra agents settle on Solana, PayAI EVM chains, and BSC. Algorand is a major AVM for payments and agent wallets. Intelligence APIs needed native x402 settlement with USDC ASA and GoPlausible verify/settle.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote-gilded",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Settle where your treasury lives, including Algorand.",
      narrative: "Solana, PayAI EVM, BSC B402, and Algorand Mainnet in one x402 v2 surface. One Syra brain. Pay per call.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-conduit",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "402 → AVM → intelligence.",
      steps: [
        { step: "01", title: "Call paid API", description: "Playground, agent, or external x402 client." },
        { step: "02", title: "Algorand accept", description: "402 lists algorand:* network + USDC ASA 31566704." },
        { step: "03", title: "Sign transfer", description: "ASA transfer group. GoPlausible fee payer covers ALGO." },
        { step: "04", title: "Settle on-chain", description: "Verify genesis hash. Settle. Payload unlocked." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-flow-ledger",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Ship sequence",
      headline: "From config to mainnet proof.",
      steps: [
        { step: "01", title: "AVM resource server", description: "@x402-avm/core + GoPlausible facilitator client." },
        { step: "02", title: "402 middleware", description: "Algorand accept appended to every paid response." },
        { step: "03", title: "Agent client", description: "@x402-avm/fetch with mainnet Algod configuration." },
        { step: "04", title: "E2E validated", description: "402 → pay → verify_ok → 200 on GET /news." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-glass-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Algorand-native checkout stack.",
      cards: [
        { title: "Network", subtitle: "Mainnet", detail: "algorand:wGHE2… CAIP-2 genesis verified.", accent: "gold" },
        { title: "USDC ASA", subtitle: "31566704", detail: "Exact scheme · 6-decimal micropayments.", accent: "gold" },
        { title: "GoPlausible", subtitle: "Facilitator", detail: "Verify, settle, and fee payer sponsorship.", accent: "gold" },
        { title: "Challenge", subtitle: "Global x402", detail: "Leaderboard-ready mainnet volume." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-tiered",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What ships with this update.",
      highlights: [
        "algorand:* accept on every paid Syra API",
        "USDC ASA 31566704 on Algorand Mainnet",
        "GoPlausible fee payer in payment extra",
        "GET /x402/capabilities · algorand enabled",
        "validate-algorand-x402 npm script for E2E proof",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-halo",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Mainnet proof.",
      stats: [
        { value: "402", label: "Payment Required" },
        { value: "AVM", label: "Exact scheme" },
        { value: "200", label: "Paid response" },
      ],
      narrative: "Full loop validated: capabilities, 402 offers, signed USDC transfer, GoPlausible verify, and resource delivery.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-monolith",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "E2E confirmed on mainnet.",
      stats: [{ value: "200", label: "GET /news paid OK" }],
      narrative: "Genesis hash matched. Fee payer signed. Payment-Response header returned. Challenge-ready.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-compare-gradient",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Bridge to pay vs pay on Algorand.",
      compareLeft: {
        title: "Before",
        body: "Algorand agents bridged or skipped paid Syra APIs. No native AVM x402 path.",
      },
      compareRight: {
        title: "Now",
        body: "402 → USDC ASA on mainnet → GoPlausible settles. Same brain, Algorand treasury.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-beacon",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · GoPlausible · Mainnet",
      partnerName: "Algorand",
      partnerLogo: "/images/partners/algorand.svg",
      headline: "Syra × Algorand",
      subtitle: "x402 USDC payments on every paid intelligence API. Built for the Global x402 Challenge.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-statement-lattice",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "AVM-native x402 v2.",
      items: [
        "algorandX402Networks.js: CAIP-2 + USDC ASA config",
        "x402AvmResourceServer.js: GoPlausible singleton",
        "x402PaymentV2.js: Algorand verify/settle routing",
        "agentAvmX402Client.js: mainnet Algod client fix",
        "PaidApiCall.network field for challenge KPIs",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-frost",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Multi-rail",
      headline: "Four payment rails. One Syra checkout.",
      body: "Every paid endpoint advertises Solana, PayAI EVM networks, BSC B402, and Algorand. Clients pick the accept that matches their treasury.",
      highlights: [
        "Solana: agent wallet auto-pay",
        "EVM: PayAI on 8 mainnets",
        "BSC: B402 USD1 / USDC",
        "Algorand: GoPlausible USDC ASA",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Algorand 402 in the wild.",
      terminalLines: [
        "$ curl api.syraa.fun/x402/capabilities",
        '{ "algorand": { "enabled": true } }',
        "$ curl api.syraa.fun/news?ticker=general",
        "< HTTP/402 · accepts: algorand:wGHE2…",
        "$ npm run validate-algorand-x402",
        "< HTTP/200 OK · Payment-Response",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Algorand-native agents. Same Syra brain.",
      subtitle: "Hit a paid endpoint. Pay USDC on mainnet. Unlock intelligence.",
      links: [
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "GoPlausible", value: "AVM x402 docs", href: "https://facilitator.goplausible.xyz/docs" },
        { label: "Challenge", value: "Global x402", href: "https://algorand.co/global-x402-challenge" },
      ],
    }),
  },
]);
