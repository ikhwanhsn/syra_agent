/** Rotating narrative themes — LLM picks one per generation for variety. */
export const SYRA_NARRATIVE_THEMES = [
  {
    id: "agent-economy",
    label: "Agent economy thesis",
    angle: "Syra as the financial OS for autonomous agents — not another chatbot.",
  },
  {
    id: "x402-rail",
    label: "x402 micropayments",
    angle: "HTTP-native USDC payments per API call — agents pay, builders earn, no subscriptions.",
  },
  {
    id: "syra-token",
    label: "$SYRA token utility",
    angle: "$SYRA staking for API discounts, x402-linked buyback, and community alignment.",
  },
  {
    id: "solana-machine-money",
    label: "Machine money on Solana",
    angle: "Solana speed + composability as the settlement layer for millions of autonomous agents.",
  },
  {
    id: "shipping-live",
    label: "Live product momentum",
    angle: "Bootstrapped team shipping real product in 2025 — agents, APIs, experiments, and paid rails live.",
  },
  {
    id: "treasury-autonomy",
    label: "Treasury autonomy",
    angle: "Agents that earn, hold, manage, and deploy capital without humans babysitting every tx.",
  },
  {
    id: "defi-agents",
    label: "DeFi for agents",
    angle: "Liquidity, yield, swaps, and on-chain execution built for machines — not retail dashboards.",
  },
  {
    id: "build-in-public",
    label: "Build in public",
    angle: "Transparent metrics, open experiments, and a founder-led team compounding in the wild.",
  },
  {
    id: "infrastructure-bet",
    label: "Infrastructure bet",
    angle: "The long-term winner is the stack that lets agents own capital — intelligence is table stakes.",
  },
  {
    id: "ecosystem-composability",
    label: "Ecosystem composability",
    angle: "Jupiter, Helius, x402, Streamflow — Syra composes the Solana agent stack end to end.",
  },
];

export const SYRA_NARRATIVE_CONTEXT = `Syra ($SYRA) — machine money for AI trading agents on Solana.

Core thesis: Syra is NOT another AI chatbot. It is machine money for AI trading agents — x402 pay-per-call APIs, agent wallets, treasury tooling, and on-chain execution.

Product (live):
- Web agent at syraa.fun — research, tools, swaps, experiments
- API gateway at api.syraa.fun — x402 micropayments, OpenAPI, partner integrations
- API Playground at syraa.fun/playground — shareable paid API request links
- Experiments: trading agents, LP agents, SpaceX IPO agent (SPCX), alpha scouts
- Telegram bot @syra_trading_bot

Token utility ($SYRA on Solana / Pump.fun):
- Staking via Streamflow locks — API fee discounts (e.g. 10K $SYRA = 25% off)
- x402 revenue buyback — portion of paid API revenue swapped to $SYRA for community airdrops
- Community alignment — early supporters backing the agent economy infrastructure play

Traction signals:
- Founded 2025, bootstrapped, founder-led team of 2–5
- Live paid x402 volume from real agent traffic
- Active community on X (@syra_agent) and Telegram
- Shipping weekly — agents, APIs, experiments, internal tools

Tone for posts: confident, hype, build-in-public energy. Make readers feel they're early to the agent economy infrastructure wave. Drive curiosity about $SYRA without making price promises or financial advice. Use punchy lines, arrows (→), and short paragraphs. Under 280 chars ideal but can go longer for thread-style (max ~500 chars for single post).`;

export const SYRA_NARRATIVE_MAX_RETRIES = 5;
export const SYRA_NARRATIVE_EXISTING_SAMPLE = 40;
