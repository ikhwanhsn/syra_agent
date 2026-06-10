/** Shared Syra brand copy for the documentation site. */

export const SYRA_TAGLINE = "Machine money for AI trading agents";
export const SYRA_DOCS_TITLE = `Syra Docs — ${SYRA_TAGLINE}`;
export const SYRA_DOCS_DESCRIPTION =
  "Documentation for Syra: the financial + intelligence rail for autonomous trading agents on Solana — x402 APIs, agent wallets, treasury policy, and execution.";

export const SYRA_MISSION =
  "Syra enables autonomous agents to generate revenue, hold treasury assets, participate in DeFi, and distribute value on Solana — so agents become independent economic actors, not tools waiting on humans for every financial decision.";

export const SYRA_VISION =
  "Our vision is an economy where millions of AI agents become productive economic actors powered by Solana.";

export const SYRA_HIGHLIGHT =
  "Syra is not building another chatbot. We are building the rail agents pay to think and trade on Solana — intelligence APIs plus agent money infrastructure.";

export const SYRA_DOCS_BADGE = "Machine money · Solana";

export const SYRA_DISCLAIMER =
  "Syra provides infrastructure and intelligence tools for autonomous agents — not financial advice, guaranteed returns, or custody of your keys. Onchain activity carries risk.";

export interface SyraPlatformRow {
  name: string;
  description: string;
  href?: string;
  linkLabel?: string;
}

export const SYRA_PLATFORMS: SyraPlatformRow[] = [
  {
    name: "Web agent",
    description: "Chat, treasury workflows, research, and onchain actions.",
    href: "https://agent.syraa.fun",
    linkLabel: "agent.syraa.fun",
  },
  {
    name: "API gateway",
    description: "x402 pay-per-use routes, OpenAPI specs, and partner integrations.",
    href: "https://api.syraa.fun",
    linkLabel: "api.syraa.fun",
  },
  {
    name: "API Playground",
    description: "Try payment-gated endpoints.",
    href: "https://playground.syraa.fun",
    linkLabel: "playground.syraa.fun",
  },
  {
    name: "x402 Agent",
    description: "Autonomous research and workflow agent on x402scan.",
    href: "/docs/x402-agent/getting-started",
    linkLabel: "x402 Agent docs",
  },
  {
    name: "Telegram",
    description: "Agent access and community.",
    href: "https://t.me/syra_trading_bot",
    linkLabel: "@syra_trading_bot",
  },
  {
    name: "MCP Server",
    description: "Model Context Protocol tools in-repo under mcp-server (aligned with paid API tools).",
  },
];

export const SYRA_PILLARS = [
  {
    title: "Autonomous revenue",
    description: "Agents generate and route income onchain without manual treasury babysitting.",
  },
  {
    title: "Treasury management",
    description: "Hold, allocate, and monitor agent capital with explicit, auditable controls.",
  },
  {
    title: "DeFi participation",
    description: "Liquidity, yield, and protocol surfaces where agents deploy capital.",
  },
  {
    title: "Agent-native payments",
    description: "x402 and composable HTTP payments so agents discover and fund tools autonomously.",
  },
  {
    title: "Real-time on Solana",
    description: "Low-fee, high-throughput settlement for machine-to-machine coordination.",
  },
  {
    title: "Non-custodial",
    description: "Operators keep keys; Syra coordinates intelligence and flows — it does not custody wallets.",
  },
] as const;

export const SYRA_AGENT_CAPABILITIES = [
  {
    title: "Earn onchain",
    description: "Revenue paths and integrations so agents capture value from work they perform.",
  },
  {
    title: "Manage treasuries",
    description: "Balances, allocations, and policy-aware movement of agent-held assets.",
  },
  {
    title: "Research & signals",
    description: "Market context, technicals, news, and on-chain data to inform agent decisions.",
  },
  {
    title: "DeFi & execution",
    description: "Protocol tools, swaps, and experiment surfaces where agents deploy capital.",
  },
  {
    title: "Pay per capability",
    description: "x402 micropayments for tools, partners, and premium automation.",
  },
  {
    title: "Coordinate at scale",
    description: "Machine-to-machine settlement without a human on every transaction.",
  },
] as const;

export const SYRA_FLOW_STEPS = [
  {
    step: "Earn",
    description: "Agents capture revenue from work and integrations — onchain paths built for machines.",
  },
  {
    step: "Manage",
    description: "Treasury balances, allocations, and auditable controls on agent-held capital.",
  },
  {
    step: "Deploy",
    description: "DeFi, rewards, and coordinated settlement as independent economic actors on Solana.",
  },
] as const;
