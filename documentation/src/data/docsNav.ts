/**
 * Shared documentation navigation structure.
 * Used by Sidebar and search index.
 */

export interface NavItem {
  title: string;
  href?: string;
  items?: NavItem[];
  badge?: string;
  defaultCollapsed?: boolean;
}

const api = (slug: string) => `/docs/api/${slug}`;

export const navigation: NavItem[] = [
  {
    title: "Welcome",
    items: [{ title: "👋 Welcome", href: "/docs/welcome" }],
  },
  {
    title: "API Documentation",
    items: [
      { title: "Overview", href: "/docs/api-reference" },
      {
        title: "Overview & Standards",
        defaultCollapsed: false,
        items: [
          { title: "x402 API Standard", href: api("x402-api-standard") },
          { title: "Check Status", href: api("check-status") },
        ],
      },
      {
        title: "News & Sentiment",
        defaultCollapsed: false,
        items: [
          { title: "News", href: api("news") },
          { title: "Sentiment", href: api("sentiment") },
          { title: "Trending Headline", href: api("trending-headline") },
          { title: "Sundown Digest", href: api("sundown-digest") },
        ],
      },
      {
        title: "Research & Discovery",
        defaultCollapsed: false,
        items: [
          { title: "Browse", href: api("browse") },
          { title: "Research", href: api("research") },
          { title: "X Search", href: api("x-search") },
          { title: "Gems", href: api("gems") },
        ],
      },
      {
        title: "Trading & Events",
        defaultCollapsed: false,
        items: [
          { title: "Signal", href: api("signal") },
          { title: "Event", href: api("event") },
        ],
      },
      {
        title: "KOL & Influencers",
        defaultCollapsed: false,
        items: [
          { title: "KOL", href: api("kol") },
          { title: "Crypto KOL", href: api("crypto-kol") },
        ],
      },
      {
        title: "Partner: Nansen",
        defaultCollapsed: false,
        items: [
          { title: "Smart Money", href: api("smart-money") },
          { title: "Token God Mode", href: api("token-god-mode") },
        ],
      },
      {
        title: "Partner: DexScreener & Jupiter",
        defaultCollapsed: false,
        items: [
          { title: "DexScreener", href: api("dexscreener") },
          { title: "Trending Jupiter", href: api("trending-jupiter") },
        ],
      },
      {
        title: "Partner: Rugcheck",
        defaultCollapsed: false,
        items: [
          { title: "Token Report", href: api("token-report") },
          { title: "Token Statistic", href: api("token-statistic") },
          { title: "Token Risk Alerts", href: api("token-risk-alerts") },
        ],
      },
      {
        title: "Partner: Bubblemaps & Binance",
        defaultCollapsed: false,
        items: [
          { title: "Bubblemaps Maps", href: api("bubblemaps-maps") },
          { title: "Binance Correlation", href: api("binance-correlation") },
        ],
      },
      {
        title: "Partner: Workfun",
        defaultCollapsed: false,
        items: [{ title: "Pump", href: api("pump") }],
      },
      {
        title: "Memecoin",
        defaultCollapsed: true,
        items: [
          { title: "Fastest Holder Growth", href: api("memecoin-fastest-holder-growth") },
          { title: "Most Mentioned Smart Money (X)", href: api("memecoin-most-mentioned-smart-money-x") },
          { title: "Accumulating Before CEX Rumors", href: api("memecoin-accumulating-before-cex-rumors") },
          { title: "Strong Narrative, Low Market Cap", href: api("memecoin-strong-narrative-low-market-cap") },
          { title: "By Experienced Devs", href: api("memecoin-by-experienced-devs") },
          { title: "Unusual Whale Behavior", href: api("memecoin-unusual-whale-behavior") },
          { title: "Trending on X (Not DEX)", href: api("memecoin-trending-on-x-not-dex") },
          { title: "Organic Traction", href: api("memecoin-organic-traction") },
          { title: "Surviving Market Dumps", href: api("memecoin-surviving-market-dumps") },
        ],
      },
    ],
  },
  {
    title: "Syra Agent",
    items: [
      { title: "Getting Started", href: "/docs/agent/getting-started" },
      { title: "How It Works", href: "/docs/agent/how-it-works" },
      { title: "Agent Features", href: "/docs/agent/features" },
      { title: "Supported Tokens", href: "/docs/agent/supported-tokens" },
      { title: "Trading Guidance", href: "/docs/agent/trading-guidance" },
      { title: "Agent Catalog", href: "/docs/agent/agent-catalog" },
      { title: "System Prompt", href: "/docs/agent/system-prompt" },
    ],
  },
  {
    title: "x402 Agent",
    items: [
      { title: "Getting Started", href: "/docs/x402-agent/getting-started" },
      { title: "Agent Catalog", href: "/docs/x402-agent/agent-catalog" },
    ],
  },
  {
    title: "Token & Utility",
    items: [
      { title: "Tokenomics", href: "/docs/token/tokenomics" },
      { title: "Roadmap", href: "/docs/token/roadmap" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Changelog", href: "/docs/changelog" },
      { title: "Community", href: "/docs/community" },
    ],
  },
];
