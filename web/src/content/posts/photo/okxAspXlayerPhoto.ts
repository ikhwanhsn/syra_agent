import { OKX_ASP_XLAYER_POST } from "../okxAspXlayerUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { OKX_ASP_XLAYER_PHOTO_SHARE_COPIES } from "./shareCopies/okxAspXlayerShareCopies";

const copies = OKX_ASP_XLAYER_PHOTO_SHARE_COPIES;

/** Photo deck: OKX ASP + X Layer x402 + $SYRA flywheel (update #21). */
export const OKX_ASP_XLAYER_PHOTO = definePhotoUpdate(OKX_ASP_XLAYER_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "OKX ASP #2311 · X Layer",
      title: "Syra ?- OKX",
      subtitle: "Official Agent Service Provider on OKX.AI. X Layer x402. Every agent payment fuels $SYRA buybacks.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The thesis",
      headline: "OKX distribution meets $SYRA demand.",
      body: "Millions of OKX wallets. Syra is ASP #2311 with 28+ paid APIs. ~80% of x402 revenue buys $SYRA for holder airdrops. More agent usage = more on-chain buy pressure.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Every agent payment is a vote for $SYRA.",
      narrative: "OKX marketplace discovery. X Layer USDT settlement. Jupiter buybacks from real API revenue. Usage, not hype.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Flywheel",
      headline: "Pay ? revenue ? $SYRA.",
      steps: [
        { step: "01", title: "Discover on OKX.AI", description: "Agentic Wallet finds Syra ASP #2311." },
        { step: "02", title: "Pay USDT on X Layer", description: "x402 micropayment per API call." },
        { step: "03", title: "Get intelligence", description: "Signals, news, brain, OpenRouter APIs." },
        { step: "04", title: "Buyback $SYRA", description: "~80% revenue ? Jupiter buyback pool." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "OKX ?- Syra. Live stack.",
      steps: [
        { step: "01", title: "ASP #2311", description: "ERC-8004 identity on X Layer mainnet." },
        { step: "02", title: "A2MCP catalog", description: "28+ pay-per-call crypto APIs listed." },
        { step: "03", title: "A2A Brain", description: "Negotiated research agent service." },
        { step: "04", title: "OKX x402", description: "USDT0 facilitator on eip155:196." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four engines for $SYRA demand.",
      cards: [
        { title: "OKX.AI", subtitle: "Discovery", detail: "ASP listing puts Syra in front of OKX agents.", accent: "gold" },
        { title: "X Layer", subtitle: "USDT x402", detail: "Native checkout for Agentic Wallets.", accent: "gold" },
        { title: "Buybacks", subtitle: "~80% fees", detail: "Revenue swaps to $SYRA for airdrops.", accent: "gold" },
        { title: "Staking", subtitle: "Discounts", detail: "Holders pay less. Use more APIs." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What this means for holders.",
      highlights: [
        "OKX agent payments = real x402 revenue",
        "Revenue buys $SYRA on Jupiter (production)",
        "Buyback pool reserved for community airdrops",
        "Stake $SYRA for tiered API discounts",
        "First-mover ASP before public listing",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Usage-backed token utility.",
      stats: [
        { value: "#2311", label: "OKX ASP" },
        { value: "28+", label: "Paid APIs" },
        { value: "~80%", label: "? buyback" },
      ],
      narrative: "OKX agents pay per call. Syra captures revenue. $SYRA holders share the upside.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Revenue buys $SYRA.",
      stats: [{ value: "~80%", label: "Fees to buyback" }],
      narrative: "Not vapor. Production x402 settles, buyback runs on every paid call. Accumulate before OKX listing goes live.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Crypto APIs vs. agent-economy scale.",
      compareLeft: {
        title: "Before",
        body: "Solana/Base x402 only. Limited OKX wallet reach. Token story disconnected from OKX agents.",
      },
      compareRight: {
        title: "Now",
        body: "OKX.AI ASP. X Layer USDT. Every OKX payment feeds $SYRA buybacks.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "ASP #2311 · listing review",
      partnerName: "OKX",
      partnerLogo: "/images/partners/placeholder.svg",
      headline: "Syra ?- OKX",
      subtitle: "Machine money for the OKX agent economy. Pay per call. Buy $SYRA.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Stack",
      headline: "OKX rails + $SYRA capture.",
      items: [
        "OKXFacilitatorClient on api.syraa.fun",
        "USDT0 accepts on eip155:196",
        "buybackSYRAFromRevenue in production",
        "Staking tiers cut API cost for holders",
        "OpenAPI + 28-route x402 catalog",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Alignment",
      headline: "Agents pay. Holders win.",
      body: "OKX Agentic Wallets discover Syra and pay USDT per intelligence call. $SYRA stakers get discounts and share the buyback airdrop pool.",
      highlights: [
        "OKX: discovery + X Layer checkout",
        "$SYRA: stake, hold, airdrop share",
        "Flywheel: usage ? revenue ? buyback",
        "Position before listing goes public",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "X Layer payment ? $SYRA buyback.",
      terminalLines: [
        "$ curl api.syraa.fun/news",
        "< HTTP/402 · eip155:196 USDT0",
        "$ okx-wallet pay xlayer",
        "< HTTP/200 · headlines unlocked",
        "> buyback: $SYRA swap queued",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "OKX agents are coming. Position in $SYRA.",
      subtitle: "Stake for discounts. Hold for the buyback flywheel. Try the playground today.",
      links: [
        { label: "Playground", value: "syraa.fun/playground", href: "https://www.syraa.fun/playground" },
        { label: "$SYRA", value: "syraa.fun", href: "https://www.syraa.fun" },
        { label: "OKX.AI", value: "Agent marketplace", href: "https://www.okx.ai" },
      ],
    }),
  },
]);
