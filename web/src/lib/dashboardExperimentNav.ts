import type { LucideIcon } from "lucide-react";
import { Droplets, FlaskConical, Scale } from "lucide-react";

export type DashboardExperimentNavItem = {
  id: string;
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  badge?: { label: string; className?: string };
};

/** Internal-team experiment desks — admin wallet only. */
export const DASHBOARD_EXPERIMENT_NAV: readonly DashboardExperimentNavItem[] = [
  {
    id: "trading",
    label: "Trading agents",
    description: "Multi-agent spot trading",
    icon: FlaskConical,
    to: "/trading-experiment",
    isActive: (p) => p.startsWith("/trading-experiment"),
  },
  {
    id: "arbitrage",
    label: "Arbitrage",
    description: "Cross-venue spread scanner",
    icon: Scale,
    to: "/arbitrage-experiment",
    isActive: (p) => p.startsWith("/arbitrage-experiment"),
  },
  {
    id: "lp",
    label: "LP agents",
    description: "Meteora DLMM agents",
    icon: Droplets,
    to: "/lp-experiment",
    isActive: (p) => p.startsWith("/lp-experiment"),
    badge: { label: "Beta" },
  },
];

export function isDashboardExperimentRoute(pathname: string): boolean {
  return DASHBOARD_EXPERIMENT_NAV.some((item) => item.isActive(pathname));
}
