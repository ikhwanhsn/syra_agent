import { BarChart3, Layers, LineChart, PieChart, Sparkles, Wallet } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: TopLedger Solana DeFi intelligence integration (Grow + x402 agent tools).
 */
export const TOPLEDGER_DEFI_POST: PostUpdate = {
  meta: {
    updateNumber: 23,
    id: "topledger-defi-intelligence",
    title: "TopLedger DeFi Intelligence",
    published: "July 2026",
    tagline: "Full Solana DeFi positions, net worth, and PnL wired into Grow, Portfolio, and paid agent tools",
    shareCopyVideo: `SHIP LOG · Syra �- TopLedger is live.

Tokens were only half the wallet. DeFi is the rest.

→ Grow + Wallet Portfolio show lending, perps, LP, staking, yield, rewards
→ 20+ Solana protocols indexed (Kamino, Jupiter, Raydium, Orca, Meteora, Flash Trade, more)
→ 9 paid agent tools (MPP upstream, x402 resale)
→ Public GET /topledger/wallet/* + MCP catalog for Cursor and Claude

Full DeFi net worth. Agents pay per call.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Syra �- TopLedger DeFi intelligence.

Portfolio and Grow now surface lending, perps, LP, staking, yield, and rewards across 20+ Solana protocols. Agents call it via x402. Operators see it on /wallet.

→ syraa.fun/wallet?view=portfolio
→ Agent tool: topledger-analyze-wallet`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "TopLedger �- Syra",
      subtitle: "Solana DeFi intelligence across 20+ protocols. Net worth, positions, and PnL inside Grow and Portfolio.",
      badge: "DeFi · MPP · 9 tools",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Token balances miss the DeFi layer.",
      body: "Agent wallets hold SPL tokens, but Kamino loans, Jupiter perps, Meteora LP, and staking positions were invisible. TopLedger indexes 20+ protocols so Syra shows full net worth, not just wallet dust.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "DeFi intelligence in product and API",
      body: "We integrated TopLedger via MPP pay-per-call (Solana USDC), enriched Grow recommendations and Wallet Portfolio with DeFi breakdowns, and registered nine resellable agent tools plus public /topledger routes.",
      highlights: [
        "DeFi panel on Portfolio: lending, perps, LP, staking, yield, rewards",
        "Grow portfolio folds DeFi into total net worth and rebalance signals",
        "9 agent tools: analyze, holdings, lending, perps, LP, staking, yield, rewards, DEX PnL",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "From wallet to full DeFi picture",
      steps: [
        {
          step: "01",
          title: "Open Portfolio or Grow",
          description: "Connect on Syra and open Wallets → Portfolio or the Grow pillar.",
        },
        {
          step: "02",
          title: "TopLedger analyze",
          description: "Treasury calls analyze_wallet: net worth plus per-protocol categories.",
        },
        {
          step: "03",
          title: "See DeFi breakdown",
          description: "Lending health, LP value, pending rewards, and perps collateral in one panel.",
        },
        {
          step: "04",
          title: "Agents pay per call",
          description: "External agents use topledger-* tools or GET /topledger/wallet/* via x402.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-row",
      label: "Coverage",
      kicker: "Protocols indexed",
      headline: "20+ Solana DeFi surfaces",
      cards: [
        {
          title: "Lending",
          subtitle: "Kamino · marginfi · Jupiter",
          detail: "Deposits, borrows, net exposure, and health-factor risk signals in Grow.",
          accent: "gold",
        },
        {
          title: "Perps & LP",
          subtitle: "Jupiter · Flash · Meteora",
          detail: "Perp collateral, size, PnL, and AMM LP positions with USD valuation.",
          accent: "gold",
        },
        {
          title: "Yield & staking",
          subtitle: "Vaults · native SOL",
          detail: "Kamino vaults, Hylo, Exponent, Helium, Streamflow, and validator stakes.",
        },
        {
          title: "DEX PnL",
          subtitle: "FIFO cost basis",
          detail: "Realized and unrealized trading PnL with seven-day performance breakdown.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Operators and agents",
      items: [
        {
          icon: PieChart,
          title: "Wallet Portfolio",
          description: "DeFi positions panel beside SPL holdings. Net worth includes lending and LP.",
          href: "https://www.syraa.fun/wallet?view=portfolio",
        },
        {
          icon: BarChart3,
          title: "Grow pillar",
          description: "Portfolio summary with DeFi-aware yield and lending risk recommendations.",
          href: "https://www.syraa.fun/grow",
        },
        {
          icon: Sparkles,
          title: "Agent tools",
          description: "topledger-analyze-wallet and eight category tools via POST /agent/tools/call.",
        },
        {
          icon: LineChart,
          title: "Public x402 API",
          description: "GET /topledger/wallet/analyze?wallet=. Resold with 20% margin over MPP.",
        },
        {
          icon: Layers,
          title: "MCP catalog",
          description: "Nine syra_grow_topledger_* tools synced for Cursor and Claude agents.",
        },
        {
          icon: Wallet,
          title: "Ampersend listing",
          description: "Analyze and lending endpoints registered on the Ampersend marketplace.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "Economics",
      headline: "Machine money meets DeFi depth",
      stats: [
        { value: "20+", label: "Protocols covered" },
        { value: "9", label: "Agent tools" },
        { value: "$0.0004", label: "MPP upstream / call" },
      ],
      narrative:
        "Syra resells TopLedger intelligence with x402 checkout. Operators get DeFi visibility in Grow and Portfolio. Agents pay per call. No TopLedger API key required when using MPP.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Try it",
      headline: "See your full Solana DeFi stack.",
      subline: "Open Portfolio for the DeFi panel. Call topledger-analyze-wallet from any Syra agent.",
      links: [
        { label: "Portfolio", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet?view=portfolio" },
        { label: "Grow", value: "syraa.fun/grow", href: "https://www.syraa.fun/grow" },
        { label: "TopLedger", value: "api.topledger.xyz", href: "https://api.topledger.xyz/" },
      ],
    },
  ],
};
