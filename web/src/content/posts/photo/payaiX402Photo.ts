import { PAYAI_X402_POST } from "../payaiX402Update";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { PAYAI_X402_PHOTO_SHARE_COPIES } from "./shareCopies/payaiX402ShareCopies";

const copies = PAYAI_X402_PHOTO_SHARE_COPIES;

/** Photo-format content for the PayAI all-networks ship log — 15 cards, 15 X posts. */
export const PAYAI_X402_PHOTO = definePhotoUpdate(PAYAI_X402_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "PayAI · 16 networks",
      title: "PayAI × Syra",
      subtitle: "Every PayAI-supported x402 network is live. Pay on Solana, Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, or X Layer.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The shift",
      headline: "Syra now uses all PayAI networks.",
      body: "We migrated our x402 facilitator to PayAI and enabled every network in their supported stack. Agents, playground, and external callers settle through facilitator.payai.network on the chain that matches their USDC.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Every chain PayAI supports. One Syra checkout.",
      narrative: "16 networks in dev. Eight mainnets in production. Same x402 v2 middleware. Pay where your treasury already lives.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "402 → PayAI → intelligence.",
      steps: [
        { step: "01", title: "Call paid API", description: "Playground, agent, or external x402 client." },
        { step: "02", title: "Multi-network 402", description: "Payment Required lists every enabled PayAI network." },
        { step: "03", title: "Sign USDC", description: "Pay on Solana or any supported EVM chain." },
        { step: "04", title: "PayAI settles", description: "Verify + settle on-chain. Payload unlocked." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Migration",
      headline: "Corbits out. PayAI in. Full coverage.",
      steps: [
        { step: "01", title: "Facilitator switch", description: "Default verify/settle via facilitator.payai.network." },
        { step: "02", title: "Network table", description: "All 16 PayAI CAIP-2 IDs in Syra config." },
        { step: "03", title: "USDC alignment", description: "Assets matched to PayAI settlement expectations." },
        { step: "04", title: "Agents unchanged", description: "Agent-to-agent x402 still works on Solana rails." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Production mainnets on PayAI.",
      cards: [
        { title: "Solana", subtitle: "SVM exact", detail: "Mainnet USDC. Agent auto-pay and playground.", accent: "gold" },
        { title: "Base + Polygon", subtitle: "Core EVM", detail: "eip155:8453 and eip155:137 native USDC.", accent: "gold" },
        { title: "Arbitrum + Avalanche", subtitle: "Core EVM", detail: "eip155:42161 and eip155:43114.", accent: "gold" },
        { title: "Sei · SKALE · X Layer", subtitle: "Extended EVM", detail: "eip155:1329 · 1187947933 · 196." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What ships with this update.",
      highlights: [
        "PayAI facilitator default on all paid Syra APIs",
        "16 PayAI networks in 402 accepts (8 mainnets in prod)",
        "Multi-network Solana + EVM USDC checkout",
        "Agent-to-agent and external x402 clients supported",
        "BSC B402 lane still live alongside PayAI",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Full PayAI coverage.",
      stats: [
        { value: "16", label: "PayAI networks" },
        { value: "8", label: "Mainnets live" },
        { value: "402", label: "HTTP-native checkout" },
      ],
      narrative: "From Solana to X Layer, Syra advertises every network PayAI documents and settles through their facilitator.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "All PayAI networks. One brain.",
      stats: [{ value: "16", label: "Networks enabled" }],
      narrative: "No single-chain lock-in. No facilitator sunset. Pay on the network where your USDC already sits.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Partial coverage vs. full PayAI stack.",
      compareLeft: {
        title: "Before",
        body: "Corbits facilitator. Limited network list. Shutdown approaching.",
      },
      compareRight: {
        title: "Now",
        body: "PayAI default. All documented networks. Production auth and settlement.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live · PayAI facilitator",
      title: "Syra × PayAI",
      subtitle: "Every PayAI x402 network enabled on Syra intelligence APIs.",
      body: "Solana, Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, X Layer, and testnets. Pay per call.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "PayAI-native x402 v2.",
      items: [
        "payaiX402Networks mirrors PayAI supported-networks docs",
        "Profile-aware resource server and 402 offer builders",
        "PayAI JWT auth for settlement beyond free tier",
        "Jupiter Ultra + trending on direct APIs",
        "B402 BSC remains for BNB-native treasuries",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Multi-network",
      headline: "PayAI everywhere Syra charges.",
      body: "Playground, agent chat tools, brain API, and external agent callers all hit the same PayAI-backed payment middleware.",
      highlights: [
        "Solana: agent wallet auto-pay",
        "EVM: Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, X Layer",
        "BSC: B402 alongside PayAI",
        "External agents: any offered network",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Multi-network 402 in the wild.",
      terminalLines: [
        "$ curl api.syraa.fun/health",
        "< HTTP/402 Payment Required",
        "< accepts: solana, base, polygon, arbitrum, avalanche…",
        "$ syra-x402 pay --network base",
        "> signing USDC on Base…",
        "< HTTP/200 OK · PayAI settled",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Every PayAI network. One Syra brain.",
      subtitle: "Hit a paid endpoint. Pay on your chain. Unlock intelligence.",
      links: [
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "PayAI", value: "Supported networks", href: "https://docs.payai.network/x402/supported-networks" },
        { label: "Docs", value: "x402 API reference", href: "https://docs.syraa.fun/docs/api-reference" },
      ],
    }),
  },
]);
