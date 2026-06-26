import type { LucideIcon } from "lucide-react";
import { Bitcoin, BrainCircuit, Droplets, Globe } from "lucide-react";

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
    id: "lp",
    label: "LP agents",
    description: "Meteora DLMM agents",
    icon: Droplets,
    to: "/lp-experiment",
    isActive: (p) => p.startsWith("/lp-experiment"),
    badge: { label: "Beta" },
  },
  {
    id: "btc",
    label: "BTC quant",
    description: "Onchain cbBTC quant agents",
    icon: Bitcoin,
    to: "/btc-experiment",
    isActive: (p) => p.startsWith("/btc-experiment") && !p.startsWith("/btc2-experiment"),
    badge: { label: "Beta" },
  },
  {
    id: "btc2",
    label: "BTC quant agent",
    description: "Institutional AI quant desk · spot cbBTC via Jupiter",
    icon: BrainCircuit,
    to: "/btc2-experiment",
    isActive: (p) => p.startsWith("/btc2-experiment"),
    badge: { label: "Experimental" },
  },
  {
    id: "btc3",
    label: "Macro Intelligence",
    description: "Global macro news → historical similarity → BTC spot allocation",
    icon: Globe,
    to: "/btc3-experiment",
    isActive: (p) => p.startsWith("/btc3-experiment"),
    badge: { label: "Experimental" },
  },
];

export function isDashboardExperimentRoute(pathname: string): boolean {
  return DASHBOARD_EXPERIMENT_NAV.some((item) => item.isActive(pathname));
}
