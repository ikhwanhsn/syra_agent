export type PartnerCategory =
  | "infrastructure"
  | "liquidity"
  | "data"
  | "wallets"
  | "exchanges";

export type SyraPartner = {
  slug: string;
  name: string;
  href: string;
  category: PartnerCategory;
  /** One line for cards */
  tagline: string;
  /** Short body for list cards */
  summary: string;
  integration: {
    overview: string;
    /** Bullet points: what the integration does */
    capabilities: string[];
    /** Optional technical note for developers */
    technical?: string;
    status: "live" | "beta";
  };
};

const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  infrastructure: "Infrastructure",
  liquidity: "Liquidity & DEX",
  data: "Data & intelligence",
  wallets: "Wallets",
  exchanges: "Exchanges",
};

export function getCategoryLabel(c: PartnerCategory): string {
  return CATEGORY_LABELS[c];
}

export const SYRA_PARTNERS: readonly SyraPartner[] = [
  {
    slug: "solana",
    name: "Solana",
    href: "https://solana.com",
    category: "infrastructure",
    tagline: "High-performance settlement",
    summary:
      "Syra’s agent and execution layer runs on Solana for fast, composable on-chain actions.",
    integration: {
      status: "live",
      overview:
        "Syra is built for Solana’s execution environment: sub-second finality, rich program composability, and a deep DeFi stack. The platform coordinates intelligence, risk, and user intent into transactions and account updates the network can trust.",
      capabilities: [
        "On-chain and off-chain orchestration aligned with Solana’s account model",
        "Composable hooks into SPL tokens and program interactions where the product needs them",
        "Infrastructure tuned for the latency profile institutional workflows expect on Solana",
      ],
      technical:
        "Integrations use standard Solana RPC patterns and program interfaces; Syra does not require custody of user keys for read-only and signed flows supported by the wallet layer.",
    },
  },
  {
    slug: "jupiter",
    name: "Jupiter",
    href: "https://jup.ag",
    category: "liquidity",
    tagline: "Best-route swaps",
    summary:
      "Aggregate liquidity and intelligent routing for execution when the agent or user needs to move assets.",
    integration: {
      status: "live",
      overview:
        "Jupiter provides deep aggregated liquidity and routing. Syra uses this where swap and route optimization is required as part of analysis-to-action flows, keeping execution costs and path quality in view.",
      capabilities: [
        "Smart routing across Solana DEX liquidity",
        "Swap planning suitable for agent-driven or user-confirmed execution",
        "Price discovery that complements Syra’s broader market context",
      ],
    },
  },
  {
    slug: "raydium",
    name: "Raydium",
    href: "https://raydium.io",
    category: "liquidity",
    tagline: "AMM & pools",
    summary:
      "Access Raydium pools and AMM data alongside broader liquidity intelligence.",
    integration: {
      status: "live",
      overview:
        "Raydium remains a core venue on Solana. Syra factors Raydium liquidity and pool dynamics into the picture when users care about on-chain depth, not just a single quote.",
      capabilities: [
        "Context on Raydium pools relevant to a token or strategy view",
        "Complementary to aggregated routing (e.g. Jupiter) for a fuller venue picture",
      ],
    },
  },
  {
    slug: "pyth",
    name: "Pyth",
    href: "https://pyth.network",
    category: "data",
    tagline: "Institutional price feeds",
    summary:
        "High-fidelity reference prices and confidence intervals for calibrating risk and display.",
    integration: {
      status: "live",
      overview:
        "Pyth supplies low-latency, publisher-sourced market data. Syra blends Pyth inputs with other signals so dashboards and agents reason on prices that institutions recognize.",
      capabilities: [
        "Reference prices for key pairs and assets",
        "Input layer for risk checks and notional context",
        "Suitable pairing with on-chain and social signals for a rounded view",
      ],
    },
  },
  {
    slug: "helius",
    name: "Helius",
    href: "https://helius.dev",
    category: "infrastructure",
    tagline: "Solana infrastructure",
    summary:
      "Reliable RPC, webhooks, and data APIs to keep Syra’s chain reads fast and accurate.",
    integration: {
      status: "live",
      overview:
        "Helius powers performant access to Solana state and events. Syra uses this stack to scale read throughput, support indexing-style queries, and keep the product responsive under load.",
      capabilities: [
        "Production-grade RPC for core workloads",
        "Event and account insights where the product surfaces chain activity",
        "Operational headroom for concurrent users and agent workloads",
      ],
    },
  },
  {
    slug: "phantom",
    name: "Phantom",
    href: "https://phantom.app",
    category: "wallets",
    tagline: "Native Solana wallet",
    summary:
      "Familiar wallet flows for users connecting to Syra’s agent and trading surfaces.",
    integration: {
      status: "live",
      overview:
        "Phantom is a primary wallet for many Solana users. Syra’s client flows align with Phantom’s connection and signing model so users can act with a wallet they already trust.",
      capabilities: [
        "Standard connect / sign patterns for supported actions",
        "User-controlled keys; Syra requests signatures only for intended transactions",
        "Streamlined handoff between read-only research and on-chain steps where offered",
      ],
    },
  },
  {
    slug: "nansen",
    name: "Nansen",
    href: "https://nansen.ai",
    category: "data",
    tagline: "Smart money labels",
    summary:
      "On-chain entity and wallet intelligence to enrich who is behind the flow.",
    integration: {
      status: "live",
      overview:
        "Nansen brings labeled entities and capital-flow context. Syra uses this class of signal to make whale and institutional behavior more legible in research and agent outputs—always as probabilistic context, not certainty.",
      capabilities: [
        "Entity-aware views where labels add explanatory power",
        "Complementary to raw transaction and holder statistics",
        "Suitable for narrative synthesis in agent responses when data is available",
      ],
    },
  },
  {
    slug: "dexscreener",
    name: "DexScreener",
    href: "https://dexscreener.com",
    category: "data",
    tagline: "DEX pair discovery",
    summary:
      "Live pairs, charts, and liquidity screeners to ground token discovery in market reality.",
    integration: {
      status: "live",
      overview:
        "DexScreener is a universal lens on DEX pairs. Syra references this layer when users need quick, multi-venue context on a token’s trading footprint and pair-level activity.",
      capabilities: [
        "Pair and chart context across supported venues",
        "Screening input for what’s live vs. theoretical",
        "Fits alongside Syra’s other market and on-chain data sources",
      ],
    },
  },
  {
    slug: "rugcheck",
    name: "Rugcheck",
    href: "https://rugcheck.xyz",
    category: "data",
    tagline: "Token risk heuristics",
    summary:
      "Automated checks and flags to surface obvious contract and concentration risks early.",
    integration: {
      status: "live",
      overview:
        "Rugcheck offers heuristic token safety signals popular with Solana traders. Syra can incorporate these checks in risk-adjacent surfaces so users see a structured first pass before deeper diligence.",
      capabilities: [
        "Heuristic flags on mint and related risk dimensions where applicable",
        "A fast layer before manual or custom analysis",
        "Not a substitute for full review; always shown as one signal among many",
      ],
    },
  },
  {
    slug: "binance",
    name: "Binance",
    href: "https://binance.com",
    category: "exchanges",
    tagline: "CEX market context",
    summary:
      "Reference liquidity and spot/futures context from a major global venue where relevant to Syra’s market stack.",
    integration: {
      status: "live",
      overview:
        "Centralized exchange data remains part of the global price formation story. Syra can incorporate Binance-originated or Binance-sourced market context in modules that compare on-chain and off-venue conditions—without equating CEX activity with on-chain risk.",
      capabilities: [
        "Context on broad liquidity and large-venue dynamics where integrated",
        "Complementary to DEX-only views",
        "Clearly separated from custody or execution on Binance within Syra’s own flows",
      ],
    },
  },
  {
    slug: "messari",
    name: "Messari",
    href: "https://messari.io",
    category: "data",
    tagline: "Institutional research",
    summary:
      "Standardized protocol and asset metadata for calmer, citation-friendly summaries.",
    integration: {
      status: "beta",
      overview:
        "Messari provides research-grade taxonomies and metadata. Syra can lean on this layer to keep protocol and asset references consistent in reporting-style outputs and agent briefings.",
      capabilities: [
        "Structured facts and labels where the integration is enabled",
        "Helps avoid ad-hoc naming in multi-asset views",
        "Suited to institutional readouts and documentation touchpoints",
      ],
    },
  },
  {
    slug: "pump",
    name: "Pump.fun",
    href: "https://pump.fun",
    category: "liquidity",
    tagline: "Launch & bonding",
    summary:
      "Ecosystem access for new token launches and bonding-curve style venues Syra users track.",
    integration: {
      status: "live",
      overview:
        "Pump and similar launchpads shape a large share of new Solana token activity. Syra acknowledges this venue class in discovery and risk copy so high-volatility, early-stage names are framed with appropriate caveats.",
      capabilities: [
        "Awareness of launchpad class dynamics in product messaging where relevant",
        "Complements DexScreener and on-chain data for very new markets",
        "User guidance toward diligence, not promotion",
      ],
    },
  },
  {
    slug: "mevx",
    name: "MevX",
    href: "https://mevx.io",
    category: "liquidity",
    tagline: "Trading terminal data",
    summary:
      "Multi-chain trading data and execution APIs for Solana meme and DEX workflows.",
    integration: {
      status: "beta",
      overview:
        "Syra agents can pull MevX trades, token, and pool data via agent tools (mevx-*) when MEVX_API_KEY is configured. X: https://x.com/MEVX_Official",
      capabilities: [
        "Recent DEX trade history by pool or wallet",
        "Token and pool market lookups for Solana",
        "API-key partner billed through the Syra agent wallet",
      ],
      technical:
        "Agent tools: mevx-trades, mevx-token, mevx-pools via POST /agent/tools/call. Set MEVX_API_KEY from https://landing-api.mevx.io/",
    },
  },
  {
    slug: "dexter",
    name: "Dexter AI",
    href: "https://dexter.cash",
    category: "infrastructure",
    tagline: "x402 facilitator + onchain intel",
    summary:
      "Solana x402 settlement rails plus paid onchain activity and entity APIs for agents.",
    integration: {
      status: "live",
      overview:
        "Syra already settles Labs routes via the Dexter facilitator. Agents can also call Dexter onchain activity/entity x402 tools and list the Dexter resource catalog. X: https://x.com/dexteraisol",
      capabilities: [
        "Labs facilitator settlement (existing)",
        "dexter-onchain-activity and dexter-onchain-entity agent tools",
        "Free dexter-x402-catalog discovery",
      ],
      technical:
        "Agent tools dexter-* pay https://x402.dexter.cash with the agent Solana USDC wallet.",
    },
  },
  {
    slug: "blocksize",
    name: "Blocksize",
    href: "https://blocksize.info",
    category: "data",
    tagline: "Institutional VWAP & bid/ask",
    summary:
      "Oracle-grade aggregated crypto market data for AI agents over MCP and x402.",
    integration: {
      status: "beta",
      overview:
        "Syra agents query Blocksize VWAP, bid/ask, instrument search, and pre-trade checks via blocksize-* tools. X: https://x.com/blocksizecap",
      capabilities: [
        "Real-time VWAP snapshots (e.g. SOLUSD)",
        "Bid/ask and pre-trade sanity checks",
        "Instrument search before paid quotes",
      ],
      technical:
        "Agent tools blocksize-* against https://mcp.blocksize.info with agent-wallet x402 / credits.",
    },
  },
] as const;

export const PARTNER_SLUGS: readonly string[] = SYRA_PARTNERS.map((p) => p.slug);

export function getPartnerBySlug(slug: string | undefined): SyraPartner | undefined {
  if (!slug) return undefined;
  return SYRA_PARTNERS.find((p) => p.slug === slug);
}

export const ALL_CATEGORIES: readonly PartnerCategory[] = [
  "infrastructure",
  "liquidity",
  "data",
  "wallets",
  "exchanges",
];
