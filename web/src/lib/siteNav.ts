import type { LucideIcon } from "lucide-react";
import {
  Bot,
  LayoutDashboard,
  UsersRound,
  Telescope,
  FileSearch,
  FlaskConical,
  Scale,
  Droplets,
  Rocket,
  Crosshair,
  Sparkles,
  Trophy,
  TrendingUp,
  Lock,
  Code2,
  BookOpen,
  BookMarked,
  ExternalLink,
  Info,
  Megaphone,
  Presentation,
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
      (p === "/" || p === "/settings" || p.startsWith("/c/") || p === "/wallet") &&
      !p.startsWith("/overview") &&
      !p.startsWith("/agent-setup") &&
      !p.includes("-experiment") &&
      !p.startsWith("/alpha") &&
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
      p.startsWith("/agent-setup") ||
      p.startsWith("/alpha") ||
      p.startsWith("/assets") ||
      p.startsWith("/pumpfun") ||
      p.includes("-experiment") ||
      p.startsWith("/vibe-trading") ||
      p.startsWith("/arena") ||
      p.startsWith("/spcx") ||
      p.startsWith("/arbitrage") ||
      p.startsWith("/internal"),
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/alpha", label: "Alpha intel", icon: Telescope },
      { href: "/assets", label: "Assets", icon: FileSearch },
      { href: "/pumpfun", label: "Pumpfun Alpha", icon: Rocket },
      { href: "/trading-experiment", label: "Trading experiment", icon: FlaskConical },
      { href: "/arena", label: "Alpha Arena", icon: Trophy },
      { href: "/spcx", label: "SpaceX IPO Agent", icon: TrendingUp },
      { href: "/vibe-trading", label: "Bitget Vibe Trader", icon: Sparkles },
      { href: "/arbitrage-experiment", label: "Arbitrage", icon: Scale },
      { href: "/lp-experiment", label: "LP agents", icon: Droplets },
      { href: "/pumpfun-experiment", label: "Pumpfun", icon: Rocket },
      { href: "/rise-experiment", label: "Rise", icon: Crosshair },
      {
        href: "/internal",
        label: "Internal hub",
        icon: UsersRound,
        description: "Team agent monitor & scouts",
        adminOnly: true,
      },
    ],
  },
  {
    id: "staking",
    label: "Staking",
    href: "/staking",
    icon: Lock,
    match: (p) => p.startsWith("/staking"),
    items: [
      { href: "/staking", label: "Locks", icon: Lock, description: "Open and manage Streamflow locks" },
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
    id: "playground",
    label: "Playground",
    href: "/playground",
    icon: Code2,
    match: (p) => p.startsWith("/playground"),
  },
];

export const SITE_NAV_MORE: NavLinkItem[] = [
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
