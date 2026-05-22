/**
 * Published portfolio snapshot for the fund landing page.
 * Update when new positions are disclosed on-chain.
 */

export type FundPortfolioStatus = "active" | "exited";

export type FundPortfolioCompany = {
  id: string;
  name: string;
  category: string;
  thesis: string;
  network: "Solana";
  status: FundPortfolioStatus;
  /** Deployed notional at entry (USD). */
  deployedUsd: number;
  /** Mark-to-model or last disclosed value (USD). */
  markUsd: number;
  /** Realized + unrealized return since entry (fraction, e.g. 0.42 = +42%). */
  returnPct: number;
  logoUrl: string | null;
  href: string | null;
};

export const FUND_PORTFOLIO: readonly FundPortfolioCompany[] = [
  {
    id: "syra-agent-stack",
    name: "Syra",
    category: "Agent infrastructure",
    thesis:
      "Autonomous research and execution layer for Solana-native funds—our operating stack for diligence, routing, and risk overlays.",
    network: "Solana",
    status: "active",
    deployedUsd: 18_500_000,
    markUsd: 31_200_000,
    returnPct: 0.686,
    logoUrl: "/images/logo-transparent.png",
    href: "https://syraa.fun",
  },
  {
    id: "liquidity-router",
    name: "Jupiter-aligned sleeve",
    category: "Liquidity & execution",
    thesis:
      "Strategic liquidity and routing capacity across Solana DEX depth—supports fund deployment without fragmenting treasury ops.",
    network: "Solana",
    status: "active",
    deployedUsd: 14_200_000,
    markUsd: 19_800_000,
    returnPct: 0.394,
    logoUrl: "/images/partners/jupiter.png",
    href: "https://jup.ag",
  },
  {
    id: "oracle-risk",
    name: "Pyth Network",
    category: "Market data",
    thesis:
      "Institutional-grade price feeds calibrating position sizing, risk bands, and agent confidence intervals across the book.",
    network: "Solana",
    status: "active",
    deployedUsd: 9_600_000,
    markUsd: 12_400_000,
    returnPct: 0.292,
    logoUrl: "/images/partners/pyth.png",
    href: "https://pyth.network",
  },
  {
    id: "infra-rpc",
    name: "Helius",
    category: "Infrastructure",
    thesis:
      "Production RPC and indexing headroom for concurrent agent workloads and treasury monitoring at fund scale.",
    network: "Solana",
    status: "active",
    deployedUsd: 6_800_000,
    markUsd: 8_900_000,
    returnPct: 0.309,
    logoUrl: null,
    href: "https://helius.dev",
  },
  {
    id: "agent-launch",
    name: "Agent launch cohort",
    category: "Venture",
    thesis:
      "Early-stage agent-native products on Solana—distribution, liquidity, and operator support bundled with our mandate.",
    network: "Solana",
    status: "active",
    deployedUsd: 29_300_000,
    markUsd: 38_600_000,
    returnPct: 0.317,
    logoUrl: null,
    href: null,
  },
] as const;

export function getPortfolioTotals(companies: readonly FundPortfolioCompany[]): {
  deployedUsd: number;
  markUsd: number;
  blendedReturnPct: number;
  activeCount: number;
} {
  const active = companies.filter((c) => c.status === "active");
  const deployedUsd = active.reduce((s, c) => s + c.deployedUsd, 0);
  const markUsd = active.reduce((s, c) => s + c.markUsd, 0);
  const blendedReturnPct =
    deployedUsd > 0 ? (markUsd - deployedUsd) / deployedUsd : 0;
  return {
    deployedUsd,
    markUsd,
    blendedReturnPct,
    activeCount: active.length,
  };
}
