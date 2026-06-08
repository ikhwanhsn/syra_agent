/** Internal team reference — single source for /info (not linked in nav). */

export {
  SYRA_CAPABILITIES,
  SYRA_COMMUNITY_LINKS,
  SYRA_DIFFERENTIATION,
  SYRA_DISCLAIMER,
  SYRA_HIGHLIGHT,
  SYRA_MISSION,
  SYRA_PILLARS,
  SYRA_PLATFORMS,
  SYRA_PROBLEM,
  SYRA_SOLUTION,
  SYRA_STATS,
  SYRA_TAGLINE,
  SYRA_TRACTION,
  SYRA_VISION,
  SYRA_WHY_SOLANA,
} from "@/content/syraAbout";

export const SYRA_INFO_EYEBROW = "Internal reference · URL only";

export const SYRA_PROBLEM_BULLETS = [
  "Agents create value but lack native financial infrastructure",
  "Treasury management stays manual — a bottleneck on every deployment",
  "No standard layer for machines to earn, hold, and deploy capital at scale",
  "The agent economy cannot scale until money moves as autonomously as intelligence",
];

export const SYRA_SOLUTION_BULLETS = [
  "Syra is not building another AI agent — we build the economic layer agents run on",
  "Solana: low latency, high throughput, composable financial primitives",
  "Non-custodial: operators keep keys; Syra coordinates intelligence and flows",
];

export const SYRA_PRODUCT_FLOW = [
  {
    step: "01",
    title: "Earn",
    description:
      "Agents capture revenue from work they perform — integrations and onchain paths built for machines.",
  },
  {
    step: "02",
    title: "Manage",
    description:
      "Treasury balances, allocations, and policy-aware movement of agent-held assets with auditable controls.",
  },
  {
    step: "03",
    title: "Deploy",
    description:
      "DeFi strategies, rewards distribution, and coordinated settlement as independent economic actors on Solana.",
  },
] as const;

export const SYRA_WHY_NOW = {
  title: "Why now",
  body: [
    "The AI agent market is growing rapidly, but nearly every project hits the same bottleneck: agents lack economic autonomy.",
    "Agents can already create content, analyze markets, and automate workflows. The missing layer is ownership of capital and financial coordination.",
    "As AI becomes more autonomous, demand for machine-native financial systems becomes unavoidable.",
  ],
};

export const SYRA_FOUNDER_FIT = {
  title: "Founder–market fit",
  body: [
    "Built at the intersection of AI, Web3, and developer infrastructure — not a traditional AI startup or a traditional crypto startup.",
    "Experience spans full-stack development, blockchain infrastructure, AI systems, Solana ecosystem tools, and startup building.",
    "Focus: product, engineering, growth, and ecosystem development for the emerging machine economy.",
  ],
};

export const SYRA_COMPETITION = {
  title: "Competition & our bet",
  body: "Most AI-agent projects focus on intelligence, workflows, or user interactions. Syra focuses on economic autonomy. The long-term winner will be the ecosystem that enables agents to generate, manage, and deploy capital efficiently — not necessarily the agent with the highest intelligence.",
};

export const SYRA_MARKET = {
  headline: "The machine economy is inevitable",
  narrative:
    "As AI becomes more autonomous, demand for machine-native financial systems becomes unavoidable. If Syra becomes the financial operating system for even a small percentage of the agent economy, annual revenue can scale into eight figures.",
  stats: [
    { value: "Millions", label: "AI agents ahead", detail: "Expected scale of the autonomous agent economy" },
    { value: "Solana", label: "Settlement layer", detail: "Speed, fees, and DeFi depth for agent coordination" },
    { value: "2025", label: "Founded & shipping", detail: "Live product — bootstrapped, founder-led" },
  ],
};

export const SYRA_BUSINESS_STREAMS = [
  {
    title: "Agent infrastructure",
    description: "Platform fees for treasury tooling, coordination, and production agent deployments.",
  },
  {
    title: "Transaction & API usage",
    description: "x402 micropayments and per-call routes as agents consume data, tools, and partners.",
  },
  {
    title: "DeFi & treasury services",
    description: "Premium automation, strategy integrations, and managed flows for agent-held capital.",
  },
  {
    title: "Enterprise agents",
    description: "Custom deployments, SLAs, and white-label machine-money stacks for funds and platforms.",
  },
];

export const SYRA_ROADMAP = [
  {
    period: "Now",
    items: [
      "Autonomous revenue generation and treasury management",
      "DeFi participation and agent coordination on Solana",
    ],
  },
  {
    period: "H1 2026",
    items: [
      "Deeper Solana infrastructure and protocol integrations",
      "Enterprise agent deployments and premium automation tiers",
    ],
  },
  {
    period: "H2 2026",
    items: [
      "Multi-agent economic coordination at scale",
      "Solana Mobile exploration for native financial agents",
    ],
  },
  {
    period: "Beyond",
    items: [
      "Financial OS for a growing share of the autonomous agent economy",
      "Eight-figure revenue path as agent count and onchain activity compound",
    ],
  },
];

export const SYRA_MOAT = [
  {
    dimension: "Category focus",
    syra: "Economic autonomy for agents — not intelligence theater or generic UI",
  },
  {
    dimension: "Solana-native economics",
    syra: "Real-time settlement and composable DeFi for machines acting in parallel",
  },
  {
    dimension: "Agent-native payments",
    syra: "x402 / HTTP 402 — discover, pay, and compose APIs without human billing ops",
  },
  {
    dimension: "Production stack",
    syra: "Live web agent, API gateway, and ecosystem integrations — shipping since 2025",
  },
  {
    dimension: "Founder–market fit",
    syra: "AI × Web3 × developer infrastructure — built specifically for the machine economy",
  },
];

export const SYRA_STACK_LAYERS = [
  {
    label: "Experience",
    items: [
      "Web agent · agent.syraa.fun (this app)",
      "Telegram · @syra_trading_bot",
      "Docs · docs.syraa.fun",
      "API Playground · playground.syraa.fun",
    ],
  },
  {
    label: "Machine money API",
    items: [
      "Treasury workflows, agent tools, partner integrations",
      "Signals, research, on-chain data for agent decisions",
      "OpenAPI + x402 discovery at api.syraa.fun",
    ],
  },
  {
    label: "Agent rails",
    items: [
      "HTTP 402 micropayments (USDC on Solana)",
      "MPP / AgentCash discovery for composable tool graphs",
      "Agent registry (8004) for discoverability and reputation",
    ],
  },
  {
    label: "Capital & execution",
    items: [
      "Non-custodial wallets (Privy, Solana adapters)",
      "DeFi participation, staking, experiment surfaces",
      "Real-time settlement on Solana",
    ],
  },
];

export interface SyraMonorepoApp {
  package: string;
  role: string;
  url?: string;
}

export const SYRA_MONOREPO_APPS: SyraMonorepoApp[] = [
  { package: "web", role: "Syra Agent UI — chat, dashboard, experiments", url: "https://agent.syraa.fun" },
  { package: "api", role: "Backend — x402 routes, agent sessions, partner tools", url: "https://api.syraa.fun" },
  { package: "documentation", role: "Public docs site", url: "https://docs.syraa.fun" },
  { package: "landing", role: "Marketing site", url: "https://syraa.fun" },
  { package: "api-playground", role: "x402 API playground", url: "https://playground.syraa.fun" },
  { package: "ai-agent", role: "Legacy/alternate agent package (if deployed separately)" },
  { package: "mcp-server", role: "MCP tools aligned with paid API surface" },
  { package: "staking", role: "Streamflow staking UI" },
  { package: "prediction-game", role: "Prediction game product" },
  { package: "uponly-fund", role: "Uponly fund dashboard" },
];

export const SYRA_HIDDEN_ROUTES = [
  { path: "/info", description: "This page — full internal Syra reference (not in nav)" },
  { path: "/deck", description: "Investor pitch deck (keyboard/swipe navigation)" },
  { path: "/post", description: "Ship-log social post studio (video + photo)" },
  { path: "/post/video", description: "Ship-log video slide deck for screen recording" },
  { path: "/post/photo", description: "Ship-log photo templates for X posts" },
];

export const SYRA_INFO_SECTIONS = [
  { id: "overview", title: "Overview" },
  { id: "stats", title: "At a glance" },
  { id: "problem", title: "Problem" },
  { id: "solution", title: "Solution" },
  { id: "why-now", title: "Why now" },
  { id: "why-solana", title: "Why Solana" },
  { id: "product-flow", title: "Product flow" },
  { id: "pillars", title: "Pillars" },
  { id: "capabilities", title: "Capabilities" },
  { id: "differentiation", title: "Differentiation" },
  { id: "market", title: "Market & revenue" },
  { id: "traction", title: "Traction" },
  { id: "roadmap", title: "Roadmap" },
  { id: "moat", title: "Moat" },
  { id: "stack", title: "Tech stack" },
  { id: "platforms", title: "Platforms & links" },
  { id: "monorepo", title: "Monorepo map" },
  { id: "team", title: "Team & fit" },
  { id: "internal-routes", title: "Hidden routes" },
  { id: "disclaimer", title: "Disclaimer" },
] as const;
