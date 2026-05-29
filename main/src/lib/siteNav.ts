import type { LucideIcon } from "lucide-react";
import {
  Bot,
  LayoutDashboard,
  Users,
  Settings,
  Telescope,
  FileSearch,
  FlaskConical,
  Scale,
  Droplets,
  Rocket,
  Crosshair,
  Lock,
  History,
  Code2,
  BookOpen,
  Compass,
  Layers,
  TestTube2,
  FileCode2,
  ExternalLink,
} from "lucide-react";

export type NavLinkItem = {
  href: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  external?: boolean;
  adminOnly?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  items?: NavLinkItem[];
  match: (pathname: string) => boolean;
};

export const SITE_NAV_GROUPS: NavGroup[] = [
  {
    id: "agent",
    label: "Agent",
    href: "/",
    icon: Bot,
    match: (p) =>
      (p === "/" || p === "/settings" || p.startsWith("/c/")) &&
      !p.startsWith("/overview") &&
      !p.startsWith("/agents") &&
      !p.startsWith("/agent-setup") &&
      !p.includes("-experiment") &&
      !p.startsWith("/alpha") &&
      !p.startsWith("/assets") &&
      !p.startsWith("/internal-team"),
  },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/overview",
    icon: LayoutDashboard,
    match: (p) =>
      p.startsWith("/overview") ||
      p.startsWith("/agents") ||
      p.startsWith("/agent-setup") ||
      p.startsWith("/alpha") ||
      p.startsWith("/assets") ||
      p.includes("-experiment") ||
      p.startsWith("/arbitrage") ||
      p.startsWith("/internal-team-agents"),
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/agents", label: "Agents", icon: Users },
      { href: "/agent-setup", label: "Agent setup", icon: Settings },
      { href: "/alpha", label: "Alpha intel", icon: Telescope },
      { href: "/assets", label: "Assets", icon: FileSearch },
      { href: "/trading-experiment", label: "Trading experiment", icon: FlaskConical },
      { href: "/arbitrage-experiment", label: "Arbitrage", icon: Scale },
      { href: "/lp-experiment", label: "LP agents", icon: Droplets },
      { href: "/pumpfun-experiment", label: "Pumpfun", icon: Rocket },
      { href: "/rise-experiment", label: "Rise", icon: Crosshair },
    ],
  },
  {
    id: "staking",
    label: "Earn",
    href: "/staking",
    icon: Lock,
    match: (p) => p.startsWith("/staking"),
    items: [
      { href: "/staking", label: "Lock $SYRA", description: "Streamflow token locks", icon: Lock },
      { href: "/staking/details", label: "My positions", description: "Legacy pool stakes", icon: History },
      {
        href: "/staking/dashboard",
        label: "Stakers dashboard",
        description: "Operator registry",
        icon: Layers,
        adminOnly: true,
      },
    ],
  },
  {
    id: "playground",
    label: "Develop",
    href: "/playground",
    icon: Code2,
    match: (p) => p.startsWith("/playground"),
    items: [
      { href: "/playground", label: "Playground", description: "x402 API tester", icon: Code2 },
      { href: "/playground/examples", label: "Examples", icon: BookOpen },
      { href: "/playground/explorer", label: "Explorer", icon: Compass },
      { href: "/playground/batch-test", label: "Batch test", icon: TestTube2 },
      { href: "/playground/format-test", label: "Format validator", icon: FileCode2 },
    ],
  },
];

export const SITE_NAV_MORE: NavLinkItem[] = [
  {
    href: "https://docs.syraa.fun",
    label: "Documentation",
    icon: BookOpen,
    external: true,
  },
  {
    href: "https://x.com/syra_agent",
    label: "X / Twitter",
    icon: ExternalLink,
    external: true,
  },
];
