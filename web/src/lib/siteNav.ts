import type { LucideIcon } from "lucide-react";
import {
  Bot,
  LayoutDashboard,
  Droplets,
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
  FileSearch,
  FlaskConical,
  UsersRound,
} from "lucide-react";
import { isDashboardPillarRoute, DASHBOARD_PILLAR_NAV } from "@/lib/dashboardPillarNav";
import { DASHBOARD_MARKET_INTEL_NAV, isDashboardMarketIntelRoute } from "@/lib/dashboardMarketIntelNav";
import { DASHBOARD_EXPERIMENT_NAV, isDashboardExperimentRoute } from "@/lib/dashboardExperimentNav";
import { DASHBOARD_TEAM_NAV, isDashboardTeamRoute } from "@/lib/dashboardTeamNav";
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

/** Nested cluster inside a top-nav group (e.g. Dashboard → Market Intel). */
export type NavSection = {
  id: string;
  label: string;
  icon?: LucideIcon;
  adminOnly?: boolean;
  items: NavLinkItem[];
};

export type NavGroup = {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  /** Flat list for simple groups (Earn, APIs). */
  items?: NavLinkItem[];
  /** Nested sections for multi-dropdown groups (Dashboard). */
  sections?: NavSection[];
  match: (pathname: string) => boolean;
};

function pillarToNavItem(item: (typeof DASHBOARD_PILLAR_NAV)[number]): NavLinkItem {
  return {
    href: item.to,
    label: item.label,
    description: item.description,
    icon: item.icon,
  };
}

function marketIntelToNavItem(
  item: (typeof DASHBOARD_MARKET_INTEL_NAV)[number],
): NavLinkItem {
  return {
    href: item.to,
    label: item.label,
    description: item.badge ? `${item.badge.label} desk` : undefined,
    icon: item.icon,
  };
}

function experimentToNavItem(
  item: (typeof DASHBOARD_EXPERIMENT_NAV)[number],
): NavLinkItem {
  return {
    href: item.to,
    label: item.label,
    description: item.description,
    icon: item.icon,
    adminOnly: true,
  };
}

function teamToNavItem(item: (typeof DASHBOARD_TEAM_NAV)[number]): NavLinkItem {
  return {
    href: item.to,
    label: item.label,
    description: item.description,
    icon: item.icon,
    adminOnly: true,
  };
}

/** Flatten a group's links for search / mobile fallbacks. */
export function getNavGroupLinkItems(group: NavGroup, isAdmin: boolean): NavLinkItem[] {
  const fromItems = (group.items ?? []).filter((item) => !item.adminOnly || isAdmin);
  const fromSections = (group.sections ?? [])
    .filter((section) => !section.adminOnly || isAdmin)
    .flatMap((section) => section.items.filter((item) => !item.adminOnly || isAdmin));
  return [...fromItems, ...fromSections];
}

export const SITE_NAV_GROUPS: NavGroup[] = [
  {
    id: "agent",
    label: "Agent",
    href: "/agent",
    icon: Bot,
    match: (p) =>
      (p === "/agent" ||
        p === "/settings" ||
        p.startsWith("/c/") ||
        p === "/wallet") &&
      !p.startsWith("/overview") &&
      !isDashboardPillarRoute(p) &&
      !isDashboardMarketIntelRoute(p) &&
      !isDashboardExperimentRoute(p) &&
      !isDashboardTeamRoute(p) &&
      !p.startsWith("/agent-setup") &&
      !p.includes("-experiment") &&
      !p.startsWith("/assets") &&
      !p.startsWith("/analyzer") &&
      !p.startsWith("/pumpfun") &&
      !p.startsWith("/btc") &&
      !p.startsWith("/stocks") &&
      !p.startsWith("/scalper") &&
      !p.startsWith("/mm") &&
      !p.startsWith("/labs") &&
      !p.startsWith("/llm") &&
      !p.startsWith("/organize"),
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
      isDashboardMarketIntelRoute(p) ||
      isDashboardExperimentRoute(p) ||
      isDashboardTeamRoute(p) ||
      p.startsWith("/agent-setup") ||
      p.startsWith("/assets") ||
      p.startsWith("/analyzer") ||
      p.startsWith("/pumpfun") ||
      p.includes("-experiment") ||
      p.startsWith("/arbitrage") ||
      p.startsWith("/labs") ||
      p.startsWith("/llm") ||
      p.startsWith("/organize") ||
      p === "/btc" ||
      p.startsWith("/stocks") ||
      p.startsWith("/scalper") ||
      p.startsWith("/mm"),
    items: [
      {
        href: "/overview",
        label: "Overview",
        description: "Command center and pillar summary",
        icon: LayoutDashboard,
      },
    ],
    sections: [
      {
        id: "machine-money",
        label: "Machine Money",
        icon: Layers,
        items: DASHBOARD_PILLAR_NAV.map(pillarToNavItem),
      },
      {
        id: "market-intel",
        label: "Market Intel",
        icon: FileSearch,
        items: DASHBOARD_MARKET_INTEL_NAV.map(marketIntelToNavItem),
      },
      {
        id: "experiments",
        label: "Experiments",
        icon: FlaskConical,
        adminOnly: true,
        items: DASHBOARD_EXPERIMENT_NAV.map(experimentToNavItem),
      },
      {
        id: "team",
        label: "Team",
        icon: UsersRound,
        adminOnly: true,
        items: [
          ...DASHBOARD_TEAM_NAV.map(teamToNavItem),
          {
            href: "/multiwallet/recover",
            label: "Recover farm wallets",
            description: "Consolidate multi-wallet farm balances",
            icon: ArrowLeftRight,
            adminOnly: true,
          },
        ],
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
        description: "Operator registry, stakers and totals",
        adminOnly: true,
      },
    ],
  },
  {
    id: "marketplace",
    label: "APIs",
    href: MARKETPLACE_NAV_BUILD,
    icon: Code2,
    match: (p) => p.startsWith("/marketplace") || p.startsWith("/playground"),
    items: [
      {
        href: MARKETPLACE_NAV_BUILD,
        label: "Integrate",
        icon: Code2,
        description: "Wire agents via MCP, SDK & x402",
      },
      {
        href: MARKETPLACE_NAV_BROWSE,
        label: "Catalog",
        icon: Layers,
        description: "Preview routes in the browser",
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
    href: "/token",
    label: "$SYRA token",
    icon: Coins,
    description: "Mint, buy links, utility, and buyback",
  },
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

/** Hidden routes, visible in More when admin wallet is connected. */
export const SITE_NAV_ADMIN_MORE: NavLinkItem[] = [
  {
    href: "/post",
    label: "Ship log",
    icon: Megaphone,
    description: "Social post studio, video & photo decks",
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
];

export function getSiteNavMoreItems(isAdmin: boolean): NavLinkItem[] {
  if (!isAdmin) return SITE_NAV_MORE;
  return [...SITE_NAV_MORE, ...SITE_NAV_ADMIN_MORE];
}
