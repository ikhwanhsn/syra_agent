import { SWAP_POST } from "../swapUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { SWAP_PHOTO_SHARE_COPIES } from "./shareCopies/swapShareCopies";

const copies = SWAP_PHOTO_SHARE_COPIES;

/** Photo-format content for the Jupiter Swap ship log — 15 cards, 15 X posts. */
export const SWAP_PHOTO = definePhotoUpdate(SWAP_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Earn · Jupiter · Non-custodial",
      title: "Jupiter Swap",
      subtitle: "Wallet-signed swaps at Jupiter prices. Staking and Swap together under Earn.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Research without execution is half a product.",
      body: "Syra surfaces intelligence, agents, and portfolio context. Traders still left to swap elsewhere. Jupiter Swap closes the loop on /swap with the wallet you already connected.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Research on Syra. Swap on Syra.",
      narrative: "Same connected wallet from chat to trade. Jupiter routes. Syra quote adapter and premium swap UI — no custodial keys.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How to swap",
      headline: "Quote to chain in four steps.",
      steps: [
        { step: "01", title: "Open Swap", description: "Earn → Swap or syraa.fun/swap. Connect wallet." },
        { step: "02", title: "Pick tokens", description: "Search verified tokens. Balances + Max on input." },
        { step: "03", title: "Review quote", description: "Live Jupiter quote with slippage and route details." },
        { step: "04", title: "Sign + submit", description: "Sign in wallet. Tx broadcasts with Solscan link." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "Full swap stack in one pass.",
      steps: [
        { step: "01", title: "Earn nav", description: "Navbar dropdown: Staking + Swap under Earn." },
        { step: "02", title: "Jupiter UI API", description: "Quote, swap build, token search on /jupiter/ui." },
        { step: "03", title: "Swap card UI", description: "Debounced quotes, slippage, token picker." },
        { step: "04", title: "Wallet execute", description: "Client sign + RPC send. Referral fee when set." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One swap card.",
      cards: [
        { title: "Quote", subtitle: "Jupiter adapter", detail: "Syra API proxies quote + referral feeAccount.", accent: "gold" },
        { title: "Tokens", subtitle: "Verified search", detail: "Jupiter Tokens V2 with lazy scroll + presets.", accent: "gold" },
        { title: "Settings", subtitle: "Slippage bps", detail: "Preset or custom tolerance. Auto quote refresh." },
        { title: "Execute", subtitle: "Your wallet", detail: "Sign VersionedTransaction. Broadcast immediately." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Jupiter Swap is live now.",
      highlights: [
        "Earn nav groups Staking and Swap",
        "Any Solana token via Jupiter routes",
        "Balances, Max preset, quote details",
        "Phantom, Privy, Solflare, Backpack signing",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "One session. Full loop.",
      stats: [
        { value: "1", label: "Connected wallet" },
        { value: "3", label: "Free UI routes" },
        { value: "0", label: "Custodial keys" },
      ],
      narrative: "Read intelligence. Swap in place. Same wallet throughout.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Sign once. Submit fast.",
      stats: [{ value: "⚡", label: "Instant broadcast UX" }],
      narrative: "Success on sendRawTransaction. Background confirm. Solscan link for finality.",
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
        body: "Research on Syra. Swap on a separate DEX. Reconnect wallet. Lose session context.",
      },
      compareRight: {
        title: "Now",
        body: "Earn → Swap on Syra. Jupiter prices. Same wallet from signal to execution.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · Earn · Swap",
      partnerName: "Jupiter",
      partnerLogo: "/images/partners/jupiter.png",
      headline: "Syra × Jupiter",
      subtitle: "Best-route swaps from your connected wallet. Referral adapter on Syra API.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Swap UI API for builders.",
      items: [
        "GET /jupiter/ui/quote — inputMint, outputMint, amount, slippageBps",
        "POST /jupiter/ui/swap — quoteResponse + userPublicKey → swap tx",
        "GET /jupiter/ui/tokens — search + verified bootstrap list",
        "Client: sign + sendRawTransaction with RPC fallback",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Earn section",
      headline: "Stake for yield. Swap for execution.",
      body: "Navbar Earn dropdown groups Streamflow staking locks and Jupiter swap in one place. Pick the action that matches your intent.",
      highlights: [
        "Staking → /staking locks",
        "Swap → /swap Jupiter routes",
        "Dashboard quick action to Swap",
        "Free /jupiter/ui routes for the UI",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Pull a quote from the API.",
      terminalLines: [
        "$ curl syraa.fun/jupiter/ui/quote?inputMint=So11...&amount=1000000",
        "> outAmount · priceImpactPct · routePlan",
        "> platformFeeBps · referral feeAccount",
        "$ curl -X POST syraa.fun/jupiter/ui/swap",
        "> swapTransaction (base64) · lastValidBlockHeight",
        "< 200 ok · free UI route",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Swap any Solana token on Syra.",
      subtitle: "Earn → Swap. Connect wallet. Review quote. Sign once.",
      links: [
        { label: "Swap", value: "syraa.fun/swap", href: "https://www.syraa.fun/swap" },
        { label: "Staking", value: "syraa.fun/staking", href: "https://www.syraa.fun/staking" },
        { label: "Overview", value: "syraa.fun/overview", href: "https://www.syraa.fun/overview" },
      ],
    }),
  },
]);
