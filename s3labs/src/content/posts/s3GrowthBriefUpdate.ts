import { BarChart3, FileText, Globe, Rocket, Users } from "lucide-react";
import type { PostUpdate } from "./types";

/** Growth partner brief: S3 Labs programs for Solana builders. */
export const S3_GROWTH_BRIEF_POST: PostUpdate = {
  meta: {
    updateNumber: 1,
    id: "s3-growth-brief",
    title: "Growth Partner Brief",
    published: "June 2026",
    tagline: "Results over hype — growth partner for Solana developers",
    shareCopyVideo: `GROWTH BRIEF · S3 Labs partner program is live.

We help hackathon winners and MVP builders generate revenue, accelerate adoption, and scale on Solana — with programs, distribution, and founder network access.

→ Results over hype, not vanity metrics
→ Revenue support for builders with traction
→ Arena, events, and founder community
→ $65K+ revenue generated across portfolio

Apply your project. Ship with conviction.

Full breakdown in the video ↓`,
    shareCopyPhoto: `GROWTH BRIEF · S3 Labs on Solana.

Growth partner for developers with hackathon wins or live MVPs. Revenue support, adoption playbooks, and founder network — results over hype.

Apply at s3labs.xyz`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-minimal",
      label: "Cover",
      eyebrow: "Growth brief",
      title: "S3 Labs",
      subtitle:
        "Growth partner for Solana developers. We help hackathon winners and MVP builders generate revenue and scale with conviction.",
      badge: "Solana · Results Over Hype",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Thesis",
      kicker: "Why we exist",
      headline: "Most accelerators sell hype. We ship results.",
      body: "Builders win hackathons then stall on distribution. S3 Labs pairs revenue support, adoption playbooks, and founder network access so Solana products reach real users — not just demo day applause.",
    },
    {
      id: "mandate",
      kind: "hero",
      layout: "hero-compact",
      label: "Programs",
      kicker: "What we deliver",
      headline: "Traction first. Distribution always.",
      body: "We work with teams that have proof — hackathon wins, live MVPs, or early revenue. Every engagement maps to measurable outcomes: users, revenue, and ecosystem fit.",
      highlights: [
        "Revenue programs for builders with working products on Solana",
        "Adoption playbooks: distribution, GTM, and community growth",
        "Arena listings and event exposure for qualified projects",
        "Founder network of 500+ operators across the ecosystem",
      ],
    },
    {
      id: "process",
      kind: "flow",
      layout: "flow-pipeline",
      label: "Process",
      kicker: "How we partner",
      headline: "From application to scaled traction",
      steps: [
        {
          step: "01",
          title: "Apply with proof",
          description: "Hackathon win, MVP, or early traction — show what you have built on Solana.",
        },
        {
          step: "02",
          title: "Fit assessment",
          description: "We score product-market signal, team execution, and ecosystem alignment.",
        },
        {
          step: "03",
          title: "Program match",
          description: "Revenue support, Arena exposure, events, or GTM sprint — matched to your stage.",
        },
        {
          step: "04",
          title: "Ship and measure",
          description: "Outcomes tracked publicly. Results over hype, always.",
        },
      ],
    },
    {
      id: "sleeves",
      kind: "cards",
      layout: "cards-row",
      label: "Pillars",
      kicker: "Four pillars",
      headline: "What founders get",
      cards: [
        {
          title: "Revenue",
          subtitle: "Core program",
          detail: "Monetization support for Solana products with real users and credible execution.",
          accent: "gold",
        },
        {
          title: "Distribution",
          subtitle: "GTM sprint",
          detail: "Adoption playbooks, community growth, and ecosystem positioning.",
          accent: "gold",
        },
        {
          title: "Arena",
          subtitle: "Visibility",
          detail: "Qualified projects listed in S3 Arena with market data and founder context.",
        },
        {
          title: "Network",
          subtitle: "500+ founders",
          detail: "Operators, mentors, and partners across the Solana builder graph.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-list",
      label: "Access",
      kicker: "Where to engage",
      headline: "S3 Labs surfaces",
      items: [
        {
          icon: Globe,
          title: "Apply",
          description: "Submit your hackathon win or MVP for growth partner consideration.",
          href: "https://s3labs.xyz",
        },
        {
          icon: Rocket,
          title: "S3 Arena",
          description: "Explore qualified Solana projects with traction data and founder profiles.",
          href: "https://s3labs.xyz/arenass",
        },
        {
          icon: Users,
          title: "Community",
          description: "Join 500+ founders in the S3 Labs Telegram community.",
          href: "https://t.me/s3labs",
        },
        {
          icon: FileText,
          title: "Events",
          description: "Hackathons, workshops, and ecosystem events across Solana.",
          href: "https://s3labs.xyz/events",
        },
        {
          icon: BarChart3,
          title: "Track record",
          description: "$65K+ revenue generated, 3+ projects scaled, 95% success rate.",
          href: "https://s3labs.xyz",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "By the numbers",
      headline: "Results over hype",
      stats: [
        { value: "$65K+", label: "Revenue generated for portfolio" },
        { value: "95%", label: "Program success rate" },
        { value: "500+", label: "Founder network" },
      ],
      narrative:
        "We measure what matters: revenue, adoption, and durable traction on Solana. No vanity metrics. No hype cycles. Apply with proof and ship with conviction.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Apply",
      headline: "Build on Solana. Scale with S3.",
      subline: "Hackathon winners and MVP builders — apply for growth partner programs. Results over hype.",
      links: [
        { label: "Website", value: "s3labs.xyz", href: "https://s3labs.xyz" },
        { label: "Arena", value: "s3labs.xyz/arenass", href: "https://s3labs.xyz/arenass" },
        { label: "Community", value: "t.me/s3labs", href: "https://t.me/s3labs" },
      ],
    },
  ],
};
