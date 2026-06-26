import type { LucideIcon } from "lucide-react";
import { Coins, Code2, Landmark, Rocket, Sprout } from "lucide-react";
import type { PillarId } from "@/lib/pillarsApi";

/** Pillars live for all users — not gated behind admin Machine Money preview. */
export const SHIPPED_PILLAR_IDS = ["earn"] as const satisfies readonly PillarId[];

export function isPillarShipped(pillarId: string): boolean {
  return (SHIPPED_PILLAR_IDS as readonly string[]).includes(pillarId);
}

export function isPillarGated(pillarId: string, machineMoneyUnlocked: boolean): boolean {
  return !isPillarShipped(pillarId) && !machineMoneyUnlocked;
}

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
    to: "/earn",
    icon: Coins,
    isActive: (p) => p === "/earn" || p.startsWith("/earn/"),
  },
  {
    id: "treasury",
    label: "Treasury",
    description: "Allocate and manage capital",
    to: "/treasury",
    icon: Landmark,
    isActive: (p) => p === "/treasury" || p.startsWith("/treasury/"),
  },
  {
    id: "invest",
    label: "Invest",
    description: "Deploy capital autonomously",
    to: "/invest",
    icon: Rocket,
    isActive: (p) => p === "/invest" || p.startsWith("/invest/"),
  },
  {
    id: "spend",
    label: "Spend",
    description: "x402 native payments",
    to: "/spend",
    icon: Code2,
    isActive: (p) => p === "/spend" || p.startsWith("/spend/"),
  },
  {
    id: "grow",
    label: "Grow",
    description: "Yield + portfolio optimization",
    to: "/grow",
    icon: Sprout,
    isActive: (p) => p === "/grow" || p.startsWith("/grow/"),
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
