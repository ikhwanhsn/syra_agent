import { BarChart3, FileText, Globe, Shield, TrendingUp } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Investor brief: S3 Labs mandate and 80/20 thesis.
 * Append the next update to POST_UPDATE_BUNDLES in registry.ts.
 */
export const FUND_MANDATE_POST: PostUpdate = {
  meta: {
    updateNumber: 1,
    id: "uof-mandate-brief",
    title: "Fund Mandate Brief",
    published: "June 2026",
    tagline: "Onchain capital for high conviction bets on Solana",
    shareCopyVideo: `INVESTOR BRIEF · S3 Labs mandate is live.

We allocate onchain with a published 80/20 thesis: 80% into utility tokens with real product traction, 20% into clean onchain memecoins with verified liquidity and no-rug structure.

→ Conviction sizing, not hype cycles
→ On-chain verification before every position
→ Public mandate, portfolio disclosures, and risk framing
→ Fund-grade analytics via the UOF dashboard

No retail subscriptions in v1. Read the mandate, track the thesis, and follow disclosures as we publish.

Full breakdown in the video ↓`,
    shareCopyPhoto: `INVESTOR BRIEF · S3 Labs on Solana.

80% high-conviction utility. 20% asymmetric memecoin sleeve with verified structure. Published mandate, on-chain verification, and transparent disclosures.

Conviction allocator. No hype. No hidden rugs.

Read the mandate at s3labs.xyz`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-split",
      label: "Cover",
      eyebrow: "Investor brief",
      title: "S3 Labs",
      subtitle:
        "Onchain capital for high conviction bets. A Solana allocator with a published 80/20 thesis and transparent disclosures.",
      badge: "Solana · 80/20 Mandate",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-accent-bar",
      label: "Thesis",
      kicker: "Why we exist",
      headline: "Most allocators hide their process.",
      body: "Retail funds chase narratives. Institutional allocators gate their thesis. S3 Labs publishes mandate, sleeve criteria, and portfolio disclosures onchain so conviction sizing is visible, not implied.",
    },
    {
      id: "mandate",
      kind: "hero",
      layout: "hero-split",
      label: "Mandate",
      kicker: "What we deploy",
      headline: "Conviction first. Structure always.",
      body: "We size for asymmetric upside where onchain structure is clear. Every sleeve has published criteria, risk framing, and verification gates before capital moves.",
      highlights: [
        "80% utility sleeve: working products, durable onchain demand, Solana structural edge",
        "20% asymmetric sleeve: clean memecoins with verified liquidity and no-rug mechanics",
        "On-chain verification before every position, no narrative-only bets",
        "Public disclosures: mandate, treasury, and backed projects as published",
      ],
    },
    {
      id: "process",
      kind: "flow",
      layout: "flow-numbered",
      label: "Process",
      kicker: "How we allocate",
      headline: "From thesis to onchain position",
      steps: [
        {
          step: "01",
          title: "Screen the universe",
          description: "Solana-native projects filtered by utility traction, liquidity depth, and onchain structure integrity.",
        },
        {
          step: "02",
          title: "Map to sleeve criteria",
          description: "Each candidate scored against published 80/20 mandate criteria. No sleeve drift without disclosure.",
        },
        {
          step: "03",
          title: "Verify onchain",
          description: "Liquidity, distribution, holder concentration, and rug mechanics checked before sizing.",
        },
        {
          step: "04",
          title: "Publish and monitor",
          description: "Positions disclosed on the fund page. Ongoing monitoring via fund-grade dashboard analytics.",
        },
      ],
    },
    {
      id: "sleeves",
      kind: "cards",
      layout: "cards-bento",
      label: "Sleeves",
      kicker: "80/20 allocation",
      headline: "Two sleeves, one mandate",
      cards: [
        {
          title: "High conviction",
          subtitle: "80% sleeve",
          detail: "Utility tokens with working products, measurable onchain demand, and credible execution on Solana.",
          accent: "gold",
        },
        {
          title: "Asymmetric",
          subtitle: "20% sleeve",
          detail: "Clean onchain memecoins with verified liquidity, fair launch structure, and genuine momentum.",
          accent: "gold",
        },
        {
          title: "Risk framing",
          subtitle: "Always disclosed",
          detail: "Nothing here promises returns. Markets are uncertain. Every sleeve is high risk by design.",
        },
        {
          title: "No public LP",
          subtitle: "v1 mandate",
          detail: "No retail subscriptions in v1. Follow disclosures and mandate updates as treasury publishes.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Access",
      kicker: "Where to follow",
      headline: "Fund surfaces and disclosures",
      items: [
        {
          icon: Globe,
          title: "Fund landing",
          description: "Mandate, thesis, portfolio bands, and risk disclosure on the public fund page.",
          href: "https://s3labs.xyz",
        },
        {
          icon: BarChart3,
          title: "Fund dashboard",
          description: "Market terminal, portfolio tools, and fund-grade analytics for operators and LPs.",
          href: "https://s3labs.xyz/overview",
        },
        {
          icon: FileText,
          title: "Investment mandate",
          description: "Full sleeve criteria, allocation rules, and legal risk framing in one document.",
          href: "https://s3labs.xyz/#mandate",
        },
        {
          icon: TrendingUp,
          title: "Portfolio disclosures",
          description: "Backed projects and position bands published as treasury goes live.",
          href: "https://s3labs.xyz/#portfolio",
        },
        {
          icon: Shield,
          title: "Risk disclosure",
          description: "Explicit high-risk framing. No return promises. Read before following allocations.",
          href: "https://s3labs.xyz/#risk-disclosure",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-featured-stat",
      label: "Structure",
      kicker: "By the numbers",
      headline: "Conviction allocator on Solana",
      stats: [
        { value: "80/20", label: "Published allocation thesis" },
        { value: "100%", label: "Onchain verification gate" },
        { value: "0", label: "Hidden rug mechanics tolerated" },
      ],
      narrative:
        "We publish what we believe, how we size, and what we hold. Conviction allocators earn trust through transparency, not marketing. Follow the mandate as disclosures go live.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Follow",
      headline: "Read the mandate. Track the thesis.",
      subline: "No public LP in v1. Follow fund disclosures, portfolio bands, and mandate updates on the landing page.",
      links: [
        { label: "Fund page", value: "s3labs.xyz", href: "https://s3labs.xyz" },
        { label: "Mandate", value: "Investment criteria", href: "https://s3labs.xyz/#mandate" },
        { label: "Dashboard", value: "s3labs.xyz/overview", href: "https://s3labs.xyz/overview" },
      ],
    },
  ],
};
