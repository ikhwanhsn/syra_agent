import type { LucideIcon } from "lucide-react";
import { Compass, Droplets } from "lucide-react";

export type DashboardExperimentNavItem = {
  id: string;
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  badge?: { label: string; className?: string };
};

/** Internal-team experiment desks, admin wallet only. */
export const DASHBOARD_EXPERIMENT_NAV: readonly DashboardExperimentNavItem[] = [
  {
    id: "lp",
    label: "LP agents",
    description: "Meteora DLMM agents",
    icon: Droplets,
    to: "/lp-experiment",
    isActive: (p) => p.startsWith("/lp-experiment"),
    badge: { label: "Beta" },
  },
  {
    id: "meridian",
    label: "Meridian",
    description: "Fast-learn DLMM lab",
    icon: Compass,
    to: "/meridian",
    isActive: (p) => p.startsWith("/meridian"),
    badge: { label: "Lab" },
  },
];

export function isDashboardExperimentRoute(pathname: string): boolean {
  return DASHBOARD_EXPERIMENT_NAV.some((item) => item.isActive(pathname));
}
