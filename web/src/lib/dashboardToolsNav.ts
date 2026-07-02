import type { LucideIcon } from "lucide-react";
import { Layers } from "lucide-react";

export type DashboardToolsNavItem = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

/** Dashboard sidebar — internal team tools (admin wallet only). */
export const DASHBOARD_TOOLS_NAV: readonly DashboardToolsNavItem[] = [
  {
    id: "multiwallet",
    label: "Multiwallet",
    to: "/multiwallet",
    icon: Layers,
    isActive: (p) => p.startsWith("/multiwallet"),
  },
];

export function isDashboardToolsRoute(pathname: string): boolean {
  return DASHBOARD_TOOLS_NAV.some((item) => item.isActive(pathname));
}
