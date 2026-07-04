import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Briefcase,
  Code2,
  Coins,
  Compass,
  Layers,
  Megaphone,
  Rocket,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";

/** Editable placeholder metrics — swap values here when real data is available. */
export interface EcosystemStat {
  /** Numeric target for the animated counter (before suffix formatting). */
  value: number;
  /** Optional prefix shown before the number (e.g. "$"). */
  prefix?: string;
  /** Suffix appended after the formatted number (e.g. "+", "K+"). */
  suffix: string;
  label: string;
  /** When true, display value / 1000 with "K" style via suffix only (value is already the display number). */
  format?: "plain" | "compact";
}

export interface EcosystemPillar {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface FeaturedProduct {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
}

export interface WhyPoint {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export const BRAND_TAGLINE =
  "Helping everyone in Web3 discover opportunities, launch faster, and earn more with AI.";

export const BRAND_POSITIONING =
  "The AI-powered Web3 ecosystem that helps anyone discover opportunities, launch faster, and earn more.";

export const ecosystemStats: EcosystemStat[] = [
  { value: 12, suffix: "+", label: "AI Products" },
  { value: 8400, suffix: "+", label: "Active Users", format: "compact" },
  { value: 1200, suffix: "+", label: "Opportunities Shared", format: "compact" },
  { value: 48, suffix: "+", label: "Campaigns" },
  { value: 5200, suffix: "+", label: "Community Members", format: "compact" },
  { value: 250, suffix: "K+", label: "AI Requests" },
];

export const ecosystemPillars: EcosystemPillar[] = [
  {
    icon: Sparkles,
    title: "AI Products",
    description:
      "Use intelligent tools built to automate workflows and unlock new possibilities.",
  },
  {
    icon: Compass,
    title: "Web3 Opportunities",
    description:
      "Discover jobs, grants, hackathons, campaigns, and ecosystem incentives.",
  },
  {
    icon: Bot,
    title: "AI Agents",
    description:
      "Work alongside autonomous AI agents that help you research, analyze, and execute.",
  },
  {
    icon: Wallet,
    title: "Payments",
    description:
      "Enable seamless onchain payments and machine-to-machine commerce.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Connect with builders, founders, creators, and Web3 enthusiasts.",
  },
  {
    icon: Code2,
    title: "Developer Platform",
    description:
      "Powerful APIs and infrastructure for teams building the next generation of applications.",
  },
];

export const featuredProducts: FeaturedProduct[] = [
  {
    icon: Megaphone,
    title: "KOL Marketplace",
    description: "Fund campaigns, amplify on X, and earn on-chain rewards.",
    href: "/kol",
  },
  {
    icon: Bot,
    title: "AI Agent Marketplace",
    description: "Discover intelligent agents for every workflow.",
    comingSoon: true,
  },
  {
    icon: Briefcase,
    title: "Jobs",
    description: "Find your next opportunity.",
    href: "/jobs",
  },
  {
    icon: Rocket,
    title: "Campaigns",
    description: "Complete missions and earn rewards.",
    href: "/campaign",
    comingSoon: true,
  },
  {
    icon: Trophy,
    title: "Hackathons",
    description: "Build, compete, and win.",
    href: "/hackathon",
  },
  {
    icon: Sparkles,
    title: "Contests",
    description: "Compete in community challenges and win rewards.",
    href: "/contest",
    comingSoon: true,
  },
];

export const whyPoints: WhyPoint[] = [
  {
    icon: Sparkles,
    title: "AI First",
    description: "Every experience is powered by intelligent automation.",
  },
  {
    icon: Layers,
    title: "Everything in One Place",
    description: "No switching between dozens of Web3 platforms.",
  },
  {
    icon: Users,
    title: "Built for Everyone",
    description:
      "Developers, founders, creators, traders, students, and communities.",
  },
  {
    icon: Coins,
    title: "Always Growing",
    description: "New products and opportunities are constantly added.",
  },
];

/** Short footer lockup — keep this one line. */
export const FOOTER_BLURB = "The AI-powered Web3 ecosystem.";

export const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "KOL Marketplace", href: "/kol" },
      { label: "Jobs", href: "/jobs" },
      { label: "Hackathons", href: "/hackathon" },
      { label: "Campaigns", href: "/campaign" },
      { label: "Events", href: "/events" },
      { label: "Contests", href: "/contest" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Community", href: "/community" },
      { label: "Telegram", href: "https://t.me/s3labs", external: true },
      { label: "X", href: "https://x.com/s3labs_", external: true },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/company/s3labs/",
        external: true,
      },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      {
        label: "Contact",
        href: "mailto:s3labs.company@gmail.com",
        external: true,
      },
      { label: "Privacy", href: "/about" },
      { label: "Terms", href: "/about" },
    ],
  },
];
