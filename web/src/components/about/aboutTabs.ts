import type { LucideIcon } from "lucide-react";
import { BarChart3, Building2, Layers, MessageCircle } from "lucide-react";

export type AboutTabId = "overview" | "analytics" | "product" | "connect";

export interface AboutTabDef {
  id: AboutTabId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const ABOUT_TABS: AboutTabDef[] = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Overview",
    description: "Mission, positioning & company snapshot",
    icon: Building2,
  },
  {
    id: "analytics",
    label: "Analytics",
    shortLabel: "Analytics",
    description: "Live on-chain $SYRA metrics",
    icon: BarChart3,
  },
  {
    id: "product",
    label: "Product",
    shortLabel: "Product",
    description: "How Syra works & core pillars",
    icon: Layers,
  },
  {
    id: "connect",
    label: "Connect",
    shortLabel: "Connect",
    description: "Community, platforms & links",
    icon: MessageCircle,
  },
];

export const DEFAULT_ABOUT_TAB: AboutTabId = "overview";

export function parseAboutTab(value: string | null | undefined): AboutTabId {
  if (value && ABOUT_TABS.some((t) => t.id === value)) {
    return value as AboutTabId;
  }
  return DEFAULT_ABOUT_TAB;
}
