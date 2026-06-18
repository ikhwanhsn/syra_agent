/** Single source of truth for Syra product focus — machine money for AI trading agents. */

export const SYRA_TAGLINE = "Machine money for AI trading agents";

export const SYRA_USP =
  "Machine money for AI trading agents on Solana — x402 pay-per-call APIs, agent wallets, and treasury policy.";

export const SYRA_ONE_LINER = "Machine money for AI trading agents on Solana.";

export const SYRA_PROOF_FRAMING =
  "Powered by Syra machine money — live proof that autonomous agents earn, spend, and trade on Syra infrastructure.";

export const SYRA_RAIL_MODULES = [
  {
    title: "Intelligence + execution APIs",
    description:
      "Pay-per-call x402 routes for sentiment, risk, smart-money flow, signals, charts, and swaps — agents discover and fund tools autonomously.",
    features: ["x402 USDC on Solana", "OpenAPI catalog", "MCP + SDK"],
  },
  {
    title: "Agent money layer",
    description:
      "Wallets, treasury, and a deterministic policy engine — caps, allowlists, and auditable spend so agents hold and pay without human babysitting.",
    features: ["Agent wallets", "Spend caps", "Policy engine"],
  },
  {
    title: "High-value intelligence routes",
    description:
      "Smart-money flow, risk scoring, signals, and execution surfaces agents pay for repeatedly — composable with the rest of the rail.",
    features: ["Nansen smart money", "Risk scoring", "Multi-DEX execution"],
  },
] as const;
