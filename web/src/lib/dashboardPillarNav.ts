import type { LucideIcon } from "lucide-react";
import { Coins, Code2, Landmark, Rocket, Sprout } from "lucide-react";

export type DashboardPillarNavItem = {
  id: string;
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

/** Five-pillar Machine Money — lives in dashboard sidebar only (not top navbar). */
export const DASHBOARD_PILLAR_NAV: readonly DashboardPillarNavItem[] = [
  {
    id: "earn",
    label: "Earn",
    description: "Agents monetize skills",
    to: "/overview/earn",
    icon: Coins,
    isActive: (p) => p.startsWith("/overview/earn"),
  },
  {
    id: "treasury",
    label: "Treasury",
    description: "Allocate and manage capital",
    to: "/overview/treasury",
    icon: Landmark,
    isActive: (p) => p.startsWith("/overview/treasury"),
  },
  {
    id: "invest",
    label: "Invest",
    description: "Deploy capital autonomously",
    to: "/overview/invest",
    icon: Rocket,
    isActive: (p) => p.startsWith("/overview/invest"),
  },
  {
    id: "spend",
    label: "Spend",
    description: "x402 native payments",
    to: "/overview/spend",
    icon: Code2,
    isActive: (p) => p.startsWith("/overview/spend"),
  },
  {
    id: "grow",
    label: "Grow",
    description: "Yield + portfolio optimization",
    to: "/overview/grow",
    icon: Sprout,
    isActive: (p) => p.startsWith("/overview/grow"),
  },
];

export function isDashboardPillarRoute(pathname: string): boolean {
  return DASHBOARD_PILLAR_NAV.some((item) => item.isActive(pathname));
}

export const MACHINE_MONEY_SOON_BADGE = {
  label: "Soon",
  className:
    "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300",
} as const;

export function getDashboardPillarNavItem(id: string): DashboardPillarNavItem | undefined {
  return DASHBOARD_PILLAR_NAV.find((item) => item.id === id);
}
