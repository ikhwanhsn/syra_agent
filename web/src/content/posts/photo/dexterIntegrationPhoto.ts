import { DEXTER_INTEGRATION_POST } from "../dexterIntegrationUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { DEXTER_INTEGRATION_PHOTO_SHARE_COPIES } from "./shareCopies/dexterIntegrationShareCopies";

const copies = DEXTER_INTEGRATION_PHOTO_SHARE_COPIES;

/** Photo-format content for the Dexter onchain x402 ship log. */
export const DEXTER_INTEGRATION_PHOTO = definePhotoUpdate(DEXTER_INTEGRATION_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-brand",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "x402 · Onchain · Catalog",
      title: "Dexter × Syra",
      subtitle:
        "Beyond Labs facilitator settle — agents call Dexter activity and entity APIs over Solana x402.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Settlement without context is half a stack.",
      body: "Syra already settles Labs via Dexter. Agents now buy onchain activity and entity summaries from x402.dexter.cash with Solana USDC.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote-centered",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Pay for the settle. Pay for the signal.",
      narrative: "Same partner. Two Syra surfaces — Labs facilitator and agent spend tools.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-arrow-chain",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "402 on Dexter. Pay from Syra.",
      steps: [
        { step: "01", title: "Pick a tool", description: "Catalog free, or activity/entity." },
        { step: "02", title: "Probe x402", description: "x402.dexter.cash Payment Required." },
        { step: "03", title: "Agent pays", description: "Solana USDC from the Syra wallet." },
        { step: "04", title: "Onchain payload", description: "Volumes, counterparties, deltas." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-flow-zigzag",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "Facilitator, then spend tools.",
      steps: [
        { step: "01", title: "Facilitator", description: "Labs settle path (existing)." },
        { step: "02", title: "Client", description: "agentDexterClient + x402 helper." },
        { step: "03", title: "Catalog", description: "Free well-known discovery." },
        { step: "04", title: "Paid tools", description: "Activity + entity (~$0.05)." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-bento",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Two layers. One partner.",
      cards: [
        { title: "Facilitator", subtitle: "Labs", detail: "Existing settle rails unchanged.", accent: "gold" },
        { title: "Activity", subtitle: "Spend", detail: "Trade summaries + counterparties.", accent: "gold" },
        { title: "Entity", subtitle: "Spend", detail: "Token/wallet/trade insight." },
        { title: "Catalog", subtitle: "Free", detail: "/.well-known/x402 discovery." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-numbered",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What ships with this update.",
      highlights: [
        "dexter-x402-catalog free discovery",
        "Paid activity + entity agent tools",
        "Agent wallet Solana USDC checkout",
        "Labs facilitator path unchanged",
        "Partner page at /partner/dexter",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-halo",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Infrastructure + intelligence.",
      stats: [
        { value: "3", label: "Agent tools" },
        { value: "$0.05", label: "Activity / entity" },
        { value: "402", label: "Solana checkout" },
      ],
      narrative: "Dexter settles Labs and sells onchain context to Syra agents per call.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-monolith",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "x402.dexter.cash in agents.",
      stats: [{ value: "2", label: "Paid onchain tools" }],
      narrative: "Browse the catalog free. Pay for activity and entity when you need the tape.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-compare-gradient",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Facilitator-only vs full Dexter stack.",
      compareLeft: {
        title: "Before",
        body: "Dexter meant Labs facilitator settle. No agent spend tools.",
      },
      compareRight: {
        title: "Now",
        body: "Facilitator + activity/entity x402 tools. Agents buy Solana context per call.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-beacon",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · Onchain x402",
      partnerName: "Dexter AI",
      partnerLogo: "/images/partners/dexter.png",
      partnerLogoSolidBg: false,
      headline: "Syra × Dexter",
      subtitle: "Facilitator settle plus paid onchain activity and entity intelligence for agents.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-statement-lattice",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "Dexter x402 plumbing.",
      items: [
        "Base URL: x402.dexter.cash",
        "Free: /.well-known/x402 catalog",
        "Paid: /onchain/activity · /onchain/entity",
        "callExternalX402WithAgent settle path",
        "X: dexteraisol",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-frost",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Dual surface",
      headline: "One partner. Two jobs.",
      body: "Labs keeps the facilitator. Agents buy onchain intel. Machine money on both rails.",
      highlights: [
        "Labs: facilitator settle",
        "Agents: activity + entity tools",
        "Free catalog discovery",
        "Solana USDC checkout",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Dexter from agent tools.",
      terminalLines: [
        "$ tool dexter-x402-catalog",
        "→ resources: activity, entity, …",
        "$ tool dexter-onchain-activity",
        "  scope=token mint=<mint>",
        "→ 402 → pay Solana USDC",
        "→ trade summary unlocked",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Call Dexter from a Syra agent.",
      subtitle: "Start with the free catalog, then pay for activity or entity on a mint or wallet.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        { label: "Partner", value: "syraa.fun/partner/dexter", href: "https://www.syraa.fun/partner/dexter" },
        { label: "Dexter", value: "dexter.cash", href: "https://dexter.cash" },
      ],
    }),
  },
]);
