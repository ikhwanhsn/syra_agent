import type { LucideIcon } from "lucide-react";
import {
  Bot,
  FileSearch,
} from "lucide-react";
import { isDashboardPillarRoute } from "@/lib/dashboardPillarNav";

export type ProofNavItem = {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  external?: boolean;
};

/** Demoted proof-layer routes, live demos powered by the Syra rail. */
export const PROOF_NAV_ITEMS: ProofNavItem[] = [
  {
    href: "/",
    label: "Reference agent",
    description: "Try the chat demo, a client of the Syra rail",
    icon: Bot,
  },
  {
    href: "/assets",
    label: "Assets",
    description: "Market dossiers and token lookup",
    icon: FileSearch,
  },
];

export function isProofRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/c/")) return true;
  if (pathname === "/about" || pathname === "/settings") return true;
  const prefixes = ["/assets"];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isDashboardRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/overview") ||
    pathname.startsWith("/agent-setup") ||
    isDashboardPillarRoute(pathname)
  );
}

export function isBuildRoute(pathname: string): boolean {
  return pathname.startsWith("/marketplace") || pathname.startsWith("/playground");
}

export function isWalletRoute(pathname: string): boolean {
  return pathname === "/wallet" || pathname.startsWith("/wallet/");
}
