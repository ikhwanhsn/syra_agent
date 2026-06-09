import { FUND_MANDATE_POST } from "../fundMandateUpdate";
import type { PostPhotoUpdate } from "./types";

/** Photo-format content for the fund mandate investor brief. */
export const FUND_MANDATE_PHOTO: PostPhotoUpdate = {
  meta: FUND_MANDATE_POST.meta,
  picks: [
    "photo-cover-split",
    "photo-timeline",
    "photo-cards-quad",
    "photo-stat-featured",
    "photo-comparison",
    "photo-closing-cta",
  ],
  content: {
    eyebrow: "Investor brief",
    badge: "Solana · 80/20 Mandate",
    title: "Up Only Fund",
    subtitle:
      "Onchain capital for high conviction bets. A Solana allocator with a published 80/20 thesis and transparent disclosures.",
    kicker: "Why we exist",
    headline: "Most allocators hide their process.",
    body: "Retail funds chase narratives. Institutional allocators gate their thesis. Up Only Fund publishes mandate, sleeve criteria, and portfolio disclosures onchain.",
    quote: "Conviction first. Structure always. No hidden rugs.",
    highlights: [
      "80% utility sleeve: working products and durable onchain demand",
      "20% asymmetric sleeve: verified liquidity, no-rug mechanics",
      "On-chain verification before every position",
      "Public mandate and portfolio disclosures",
    ],
    steps: [
      { step: "01", title: "Screen the universe", description: "Solana-native projects by traction and structure." },
      { step: "02", title: "Map to sleeve criteria", description: "Score against published 80/20 mandate." },
      { step: "03", title: "Verify onchain", description: "Liquidity, distribution, and rug checks." },
      { step: "04", title: "Publish and monitor", description: "Disclose positions. Monitor via dashboard." },
    ],
    cards: [
      { title: "High conviction", subtitle: "80% sleeve", detail: "Utility tokens with real traction on Solana.", accent: "gold" },
      { title: "Asymmetric", subtitle: "20% sleeve", detail: "Clean memecoins with verified structure.", accent: "gold" },
      { title: "Risk framing", subtitle: "Always disclosed", detail: "High risk by design. No return promises." },
      { title: "No public LP", subtitle: "v1 mandate", detail: "Follow disclosures as treasury publishes." },
    ],
    stats: [
      { value: "80/20", label: "Published allocation thesis" },
      { value: "100%", label: "Onchain verification gate" },
      { value: "0", label: "Hidden rug mechanics tolerated" },
    ],
    narrative: "We publish what we believe, how we size, and what we hold. Conviction allocators earn trust through transparency.",
    links: [
      { label: "Fund page", value: "uponlyfund.com", href: "https://uponlyfund.com" },
      { label: "Mandate", value: "Investment criteria", href: "https://uponlyfund.com/#mandate" },
      { label: "Dashboard", value: "uponlyfund.com/overview", href: "https://uponlyfund.com/overview" },
    ],
    items: [
      "Public fund landing with mandate and thesis",
      "Fund-grade dashboard and market terminal",
      "Portfolio disclosures as treasury goes live",
      "Explicit risk framing on every sleeve",
    ],
    compareLeft: {
      title: "Typical fund",
      body: "Opaque thesis, narrative-driven sizing, and gated disclosures behind closed doors.",
    },
    compareRight: {
      title: "Up Only Fund",
      body: "Published 80/20 mandate, onchain verification gates, and transparent portfolio disclosures.",
    },
    terminalLines: [
      "$ uof screen --chain solana --sleeve utility",
      "> 847 candidates · 12 pass traction gate",
      "$ uof verify --mint <address> --checks liquidity,distribution,rug",
      "> structure clear · no hidden mechanics",
      "$ uof allocate --sleeve high-conviction --size conviction-weighted",
      "> position logged · disclosure queued for publish",
    ],
  },
};
