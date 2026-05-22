/**
 * Published portfolio investments for the fund landing page.
 * Project identity and thesis only — no sizing, marks, or returns (privacy).
 */

export type FundPortfolioStatus = "active" | "exited";

export type FundPortfolioInvestment = {
  id: string;
  name: string;
  category: string;
  thesis: string;
  network: "Solana";
  status: FundPortfolioStatus;
  logoUrl: string | null;
  href: string | null;
};

export const FUND_PORTFOLIO: readonly FundPortfolioInvestment[] = [
  {
    id: "syra-agent-stack",
    name: "Syra",
    category: "Agent infrastructure",
    thesis:
      "Autonomous research and execution layer for Solana-native funds—our operating stack for diligence, routing, and risk overlays.",
    network: "Solana",
    status: "active",
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
    logoUrl: null,
    href: null,
  },
] as const;

export function getActivePortfolioCount(
  investments: readonly FundPortfolioInvestment[],
): number {
  return investments.filter((c) => c.status === "active").length;
}
