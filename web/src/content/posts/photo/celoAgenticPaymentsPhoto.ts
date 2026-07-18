import { CELO_AGENTIC_PAYMENTS_POST } from "../celoAgenticPaymentsUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { CELO_AGENTIC_PAYMENTS_PHOTO_SHARE_COPIES } from "./shareCopies/celoAgenticPaymentsShareCopies";

const copies = CELO_AGENTIC_PAYMENTS_PHOTO_SHARE_COPIES;

/** Photo-format content for Celo Agentic Payments ship log. 15 cards, 15 X posts. */
export const CELO_AGENTIC_PAYMENTS_PHOTO = definePhotoUpdate(CELO_AGENTIC_PAYMENTS_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "x402 · ERC-8021 · 8004",
      title: "Celo × Syra",
      subtitle:
        "Agentic x402 on Celo mainnet. Tagged USDC volume for Most Revenue + Most x402 Payments.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The rule",
      headline: "No tag, no leaderboard credit.",
      body: "Dune only scores txs with your locked ERC-8021 suffix. Syra self-settles Exact USDC and appends that tag on every settle and refund.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Pay per call. Tag every settle. Climb the board.",
      narrative:
        "Labs Celo rail: x402 → EIP-3009 → self-settle → ERC-8021 dataSuffix. Same Syra brain, Celo treasury.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Volume loop",
      headline: "Fund. Pay. Settle tagged.",
      steps: [
        { step: "01", title: "Fund wallet", description: "CELO gas + USDC on Labs Celo tab." },
        { step: "02", title: "Call insights", description: "Payer hits paid APIs with chain=celo." },
        { step: "03", title: "Self-settle", description: "EIP-3009 + ERC-8021 dataSuffix on-chain." },
        { step: "04", title: "Refund loop", description: "Tagged refunds keep sims clean." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "From config to 8004 identity.",
      steps: [
        { step: "01", title: "Chain config", description: "Celo USDC + facilitator profile." },
        { step: "02", title: "Self-settle", description: "Tagged transferWithAuthorization." },
        { step: "03", title: "Labs UI", description: "Celo tab: wallets, sim, schedule." },
        { step: "04", title: "ERC-8004", description: "Syra agent #9673 on Celo." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One Celo checkout.",
      cards: [
        { title: "Network", subtitle: "42220", detail: "Celo mainnet · eip155:42220.", accent: "gold" },
        { title: "USDC", subtitle: "Exact", detail: "EIP-3009 micropayments.", accent: "gold" },
        { title: "Settle", subtitle: "Self", detail: "Syra settler + Celo x402 verify." },
        { title: "Tag", subtitle: "8021", detail: "Hackathon attribution on every tx." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Hackathon checklist. Live now.",
      highlights: [
        "Labs Celo tab beside Solana and Base",
        "Self-settled USDC on paid insight calls",
        "ERC-8021 tag on settle and refund",
        "ERC-8004 Syra #9673 on 8004scan",
        "Tracks: Most Revenue + Most x402 Payments",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Registered and shipping.",
      stats: [
        { value: "9673", label: "ERC-8004 agent" },
        { value: "2", label: "Prize tracks" },
        { value: "8021", label: "Tag on settle" },
      ],
      narrative: "Attribution locked on celobuilders. Identity live. Volume runs through Labs Celo.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "On-chain agent identity.",
      stats: [{ value: "#9673", label: "Celo ERC-8004" }],
      narrative: "Syra on Celo Identity Registry. Discoverable on 8004scan for the hackathon submission.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Untagged volume vs tagged settle.",
      compareLeft: {
        title: "Before",
        body: "No Celo Labs rail. No self-settle path that stamps ERC-8021 for Dune KPIs.",
      },
      compareRight: {
        title: "Now",
        body: "Labs → Celo → pay → tagged settle → climb Most Revenue + Most x402 Payments.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Hackathon",
      badge: "Agentic Payments & DeFAI",
      partnerName: "Celo",
      partnerLogo: "/images/partners/celo.png",
      partnerLogoSolidBg: true,
      headline: "Syra × Celo",
      subtitle: "x402 self-settle, ERC-8021 tags, ERC-8004 agent #9673. Building for @CeloDevs.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Wired into Syra API + Labs.",
      items: [
        "celoX402Networks.js: CAIP-2 + USDC + facilitator",
        "celoX402Settle.js: self-settle + toDataSuffix",
        "labX402Payer.js: ExactEvmScheme on 42220",
        "Labs UI: Celo tab wallets / sim / schedule",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Multi-chain Labs",
      headline: "Solana. Base. Now Celo.",
      body: "Same Labs ops model: wallets, deposit, simulation, scheduled payers, with Celo self-settle and hackathon attribution.",
      highlights: [
        "Solana SPL USDC loop",
        "Base Exact EVM payers",
        "Celo tagged self-settle",
        "One /labs surface",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Celo 402 in the lab.",
      terminalLines: [
        "$ Labs → Celo → fund USDC + CELO",
        "$ POST /insights · x-lab-x402-chain: celo",
        "< HTTP/402 · eip155:42220 · USDC",
        "$ self-settle + ERC-8021 dataSuffix",
        "< HTTP/200 · Payment-Response",
        "> tagged tx → Dune leaderboard",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Building on Celo. Tagged payments.",
      subtitle: "Open Labs → Celo. Fund. Run volume. Watch the board.",
      links: [
        { label: "Labs", value: "syraa.fun/labs", href: "https://www.syraa.fun/labs" },
        { label: "8004scan", value: "celo/9673", href: "https://8004scan.io/agents/celo/9673" },
        {
          label: "Leaderboard",
          value: "Dune",
          href: "https://dune.com/celo/agentic-payments-defai-hackathon",
        },
      ],
    }),
  },
]);
