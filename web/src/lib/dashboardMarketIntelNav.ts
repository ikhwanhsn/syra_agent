import type { LucideIcon } from "lucide-react";
import { BarChart3, Bitcoin, FileSearch, Search } from "lucide-react";
export type DashboardMarketIntelNavItem = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  badge?: { label: string; className?: string };
};

/** Asset research, alpha scouting, and macro intel, dashboard sidebar group. */
export const DASHBOARD_MARKET_INTEL_NAV: readonly DashboardMarketIntelNavItem[] = [
  {
    id: "assets",
    label: "Assets",
    to: "/assets",
    icon: FileSearch,
    isActive: (p) => p.startsWith("/assets"),
  },
  {
    id: "token-analyzer",
    label: "Token Analyzer",
    to: "/analyzer",
    icon: Search,
    isActive: (p) => p.startsWith("/analyzer") || p.startsWith("/pumpfun"),
  },
  {
    id: "bitcoin",
    label: "Bitcoin",
    to: "/btc",
    icon: Bitcoin,
    isActive: (p) => p === "/btc",
  },
  {
    id: "stocks",
    label: "Stocks (news)",
    to: "/stocks",
    icon: BarChart3,
    isActive: (p) => p.startsWith("/stocks"),
    badge: { label: "Paper" },
  },
];
export function isDashboardMarketIntelRoute(pathname: string): boolean {
  return DASHBOARD_MARKET_INTEL_NAV.some((item) => item.isActive(pathname));
}
