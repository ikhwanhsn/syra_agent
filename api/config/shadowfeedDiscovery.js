/**
 * ShadowFeed discovery manifest — Step 9 provider onboarding.
 * Served at GET /.well-known/shadowfeed-feeds.json (API + synced to syraa.fun).
 *
 * @see https://docs.shadowfeed.app/providers/onboarding#step-9--publish-your-discovery-manifest
 */
import { X402_DISCOVERY_RESOURCE_PATHS } from "./x402DiscoveryResourcePaths.js";

/** Feed metadata keyed by x402 resource path (no leading slash). */
const FEED_META_BY_PATH = {
  health: {
    slug: "health",
    name: "API Health",
    category: "health",
    method: "GET",
    suggested_price_stx: 0.003,
    description: "Paid liveness probe — verify Syra API is operational.",
  },
  news: {
    slug: "news",
    name: "Crypto News",
    category: "news",
    method: "GET",
    suggested_price_stx: 0.005,
    description: "Curated crypto news headlines and summaries.",
  },
  signal: {
    slug: "signal",
    name: "Trading Signal",
    category: "signals",
    method: "GET",
    suggested_price_stx: 0.005,
    description: "Real-time trading signals for Solana and crypto markets.",
  },
  sentiment: {
    slug: "sentiment",
    name: "Market Sentiment",
    category: "analytics",
    method: "GET",
    suggested_price_stx: 0.005,
    description: "30-day sentiment analysis for crypto tickers.",
  },
  event: {
    slug: "event",
    name: "Crypto Events",
    category: "news",
    method: "GET",
    suggested_price_stx: 0.005,
    description: "Upcoming and recent crypto events calendar.",
  },
  "trending-headline": {
    slug: "trending-headline",
    name: "Trending Headlines",
    category: "news",
    method: "GET",
    suggested_price_stx: 0.005,
    description: "Trending crypto headlines right now.",
  },
  "sundown-digest": {
    slug: "sundown-digest",
    name: "Sundown Digest",
    category: "news",
    method: "GET",
    suggested_price_stx: 0.005,
    description: "End-of-day crypto market digest.",
  },
  brain: {
    slug: "brain",
    name: "Syra Brain",
    category: "ai",
    method: "POST",
    suggested_price_stx: 0.01,
    description: "AI agent with tool selection — ask crypto questions, get grounded answers.",
  },
  arbitrage: {
    slug: "arbitrage",
    name: "Arbitrage Experiment",
    category: "analytics",
    method: "GET",
    suggested_price_stx: 0.01,
    description: "Cross-venue arbitrage route rankings and snapshots.",
  },
  "analytics/summary": {
    slug: "analytics-summary",
    name: "Analytics Summary",
    category: "analytics",
    method: "GET",
    suggested_price_stx: 0.01,
    description: "Bundled analytics: trending tokens, smart money, correlation.",
  },
  x: {
    slug: "x",
    name: "X (Twitter) API",
    category: "social",
    method: "GET",
    suggested_price_stx: 0.005,
    description: "X profile lookup, search, and recent tweets proxy.",
  },
  "x-analyzer": {
    slug: "x-analyzer",
    name: "X Project Analyzer",
    category: "social",
    method: "GET",
    suggested_price_stx: 0.008,
    description: "Deterministic 0–100 project score from X profile and tweets.",
  },
  "mpp/v1/health": {
    slug: "mpp-health",
    name: "MPP Health Check",
    category: "health",
    method: "GET",
    suggested_price_stx: 0.003,
    description: "Machine Payments Protocol test lane (x402 v2 compatible).",
  },
};

function envOr(key, fallback) {
  const v = process.env[key]?.trim();
  return v || fallback;
}

function providerConfig() {
  const handle = envOr("SHADOWFEED_PROVIDER_HANDLE", "syra");
  const website = envOr("SHADOWFEED_WEBSITE_URL", "https://syraa.fun").replace(/\/$/, "");
  const api = envOr("SHADOWFEED_API_URL", "https://api.syraa.fun").replace(/\/$/, "");

  return {
    handle,
    website,
    api,
    name: envOr("SHADOWFEED_PROVIDER_DISPLAY_NAME", "Syra"),
    description: envOr(
      "SHADOWFEED_PROVIDER_DESCRIPTION",
      "AI-native crypto intelligence — news, signals, sentiment, and agent tools for traders on Solana."
    ),
    twitter_handle: envOr("SHADOWFEED_TWITTER_HANDLE", "@syraa_ai"),
    contact_email: envOr("SHADOWFEED_CONTACT_EMAIL", "hello@syraa.fun"),
  };
}

function buildFeeds() {
  return X402_DISCOVERY_RESOURCE_PATHS.map((segment) => {
    const meta = FEED_META_BY_PATH[segment];
    const path = `/${segment}`;
    if (!meta) {
      return {
        slug: segment.replace(/\//g, "-"),
        name: segment,
        category: "data",
        path,
        method: "GET",
        suggested_price_stx: 0.005,
      };
    }
    const feed = {
      slug: meta.slug,
      name: meta.name,
      category: meta.category,
      path,
      method: meta.method,
      suggested_price_stx: meta.suggested_price_stx,
    };
    if (meta.description) feed.description = meta.description;
    return feed;
  });
}

/**
 * Build the ShadowFeed discovery manifest object.
 * @returns {Record<string, unknown>}
 */
export function buildShadowfeedFeedsManifest() {
  const provider = providerConfig();
  const { handle, website, api } = provider;

  return {
    version: "1",
    provider: {
      name: provider.name,
      handle,
      description: provider.description,
      website,
      api,
      twitter_handle: provider.twitter_handle,
      contact_email: provider.contact_email,
    },
    partnerships: [
      {
        marketplace: "shadowfeed",
        marketplace_url: "https://shadowfeed.app",
        marketplace_handle: handle,
        marketplace_verification_url: `https://api.shadowfeed.app/providers/${handle}/manifest`,
        integration_mode: "partner_bridge",
        partner_endpoint: api,
      },
      {
        marketplace: "x402",
        marketplace_url: "https://x402.org",
        marketplace_handle: handle,
        integration_mode: "direct",
        partner_endpoint: api,
        notes: "Direct USDC micropayments on Solana and Base via HTTP 402.",
      },
    ],
    feeds: buildFeeds(),
    supported_payments: [
      {
        scheme: "partner_bridge",
        marketplace: "shadowfeed",
        asset: "STX",
        settlement_network: "stacks:mainnet",
      },
      {
        scheme: "exact",
        marketplace: "syra",
        asset: "USDC",
        settlement_network: "solana:mainnet",
      },
      {
        scheme: "exact",
        marketplace: "syra",
        asset: "USDC",
        settlement_network: "eip155:8453",
      },
    ],
  };
}
