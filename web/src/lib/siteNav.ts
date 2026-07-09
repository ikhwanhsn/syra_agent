import type { LucideIcon } from "lucide-react";
import {
  Bot,
  LayoutDashboard,
  UsersRound,
  FileSearch,
  Droplets,
  Rocket,
  Lock,
  Code2,
  BookOpen,
  BookMarked,
  ExternalLink,
  Info,
  Newspaper,
  Megaphone,
  Presentation,
  Coins,
  ArrowLeftRight,
  Layers,
  Wrench,
  FlaskConical,
  ClipboardList,
} from "lucide-react";
import { isDashboardPillarRoute } from "@/lib/dashboardPillarNav";
import {
  MARKETPLACE_NAV_BROWSE,
  MARKETPLACE_NAV_BUILD,
  MARKETPLACE_NAV_CUSTOM,
} from "@/lib/playgroundRoute";

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
      (p === "/" || p === "/settings" || p.startsWith("/c/") || p === "/wallet") &&
      !p.startsWith("/overview") &&
      !isDashboardPillarRoute(p) &&
      !p.startsWith("/agent-setup") &&
      !p.includes("-experiment") &&
      !p.startsWith("/assets") &&
      !p.startsWith("/pumpfun") &&
      !p.startsWith("/internal-team") &&
      !p.startsWith("/internal"),
  },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/overview",
    icon: LayoutDashboard,
    match: (p) =>
      p.startsWith("/overview") ||
      p.startsWith("/multiwallet/recover") ||
      isDashboardPillarRoute(p) ||
      p.startsWith("/agent-setup") ||
      p.startsWith("/assets") ||
      p.startsWith("/pumpfun") ||
      p.includes("-experiment") ||
      p.startsWith("/arbitrage") ||
      p.startsWith("/internal") ||
      p.startsWith("/labs") ||
      p.startsWith("/organize"),
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/assets", label: "Assets", icon: FileSearch },
      { href: "/pumpfun", label: "Pumpfun Alpha", icon: Rocket },
      { href: "/lp-experiment", label: "LP agents", icon: Droplets },
      {
        href: "/labs",
        label: "Labs",
        icon: FlaskConical,
        description: "x402 payment experiments",
        adminOnly: true,
      },
      {
        href: "/organize",
        label: "Organize",
        icon: ClipboardList,
        description: "Track hackathons, funding & events",
        adminOnly: true,
      },
      {
        href: "/internal",
        label: "Internal hub",
        icon: UsersRound,
        description: "Team agent monitor & scouts",
        adminOnly: true,
      },
      {
        href: "/multiwallet/recover",
        label: "Recover farm wallets",
        icon: ArrowLeftRight,
        adminOnly: true,
      },
    ],
  },
  {
    id: "earn",
    label: "Earn",
    href: "/staking",
    icon: Coins,
    match: (p) => p.startsWith("/staking") || p.startsWith("/swap") || p.startsWith("/lp"),
    items: [
      {
        href: "/staking",
        label: "Staking",
        icon: Lock,
        description: "Open and manage Streamflow locks",
      },
      {
        href: "/swap",
        label: "Swap",
        icon: ArrowLeftRight,
        description: "Buy & sell tokens via Jupiter",
      },
      {
        href: "/lp",
        label: "Liquidity Pools",
        icon: Droplets,
        description: "Earn fees providing SYRA liquidity on Meteora",
      },
      {
        href: "/staking/admin",
        label: "Admin",
        icon: LayoutDashboard,
        description: "Operator registry — stakers and totals",
        adminOnly: true,
      },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    href: MARKETPLACE_NAV_BROWSE,
    icon: Code2,
    match: (p) => p.startsWith("/marketplace") || p.startsWith("/playground"),
    items: [
      {
        href: MARKETPLACE_NAV_BROWSE,
        label: "Browse",
        icon: Layers,
        description: "Browse & call x402 APIs",
      },
      {
        href: MARKETPLACE_NAV_BUILD,
        label: "Integrate",
        icon: Code2,
        description: "SDK, MCP & x402 quickstart",
      },
      {
        href: MARKETPLACE_NAV_CUSTOM,
        label: "Custom",
        icon: Wrench,
        description: "Send custom paid API requests",
      },
    ],
  },
];

export const SITE_NAV_MORE: NavLinkItem[] = [
  {
    href: "/articles",
    label: "Articles",
    icon: Newspaper,
    description: "Insights, updates, and product deep dives",
  },
  {
    href: "/about",
    label: "About",
    icon: Info,
    description: "Product overview and mission",
  },
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

/** Hidden routes — visible in More when admin wallet is connected. */
export const SITE_NAV_ADMIN_MORE: NavLinkItem[] = [
  {
    href: "/post",
    label: "Ship log",
    icon: Megaphone,
    description: "Social post studio — video & photo decks",
    adminOnly: true,
  },
  {
    href: "/deck",
    label: "Pitch deck",
    icon: Presentation,
    description: "Investor deck viewer",
    adminOnly: true,
  },
  {
    href: "/info",
    label: "Syra reference",
    icon: BookMarked,
    description: "Full internal product reference",
    adminOnly: true,
  },
  {
    href: "/internal",
    label: "Internal hub",
    icon: UsersRound,
    description: "Team agent monitor & scouts",
    adminOnly: true,
  },
];

export function getSiteNavMoreItems(isAdmin: boolean): NavLinkItem[] {
  if (!isAdmin) return SITE_NAV_MORE;
  return [...SITE_NAV_MORE, ...SITE_NAV_ADMIN_MORE];
}
