import { FUND_MANDATE_POST } from "../fundMandateUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import {
  FUND_MANDATE_PHOTO_SHARE_COPIES,
  FUND_MANDATE_PHOTO_SHARE_FOOTERS,
} from "./shareCopies/fundMandateShareCopies";

const copies = FUND_MANDATE_PHOTO_SHARE_COPIES;
const footers = FUND_MANDATE_PHOTO_SHARE_FOOTERS;

/** Photo-format content for the fund mandate investor brief — 15 cards, 15 X posts. */
export const FUND_MANDATE_PHOTO = definePhotoUpdate(FUND_MANDATE_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-split",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Investor brief",
      badge: "Solana · 80/20 Mandate",
      title: "Up Only Fund",
      subtitle:
        "Onchain capital for high conviction bets. A Solana allocator with a published 80/20 thesis and transparent disclosures.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-center",
    shareCopy: copies.thesis,
    shareCopyFooter: footers.thesis,
    content: photoContent({
      kicker: "Why we exist",
      headline: "Most allocators hide their process.",
      body: "Retail funds chase narratives. Institutional allocators gate their thesis. Up Only Fund publishes mandate, sleeve criteria, and portfolio disclosures onchain.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    shareCopyFooter: footers.quote,
    content: photoContent({
      quote: "Conviction first. Structure always. No hidden rugs.",
      narrative: "Every position passes onchain verification. Published mandate. Transparent disclosures.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How we allocate",
      headline: "From universe to verified position.",
      steps: [
        { step: "01", title: "Screen the universe", description: "Solana-native projects by traction and structure." },
        { step: "02", title: "Map to sleeve criteria", description: "Score against published 80/20 mandate." },
        { step: "03", title: "Verify onchain", description: "Liquidity, distribution, and rug checks." },
        { step: "04", title: "Publish and monitor", description: "Disclose positions. Monitor via dashboard." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Published mandate",
      headline: "What conviction allocators get.",
      steps: [
        { step: "01", title: "80% utility sleeve", description: "Working products and durable onchain demand." },
        { step: "02", title: "20% asymmetric sleeve", description: "Verified liquidity, no-rug mechanics." },
        { step: "03", title: "Onchain verification", description: "Gate before every position." },
        { step: "04", title: "Public disclosures", description: "Portfolio updates as treasury publishes." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    shareCopyFooter: footers.pillars,
    content: photoContent({
      headline: "Four pillars of the mandate.",
      cards: [
        { title: "High conviction", subtitle: "80% sleeve", detail: "Utility tokens with real traction on Solana.", accent: "gold" },
        { title: "Asymmetric", subtitle: "20% sleeve", detail: "Clean memecoins with verified structure.", accent: "gold" },
        { title: "Risk framing", subtitle: "Always disclosed", detail: "High risk by design. No return promises." },
        { title: "No public LP", subtitle: "v1 mandate", detail: "Follow disclosures as treasury publishes." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    shareCopyFooter: footers.checklist,
    content: photoContent({
      headline: "Fund mandate is live.",
      highlights: [
        "Public fund landing with mandate and thesis",
        "Fund-grade dashboard and market terminal",
        "Portfolio disclosures as treasury goes live",
        "Explicit risk framing on every sleeve",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-metric-strip",
    shareCopy: copies.metrics,
    shareCopyFooter: footers.metrics,
    content: photoContent({
      headline: "Three numbers that define us.",
      stats: [
        { value: "80/20", label: "Published allocation thesis" },
        { value: "100%", label: "Onchain verification gate" },
        { value: "0", label: "Hidden rug mechanics tolerated" },
      ],
      narrative: "We size by conviction, not hype cycles.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    shareCopyFooter: footers.featured,
    content: photoContent({
      headline: "The mandate in one number.",
      stats: [{ value: "80/20", label: "Published allocation thesis" }],
      narrative: "Utility with traction. Asymmetric with verification. Zero hidden mechanics.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    shareCopyFooter: footers.comparison,
    content: photoContent({
      headline: "Typical fund vs Up Only Fund.",
      compareLeft: {
        title: "Typical fund",
        body: "Opaque thesis, narrative-driven sizing, and gated disclosures behind closed doors.",
      },
      compareRight: {
        title: "Up Only Fund",
        body: "Published 80/20 mandate, onchain verification gates, and transparent portfolio disclosures.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Investor brief",
      badge: "Now live · Mandate · Disclosures",
      headline: "Up Only Fund mandate",
      subtitle: "Onchain capital for high conviction bets on Solana — published thesis, verification gates, transparent disclosures.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    shareCopyFooter: footers.deepDive,
    content: photoContent({
      kicker: "Due diligence",
      headline: "Mandate criteria in plain English.",
      items: [
        "80% utility sleeve: working products and durable onchain demand",
        "20% asymmetric sleeve: verified liquidity, no-rug mechanics",
        "Every position: liquidity + distribution + rug checks",
        "Disclosures published as treasury deploys capital",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    shareCopyFooter: footers.split,
    content: photoContent({
      badge: "Two sleeves",
      headline: "Utility vs asymmetric.",
      body: "The 80% sleeve targets real traction. The 20% sleeve targets asymmetric upside — but only after structure clears verification.",
      highlights: [
        "Utility: working products on Solana",
        "Asymmetric: verified memecoin structure",
        "Both gated by onchain checks",
        "Risk always disclosed upfront",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    shareCopyFooter: footers.terminal,
    content: photoContent({
      headline: "Allocation pipeline.",
      terminalLines: [
        "$ uof screen --chain solana --sleeve utility",
        "> 847 candidates · 12 pass traction gate",
        "$ uof verify --mint <address> --checks liquidity,distribution,rug",
        "> structure clear · no hidden mechanics",
        "$ uof allocate --sleeve high-conviction --size conviction-weighted",
        "> position logged · disclosure queued for publish",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Follow a conviction allocator.",
      subtitle: "Read the mandate. Track the thesis. Follow disclosures as we publish.",
      links: [
        { label: "Fund page", value: "uponlyfund.com", href: "https://uponlyfund.com" },
        { label: "Mandate", value: "uponlyfund.com/#mandate", href: "https://uponlyfund.com/#mandate" },
        { label: "Dashboard", value: "uponlyfund.com/overview", href: "https://uponlyfund.com/overview" },
      ],
    }),
  },
]);
