import type { LucideIcon } from "lucide-react";
import { ClipboardList, FlaskConical, Sparkles, UsersRound } from "lucide-react";
import { INTERNAL_BASE_PATH, isInternalRoute } from "@/lib/internalRoutes";

export type DashboardTeamNavItem = {
  id: string;
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
};

/** Admin-only team tools — Labs, LLM, Organize, Internal. */
export const DASHBOARD_TEAM_NAV: readonly DashboardTeamNavItem[] = [
  {
    id: "labs",
    label: "Labs",
    description: "x402 payments & tooling",
    icon: FlaskConical,
    to: "/labs",
    isActive: (p) => p === "/labs" || p.startsWith("/labs/"),
  },
  {
    id: "llm",
    label: "LLM",
    description: "Model playground",
    icon: Sparkles,
    to: "/llm",
    isActive: (p) => p === "/llm" || p.startsWith("/llm/"),
  },
  {
    id: "organize",
    label: "Organize",
    description: "Internal ops backlog",
    icon: ClipboardList,
    to: "/organize",
    isActive: (p) => p === "/organize" || p.startsWith("/organize/"),
  },
  {
    id: "internal",
    label: "Internal",
    description: "Scout agents & team hub",
    icon: UsersRound,
    to: INTERNAL_BASE_PATH,
    isActive: (p) => isInternalRoute(p),
  },
];

export function isDashboardTeamRoute(pathname: string): boolean {
  return DASHBOARD_TEAM_NAV.some((item) => item.isActive(pathname));
}
