import { S3_GROWTH_BRIEF_POST } from "../s3GrowthBriefUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import {
  S3_GROWTH_BRIEF_PHOTO_SHARE_COPIES,
  S3_GROWTH_BRIEF_PHOTO_SHARE_FOOTERS,
} from "./shareCopies/s3GrowthBriefShareCopies";

const copies = S3_GROWTH_BRIEF_PHOTO_SHARE_COPIES;
const footers = S3_GROWTH_BRIEF_PHOTO_SHARE_FOOTERS;

/**
 * S3 Labs growth brief — 15 cards with layouts distinct from UOF fund mandate deck.
 * UOF uses batch-3 vault layouts (diagonal, neon, gilded, conduit, rail, marquee…).
 * S3 uses editorial ribbon layouts (brand center, kinetic, zigzag, spotlight…).
 */
export const S3_GROWTH_BRIEF_PHOTO = definePhotoUpdate(S3_GROWTH_BRIEF_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-brand",
    shareCopy: copies.cover,
    content: photoContent({
      badge: "Solana · Results Over Hype",
      title: "S3 Labs",
      subtitle:
        "Growth partner for Solana developers. Revenue support, adoption playbooks, and founder network for builders with proof.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-kinetic",
    shareCopy: copies.thesis,
    shareCopyFooter: footers.thesis,
    content: photoContent({
      headline: "Most accelerators sell hype.",
      body: "Builders win hackathons then stall on distribution. S3 Labs pairs revenue support and adoption playbooks so Solana products reach real users — not just demo day applause.",
      kicker: "Why we exist",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote-centered",
    shareCopy: copies.quote,
    shareCopyFooter: footers.quote,
    content: photoContent({
      quote: "Results over hype. Proof before programs.",
      narrative: "We work with hackathon winners and MVP builders — teams with traction, not narratives.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-zigzag",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How we partner",
      headline: "From application to scaled traction.",
      steps: [
        { step: "01", title: "Apply with proof", description: "Hackathon win, MVP, or early traction on Solana." },
        { step: "02", title: "Fit assessment", description: "Product-market signal and team execution scored." },
        { step: "03", title: "Program match", description: "Revenue, Arena, events, or GTM — matched to stage." },
        { step: "04", title: "Ship and measure", description: "Outcomes tracked. Results over hype." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Programs",
      headline: "What founders get.",
      steps: [
        { step: "01", title: "Revenue support", description: "Monetization for products with real users." },
        { step: "02", title: "Distribution", description: "GTM sprints and community growth playbooks." },
        { step: "03", title: "Arena visibility", description: "Qualified projects listed with traction data." },
        { step: "04", title: "Founder network", description: "500+ operators across the Solana graph." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-spotlight",
    shareCopy: copies.pillars,
    shareCopyFooter: footers.pillars,
    content: photoContent({
      kicker: "Four pillars",
      headline: "Growth partner stack.",
      cards: [
        { title: "Revenue", subtitle: "Core program", detail: "Monetization support for Solana products with traction.", accent: "gold" },
        { title: "Distribution", subtitle: "GTM sprint", detail: "Adoption playbooks and ecosystem positioning.", accent: "gold" },
        { title: "Arena", subtitle: "Visibility", detail: "Qualified projects in S3 Arena with market context." },
        { title: "Network", subtitle: "500+ founders", detail: "Operators and mentors across Solana." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-numbered",
    shareCopy: copies.checklist,
    shareCopyFooter: footers.checklist,
    content: photoContent({
      kicker: "Now live",
      headline: "Growth programs are live.",
      highlights: [
        "Partner applications for Solana builders",
        "S3 Arena with traction data",
        "Events and hackathon programs",
        "$65K+ revenue generated across portfolio",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-halo",
    shareCopy: copies.metrics,
    shareCopyFooter: footers.metrics,
    content: photoContent({
      kicker: "By the numbers",
      headline: "Results that matter.",
      stats: [
        { value: "$65K+", label: "Revenue generated" },
        { value: "95%", label: "Program success rate" },
        { value: "500+", label: "Founder network" },
      ],
      narrative: "We measure traction, not vanity metrics.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    shareCopyFooter: footers.featured,
    content: photoContent({
      kicker: "Impact",
      headline: "One number that defines us.",
      stats: [{ value: "$65K+", label: "Revenue generated for portfolio" }],
      narrative: "Real builders. Real revenue. Results over hype.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    shareCopyFooter: footers.comparison,
    content: photoContent({
      kicker: "Partner contrast",
      headline: "Typical accelerator vs S3 Labs.",
      compareLeft: {
        title: "Typical accelerator",
        body: "Demo day hype, vanity metrics, and no revenue support for builders after the pitch.",
      },
      compareRight: {
        title: "S3 Labs",
        body: "Proof required. Revenue programs. Arena exposure and 500+ founder network. Results over hype.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live · Programs · Arena",
      headline: "S3 Labs growth partner",
      body: "For hackathon winners and MVP builders on Solana — revenue support, adoption playbooks, founder network.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    shareCopyFooter: footers.deepDive,
    content: photoContent({
      kicker: "Who we help",
      headline: "Builder criteria in plain English.",
      steps: [
        { step: "01", title: "Hackathon winners", description: "Working prototypes on Solana with credible execution." },
        { step: "02", title: "MVP builders", description: "Early traction or revenue signal on live products." },
        { step: "03", title: "GTM-ready teams", description: "Ready for distribution and community growth support." },
        { step: "04", title: "Outcome-focused founders", description: "Want results, not hype cycles or vanity metrics." },
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-compact",
    shareCopy: copies.split,
    shareCopyFooter: footers.split,
    content: photoContent({
      badge: "Two modes",
      headline: "Proof vs hype.",
      highlights: [
        "Proof: hackathon wins, MVPs, early revenue",
        "Programs: revenue, distribution, Arena",
        "Network: 500+ Solana founders",
      ],
      body: "Programs match to traction — not narratives.",
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    shareCopyFooter: footers.terminal,
    content: photoContent({
      headline: "Partner pipeline.",
      terminalLines: [
        "$ s3 apply --proof hackathon-win --chain solana",
        "> MVP detected · traction signal present",
        "$ s3 match --program revenue,growth,arena",
        "> program assigned · founder network unlocked",
        "$ s3 ship --metric revenue,adoption",
        "> outcomes tracked · results over hype",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-split",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Build on Solana. Scale with S3.",
      subtitle: "Apply for growth partner programs. Join the founder network.",
      links: [
        { label: "Website", value: "s3labs.xyz", href: "https://s3labs.xyz" },
        { label: "Arena", value: "s3labs.xyz/arenass", href: "https://s3labs.xyz/arenass" },
        { label: "Community", value: "t.me/s3labs", href: "https://t.me/s3labs" },
      ],
    }),
  },
]);
