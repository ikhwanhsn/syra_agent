import type { LucideIcon } from "lucide-react";
import {
  Bot,
  FileSearch,
  FlaskConical,
  Scale,
  Droplets,
  Rocket,
  TrendingUp,
} from "lucide-react";

export type ProofNavItem = {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  external?: boolean;
};

/** Demoted proof-layer routes — live demos powered by the Syra rail. */
export const PROOF_NAV_ITEMS: ProofNavItem[] = [
  {
    href: "/",
    label: "Reference agent",
    description: "Try the chat demo — a client of the Syra rail",
    icon: Bot,
  },
  {
    href: "/assets",
    label: "Assets",
    description: "Market dossiers and token lookup",
    icon: FileSearch,
  },
  {
    href: "/trading-experiment",
    label: "Trading experiment",
    description: "Multi-agent spot trading lab",
    icon: FlaskConical,
  },
  {
    href: "/spcx",
    label: "SpaceX IPO Agent",
    description: "Live SPCX Nasdaq vs on-chain spread intel",
    icon: Rocket,
  },
  {
    href: "/arbitrage-experiment",
    label: "Arbitrage",
    description: "Cross-venue spread scanner",
    icon: Scale,
  },
  {
    href: "/lp-experiment",
    label: "LP agents",
    description: "Meteora DLMM liquidity agents",
    icon: Droplets,
  },
  {
    href: "/uponly",
    label: "Up Only Fund",
    description: "Flagship allocator case study on Syra rails",
    icon: TrendingUp,
    external: true,
  },
];

export function isProofRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/c/")) return true;
  if (pathname === "/about" || pathname === "/settings") return true;
  const prefixes = [
    "/assets",
    "/trading-experiment",
    "/spcx",
    "/arbitrage-experiment",
    "/lp-experiment",
  ];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isDashboardRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/overview") ||
    pathname.startsWith("/agent-setup")
  );
}

export function isBuildRoute(pathname: string): boolean {
  return pathname.startsWith("/playground");
}

export function isWalletRoute(pathname: string): boolean {
  return pathname === "/wallet" || pathname.startsWith("/wallet/");
}
