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

export interface FlatNavItem {
  title: string;
  href: string;
  section: string;
  group?: string;
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

export interface AdjacentPages {
  prev?: FlatNavItem;
  next?: FlatNavItem;
}

const api = (slug: string) => `/docs/api/${slug}`;

export const navigation: NavItem[] = [
  {
    title: "Start Here",
    items: [{ title: "Welcome", href: "/docs/welcome" }],
  },
  {
    title: "Use Syra",
    items: [
      { title: "Getting Started", href: "/docs/agent/getting-started" },
      { title: "How It Works", href: "/docs/agent/how-it-works" },
      { title: "Agent Features", href: "/docs/agent/features" },
      { title: "Supported Tokens", href: "/docs/agent/supported-tokens" },
      {
        title: "Data & reference",
        defaultCollapsed: true,
        items: [
          { title: "Market Data (StableCrypto)", href: "/docs/agent/market-data" },
          { title: "Social Data (StableSocial)", href: "/docs/agent/social-data" },
          { title: "Enrichment (StableEnrich)", href: "/docs/agent/enrichment-data" },
          { title: "Trading Guidance", href: "/docs/agent/trading-guidance" },
          { title: "Agent Catalog", href: "/docs/agent/agent-catalog" },
          { title: "System Prompt", href: "/docs/agent/system-prompt" },
        ],
      },
    ],
  },
  {
    title: "Build with the API",
    items: [
      { title: "Overview", href: "/docs/api-reference" },
      { title: "Syra Marketplace (Web UI)", href: api("syra-marketplace") },
      { title: "x402 Payment Flow", href: api("x402-api-standard") },
      {
        title: "All endpoints",
        defaultCollapsed: true,
        items: [
          {
            title: "Core & AI",
            defaultCollapsed: true,
            items: [
              { title: "API Health", href: api("health") },
              { title: "MPP Health", href: api("mpp-health") },
              { title: "Syra Brain", href: api("brain") },
              { title: "Preview & Dashboard (no x402)", href: api("preview-dashboard") },
              { title: "X (Twitter) API", href: api("x-api") },
              { title: "X Project Analyzer", href: api("x-analyzer") },
              { title: "Chat Completions", href: api("chat-completions") },
              { title: "Image Generations", href: api("images-generations") },
              { title: "Video Generations", href: api("videos-generations") },
              { title: "Quicknode (Solana & Base)", href: api("quicknode") },
            ],
          },
          {
            title: "Market & Trading",
            defaultCollapsed: true,
            items: [
              { title: "Signal", href: api("signal") },
              { title: "Event", href: api("event") },
              { title: "Arbitrage (CMC + CEX)", href: api("arbitrage") },
              { title: "Technical Indicators", href: api("indicator") },
              { title: "SPCX SpaceX IPO", href: api("spcx") },
              { title: "Tokenized Equity", href: api("equity") },
              { title: "CoinGecko Scout", href: api("coingecko-scout") },
              { title: "Assets Board", href: api("assets-board") },
              { title: "Asset Detail", href: api("assets-detail") },
              { title: "Bitcoin Hub", href: api("bitcoin-hub") },
              { title: "pump.fun Trending", href: api("pumpfun-trending") },
              { title: "pump.fun Movers", href: api("pumpfun-movers") },
              { title: "Memecoin Analyzer", href: api("pumpfun-analyzer") },
              { title: "pump.fun Scout", href: api("pumpfun-scout") },
            ],
          },
          {
            title: "Research & Social",
            defaultCollapsed: true,
            items: [
              { title: "News", href: api("news") },
              { title: "Sentiment", href: api("sentiment") },
              { title: "Trending Headline", href: api("trending-headline") },
              { title: "Sundown Digest", href: api("sundown-digest") },
              { title: "Web Search", href: api("web-search") },
              { title: "Website Crawl", href: api("crawl") },
              { title: "Browser Use", href: api("browser-use") },
              { title: "Analytics Summary", href: api("analytics-summary") },
            ],
          },
          {
            title: "Data providers",
            defaultCollapsed: true,
            items: [
              { title: "DexScreener Pairs", href: api("dexscreener-pairs") },
              { title: "GeckoTerminal Pools", href: api("geckoterminal-pools") },
              { title: "DefiLlama TVL", href: api("defillama-tvl") },
              { title: "RugCheck Token Report", href: api("rugcheck-report") },
              { title: "Pyth Oracle Prices", href: api("pyth-price") },
            ],
          },
          {
            title: "Partners & Registry",
            defaultCollapsed: true,
            items: [
              { title: "Smart Money (Nansen)", href: api("smart-money") },
              { title: "Token God Mode (Nansen)", href: api("token-god-mode") },
              { title: "Nansen Endpoints", href: api("nansen-endpoints") },
              { title: "Trending Jupiter", href: api("trending-jupiter") },
              { title: "Jupiter Swap Quote", href: api("jupiter-quote") },
              { title: "pump.fun Agents Swap", href: api("pumpfun-agents-swap") },
              { title: "Squid Cross-Chain Route", href: api("squid-route") },
              { title: "Squid Cross-Chain Status", href: api("squid-status") },
              { title: "RISE Endpoints", href: api("rise") },
              { title: "Purch Vault API", href: api("purch-vault") },
              { title: "Agent tools: StableCrypto & pay.sh", href: api("agent-tools-market-data") },
              { title: "Agent tools: StableSocial", href: api("agent-tools-social-data") },
              { title: "Agent tools: StableEnrich", href: api("agent-tools-enrichment-data") },
              {
                title: "Agent tools: Binance, Giza, Bankr, Neynar, SIWA",
                href: api("agent-tools-partners"),
              },
              { title: "8004 Trustless Agent Registry", href: api("8004") },
              { title: "8004 Global Stats", href: api("8004-stats") },
              { title: "8004 Leaderboard", href: api("8004-leaderboard") },
              { title: "8004 Agent Search", href: api("8004-agents-search") },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Token",
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

/** Home page — first in flattened nav order */
export const DOCS_HOME = { title: "Documentation", href: "/docs", section: "Home" } as const;

function walkNav(
  items: NavItem[],
  section: string,
  group: string | undefined,
  out: FlatNavItem[]
): void {
  for (const item of items) {
    if (item.href) {
      out.push({ title: item.title, href: item.href, section, group });
    }
    if (item.items?.length) {
      const nextGroup = item.href ? group : item.title;
      walkNav(item.items, section, nextGroup ?? item.title, out);
    }
  }
}

/** Flat ordered list of all navigable doc pages */
export function flattenNavigation(): FlatNavItem[] {
  const flat: FlatNavItem[] = [{ ...DOCS_HOME }];
  for (const section of navigation) {
    if (section.items?.length) {
      walkNav(section.items, section.title, undefined, flat);
    }
  }
  return flat;
}

/** Find a nav item by exact href */
export function findNavItemByHref(href: string): FlatNavItem | undefined {
  return flattenNavigation().find((item) => item.href === href);
}

/** Breadcrumb trail for a pathname */
export function getBreadcrumbsForPath(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ title: "Docs", href: "/docs" }];

  if (pathname === "/docs") {
    return crumbs;
  }

  const flat = flattenNavigation();
  const current = flat.find((item) => item.href === pathname);

  if (!current) {
    crumbs.push({ title: "Page" });
    return crumbs;
  }

  if (current.section !== "Home") {
    crumbs.push({ title: current.section });
  }

  if (current.group && current.group !== current.title) {
    crumbs.push({ title: current.group });
  }

  if (current.href !== "/docs") {
    crumbs.push({ title: current.title });
  }

  return crumbs;
}

/** Previous and next pages in nav order */
export function getAdjacentPages(pathname: string): AdjacentPages {
  const flat = flattenNavigation();
  const index = flat.findIndex((item) => item.href === pathname);
  if (index === -1) return {};

  return {
    prev: index > 0 ? flat[index - 1] : undefined,
    next: index < flat.length - 1 ? flat[index + 1] : undefined,
  };
}

/** Filter nav tree by search query (case-insensitive title match) */
export function filterNavigation(query: string): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return navigation;

  function filterItems(items: NavItem[]): NavItem[] {
    const result: NavItem[] = [];
    for (const item of items) {
      const titleMatch = item.title.toLowerCase().includes(q);
      const filteredChildren = item.items ? filterItems(item.items) : [];

      if (item.href && titleMatch) {
        result.push(item);
      } else if (filteredChildren.length > 0) {
        result.push({ ...item, items: filteredChildren });
      } else if (!item.href && titleMatch && item.items) {
        result.push(item);
      }
    }
    return result;
  }

  return navigation
    .map((section) => {
      const filteredItems = section.items ? filterItems(section.items) : [];
      const sectionMatch = section.title.toLowerCase().includes(q);
      if (filteredItems.length > 0 || sectionMatch) {
        return { ...section, items: filteredItems.length > 0 ? filteredItems : section.items };
      }
      return null;
    })
    .filter((s): s is NavItem => s !== null);
}
