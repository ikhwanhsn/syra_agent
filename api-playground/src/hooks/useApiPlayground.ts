import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletContext } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { 
  HttpMethod, 
  ApiRequest, 
  ApiResponse, 
  HistoryItem, 
  RequestHeader, 
  RequestParam,
  RequestStatus,
  WalletState,
  PaymentDetails,
  TransactionStatus
} from '@/types/api';
import {
  parseX402Response,
  getBestPaymentOption,
  getPaymentOptionsByChain,
  extractPaymentDetails,
  extractPaymentDetailsFromOption,
  executePayment,
  executeBasePayment,
  isBaseNetwork,
  X402Response,
  X402PaymentOption,
} from '@/lib/x402Client';

// Resolve API base URL at runtime: when app is opened from localhost use localhost:3000, else api.syraa.fun (override via VITE_API_BASE_URL)
function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  return 'https://api.syraa.fun';
}

/** Headers for Syra API (playground-proxy and other non-x402). Set VITE_API_KEY in .env to match the API's API_KEY. */
function getApiHeaders(): Record<string, string> {
  const key = import.meta.env.VITE_API_KEY as string | undefined;
  if (!key || typeof key !== 'string') return {};
  return { 'X-API-Key': key };
}

/** Nansen API base (call directly; x402 payment with wallet). Override via VITE_NANSEN_API_BASE_URL. */
function getNansenBaseUrl(): string {
  const base = import.meta.env.VITE_NANSEN_API_BASE_URL as string | undefined;
  return (base && base.trim()) || 'https://api.nansen.ai';
}

function isNansenUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.origin === new URL(getNansenBaseUrl()).origin;
  } catch {
    return false;
  }
}
/** Example flow preset for quick try (load + send). */
export interface ExampleFlowPreset {
  id: string;
  label: string;
  method: HttpMethod;
  url: string;
  params: RequestParam[];
}

/** All v2 endpoint example flows (resolved at runtime so dev uses localhost:3000). First N are shown on Request Builder; rest on /examples. */
export function getExampleFlows(): ExampleFlowPreset[] {
  const base = getApiBaseUrl();
  return [
  // Featured (shown on main builder)
  {
    id: 'correlation-matrix',
    label: 'Correlation matrix',
    method: 'GET',
    url: `${base}/v2/binance/correlation-matrix`,
    params: [],
  },
  {
    id: 'token-risk',
    label: 'Token risk',
    method: 'GET',
    url: `${base}/v2/token-statistic`,
    params: [],
  },
  {
    id: 'token-risk-alerts',
    label: 'Token risk alerts',
    method: 'GET',
    url: `${base}/v2/token-risk/alerts`,
    params: [
      { key: 'rugScoreMin', value: '80', enabled: true, description: 'Min normalised risk score (0-100)' },
      { key: 'source', value: 'new_tokens,recent,trending,verified', enabled: false, description: 'new_tokens, recent, trending, verified' },
      { key: 'limit', value: '20', enabled: false, description: 'Max tokens to check (1-50)' },
    ],
  },
  {
    id: 'news',
    label: 'Get news',
    method: 'GET',
    url: `${base}/v2/news`,
    params: [{ key: 'ticker', value: 'general', enabled: true }],
  },
  {
    id: 'check-status',
    label: 'Check status',
    method: 'GET',
    url: `${base}/v2/check-status`,
    params: [],
  },
  {
    id: 'analytics-summary',
    label: 'Analytics summary',
    method: 'GET',
    url: `${base}/v2/analytics/summary`,
    params: [],
  },
  // Core
  {
    id: 'signal',
    label: 'Signal',
    method: 'GET',
    url: `${base}/v2/signal`,
    params: [],
  },
  {
    id: 'sentiment',
    label: 'Sentiment',
    method: 'GET',
    url: `${base}/v2/sentiment`,
    params: [{ key: 'ticker', value: 'general', enabled: true }],
  },
  {
    id: 'event',
    label: 'Event',
    method: 'GET',
    url: `${base}/v2/event`,
    params: [],
  },
  {
    id: 'browse',
    label: 'Browse',
    method: 'GET',
    url: `${base}/v2/browse`,
    params: [],
  },
  {
    id: 'x-search',
    label: 'X search',
    method: 'GET',
    url: `${base}/v2/x-search`,
    params: [],
  },
  {
    id: 'research',
    label: 'Research',
    method: 'GET',
    url: `${base}/v2/research`,
    params: [],
  },
  {
    id: 'exa-search',
    label: 'EXA search',
    method: 'GET',
    url: `${base}/v2/exa-search`,
    params: [],
  },
  {
    id: 'gems',
    label: 'Gems',
    method: 'GET',
    url: `${base}/v2/gems`,
    params: [],
  },
  {
    id: 'x-kol',
    label: 'X KOL',
    method: 'GET',
    url: `${base}/v2/x-kol`,
    params: [],
  },
  {
    id: 'crypto-kol',
    label: 'Crypto KOL',
    method: 'GET',
    url: `${base}/v2/crypto-kol`,
    params: [],
  },
  {
    id: 'trending-headline',
    label: 'Trending headline',
    method: 'GET',
    url: `${base}/v2/trending-headline`,
    params: [],
  },
  {
    id: 'sundown-digest',
    label: 'Sundown digest',
    method: 'GET',
    url: `${base}/v2/sundown-digest`,
    params: [],
  },
  // Partner
  {
    id: 'smart-money',
    label: 'Smart money',
    method: 'GET',
    url: `${base}/v2/smart-money`,
    params: [],
  },
  {
    id: 'token-god-mode',
    label: 'Token god mode',
    method: 'GET',
    url: `${base}/v2/token-god-mode`,
    params: [],
  },
  {
    id: 'dexscreener',
    label: 'DexScreener',
    method: 'GET',
    url: `${base}/v2/dexscreener`,
    params: [],
  },
  {
    id: 'trending-jupiter',
    label: 'Trending Jupiter',
    method: 'GET',
    url: `${base}/v2/trending-jupiter`,
    params: [],
  },
  {
    id: 'token-report',
    label: 'Token report',
    method: 'GET',
    url: `${base}/v2/token-report`,
    params: [],
  },
  {
    id: 'bubblemaps-maps',
    label: 'Bubblemaps maps',
    method: 'GET',
    url: `${base}/v2/bubblemaps/maps`,
    params: [],
  },
  {
    id: 'binance-correlation',
    label: 'Binance correlation',
    method: 'GET',
    url: `${base}/v2/binance/correlation`,
    params: [],
  },
  {
    id: 'pump',
    label: 'Pump',
    method: 'GET',
    url: `${base}/v2/pump`,
    params: [],
  },
  // Nansen (call api.nansen.ai directly; x402 payment with wallet)
  ...(function nansenFlows(): ExampleFlowPreset[] {
    const nansenBase = getNansenBaseUrl();
    return [
      {
        id: 'nansen-address-current-balance',
        label: 'Nansen: address current balance',
        method: 'POST',
        url: `${nansenBase}/api/v1/profiler/address/current-balance`,
        params: [
          { key: 'chain', value: 'solana', enabled: true, description: 'Chain (e.g. solana, ethereum)' },
          { key: 'address', value: '', enabled: true, description: 'Wallet address' },
        ],
      },
      {
        id: 'nansen-smart-money-netflow',
        label: 'Nansen: smart money netflow',
        method: 'POST',
        url: `${nansenBase}/api/v1/smart-money/netflow`,
        params: [
          { key: 'chains', value: '["solana"]', enabled: true, description: 'JSON array e.g. ["solana"]' },
          { key: 'pagination', value: '{"page":1,"per_page":25}', enabled: false, description: 'JSON object' },
        ],
      },
      {
        id: 'nansen-smart-money-holdings',
        label: 'Nansen: smart money holdings',
        method: 'POST',
        url: `${nansenBase}/api/v1/smart-money/holdings`,
        params: [
          { key: 'chains', value: '["solana"]', enabled: true, description: 'JSON array e.g. ["solana"]' },
          { key: 'pagination', value: '{"page":1,"per_page":25}', enabled: false, description: 'JSON object' },
        ],
      },
      {
        id: 'nansen-tgm-holders',
        label: 'Nansen: TGM holders',
        method: 'POST',
        url: `${nansenBase}/api/v1/tgm/holders`,
        params: [
          { key: 'chain', value: 'solana', enabled: true, description: 'Chain (e.g. solana)' },
          { key: 'token_address', value: '', enabled: true, description: 'Token contract address' },
          { key: 'pagination', value: '{"page":1,"per_page":10}', enabled: false, description: 'JSON object' },
        ],
      },
      {
        id: 'nansen-tgm-flow-intelligence',
        label: 'Nansen: TGM flow intelligence',
        method: 'POST',
        url: `${nansenBase}/api/v1/tgm/flow-intelligence`,
        params: [
          { key: 'chain', value: 'solana', enabled: true, description: 'Chain (e.g. solana)' },
          { key: 'token_address', value: '', enabled: true, description: 'Token contract address' },
          { key: 'timeframe', value: '1d', enabled: false, description: 'e.g. 1d' },
        ],
      },
      {
        id: 'nansen-token-screener',
        label: 'Nansen: token screener',
        method: 'POST',
        url: `${nansenBase}/api/v1/token-screener`,
        params: [
          { key: 'chain', value: 'solana', enabled: true, description: 'Chain (e.g. solana)' },
          { key: 'pagination', value: '{"page":1,"per_page":25}', enabled: false, description: 'JSON object' },
        ],
      },
      {
        id: 'nansen-tgm-dex-trades',
        label: 'Nansen: TGM DEX trades',
        method: 'POST',
        url: `${nansenBase}/api/v1/tgm/dex-trades`,
        params: [
          { key: 'chain', value: 'solana', enabled: true, description: 'Chain (e.g. solana)' },
          { key: 'token_address', value: '', enabled: true, description: 'Token contract address' },
          { key: 'date', value: '{"from":"2025-01-01","to":"2025-12-31"}', enabled: false, description: 'JSON date range' },
        ],
      },
      {
        id: 'nansen-perp-screener',
        label: 'Nansen: perp screener',
        method: 'POST',
        url: `${nansenBase}/api/v1/perp-screener`,
        params: [
          { key: 'date', value: '{"from":"2025-01-01","to":"2025-12-31"}', enabled: false, description: 'JSON date range' },
          { key: 'pagination', value: '{"page":1,"per_page":10}', enabled: false, description: 'JSON object' },
        ],
      },
    ];
  })(),
  {
    id: 'coingecko-simple-price',
    label: 'CoinGecko simple price',
    method: 'GET',
    url: `${base}/v2/coingecko/simple-price`,
    params: [
      { key: 'symbols', value: 'btc,eth,sol', enabled: true, description: 'Comma-separated symbols' },
      { key: 'include_market_cap', value: 'true', enabled: false, description: 'true/false' },
      { key: 'include_24hr_vol', value: 'true', enabled: false, description: 'true/false' },
      { key: 'include_24hr_change', value: 'true', enabled: false, description: 'true/false' },
    ],
  },
  {
    id: 'coingecko-onchain-token-price',
    label: 'CoinGecko onchain token price',
    method: 'GET',
    url: `${base}/v2/coingecko/onchain/token-price`,
    params: [
      { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana, eth' },
      { key: 'address', value: '', enabled: true, description: 'Token contract address (comma for multiple)' },
    ],
  },
  {
    id: 'coingecko-search-pools',
    label: 'CoinGecko search pools',
    method: 'GET',
    url: `${base}/v2/coingecko/onchain/search-pools`,
    params: [
      { key: 'query', value: 'pump', enabled: true, description: 'Search query (name, symbol, or address)' },
      { key: 'network', value: 'solana', enabled: true, description: 'e.g. solana, base' },
    ],
  },
  {
    id: 'coingecko-trending-pools',
    label: 'CoinGecko trending pools',
    method: 'GET',
    url: `${base}/v2/coingecko/onchain/trending-pools`,
    params: [
      { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana' },
      { key: 'duration', value: '5m', enabled: false, description: 'e.g. 5m' },
    ],
  },
  {
    id: 'coingecko-onchain-token',
    label: 'CoinGecko onchain token',
    method: 'GET',
    url: `${base}/v2/coingecko/onchain/token`,
    params: [
      { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana, eth' },
      { key: 'address', value: '', enabled: true, description: 'Token contract address' },
    ],
  },
  // Memecoin
  {
    id: 'memecoin-fastest-holder-growth',
    label: 'Memecoin fastest holder growth',
    method: 'GET',
    url: `${base}/v2/memecoin/fastest-holder-growth`,
    params: [],
  },
  {
    id: 'memecoin-most-mentioned-by-smart-money-x',
    label: 'Memecoin most mentioned (smart money X)',
    method: 'GET',
    url: `${base}/v2/memecoin/most-mentioned-by-smart-money-x`,
    params: [],
  },
  {
    id: 'memecoin-accumulating-before-cex-rumors',
    label: 'Memecoin accumulating before CEX rumors',
    method: 'GET',
    url: `${base}/v2/memecoin/accumulating-before-CEX-rumors`,
    params: [],
  },
  {
    id: 'memecoin-strong-narrative-low-market-cap',
    label: 'Memecoin strong narrative low cap',
    method: 'GET',
    url: `${base}/v2/memecoin/strong-narrative-low-market-cap`,
    params: [],
  },
  {
    id: 'memecoin-by-experienced-devs',
    label: 'Memecoin by experienced devs',
    method: 'GET',
    url: `${base}/v2/memecoin/by-experienced-devs`,
    params: [],
  },
  {
    id: 'memecoin-unusual-whale-behavior',
    label: 'Memecoin unusual whale behavior',
    method: 'GET',
    url: `${base}/v2/memecoin/unusual-whale-behavior`,
    params: [],
  },
  {
    id: 'memecoin-trending-on-x-not-dex',
    label: 'Memecoin trending on X not DEX',
    method: 'GET',
    url: `${base}/v2/memecoin/trending-on-x-not-dex`,
    params: [],
  },
  {
    id: 'memecoin-organic-traction',
    label: 'Memecoin organic traction',
    method: 'GET',
    url: `${base}/v2/memecoin/organic-traction`,
    params: [],
  },
  {
    id: 'memecoin-surviving-market-dumps',
    label: 'Memecoin surviving market dumps',
    method: 'GET',
    url: `${base}/v2/memecoin/surviving-market-dumps`,
    params: [],
  },
];
};

/** Number of example flows to show on the Request Builder; rest are on /examples. */
export const EXAMPLE_FLOWS_VISIBLE_COUNT = 4;

// Proxy URL for avoiding CORS issues in development
const PROXY_BASE_URL = '/api/proxy/';

// Check if we should use proxy (in development or when explicitly enabled)
const USE_PROXY = import.meta.env.DEV || import.meta.env.VITE_USE_PROXY === 'true';

// Helper function to get the proxied URL (Vite dev server proxy)
const getProxiedUrl = (url: string): string => {
  if (!USE_PROXY) return url;
  // Don't proxy relative URLs or already proxied URLs
  if (url.startsWith('/') || url.startsWith(PROXY_BASE_URL)) return url;
  return `${PROXY_BASE_URL}${encodeURIComponent(url)}`;
};

// In production, cross-origin requests hit CORS. Use the API's playground-proxy when we're not in dev and the target is another origin.
// Nansen is called directly (no proxy) so the user pays x402 with their wallet.
function useBackendPlaygroundProxy(targetUrl: string): boolean {
  if (USE_PROXY) return false; // Dev proxy handles it
  if (typeof window === 'undefined') return false;
  if (isNansenUrl(targetUrl)) return false; // Call Nansen directly
  const targetOrigin = getRequestOrigin(targetUrl);
  const pageOrigin = window.location.origin;
  return !!targetOrigin && targetOrigin !== pageOrigin;
}

// When using backend proxy, call the proxy on the **target** API's origin so the request reaches the right service (fixes "other service" when e.g. calling api.syraa.fun from localhost).
function getPlaygroundProxyUrl(targetUrl: string): string {
  const origin = getRequestOrigin(targetUrl);
  if (origin) return `${origin}/api/playground-proxy`;
  return `${getApiBaseUrl()}/api/playground-proxy`;
}

// V2 API endpoints list (resolved at runtime for dev localhost). Nansen: direct api.nansen.ai.
function getV2ApiEndpoints(): string[] {
  const base = getApiBaseUrl();
  const nansenBase = getNansenBaseUrl();
  return [
    `${base}/v2/news`,
    `${base}/v2/signal`,
    `${base}/v2/sentiment`,
    `${base}/v2/event`,
    `${base}/v2/trending-headline`,
    `${base}/v2/sundown-digest`,
    `${base}/v2/check-status`,
    `${base}/v2/browse`,
    `${base}/v2/research`,
    `${base}/v2/exa-search`,
    `${base}/v2/gems`,
    `${base}/v2/smart-money`,
    `${base}/v2/dexscreener`,
    `${base}/v2/token-god-mode`,
    `${nansenBase}/api/v1/profiler/address/current-balance`,
    `${nansenBase}/api/v1/smart-money/netflow`,
    `${nansenBase}/api/v1/smart-money/holdings`,
    `${nansenBase}/api/v1/tgm/holders`,
    `${base}/v2/trending-jupiter`,
    `${base}/v2/token-report`,
    `${base}/v2/token-statistic`,
    `${base}/v2/token-risk/alerts`,
    `${base}/v2/bubblemaps/maps`,
    `${base}/v2/binance/correlation`,
    `${base}/v2/coingecko/simple-price`,
    `${base}/v2/coingecko/onchain/token-price`,
    `${base}/v2/coingecko/onchain/search-pools`,
    `${base}/v2/coingecko/onchain/trending-pools`,
    `${base}/v2/coingecko/onchain/token`,
  ];
}

// x402 only supports GET and POST methods
const SUPPORTED_METHODS: HttpMethod[] = ['GET', 'POST'];

/** Default method when detection hasn't run yet (e.g. example flow). Detection uses 402/405 from actual requests. */
export function getDefaultMethodForUrl(_url: string): HttpMethod {
  return 'GET';
}

/** Known Syra v2 GET query param names and API descriptions by path (for placeholder text) */
function getKnownQueryParamsForPath(baseUrl: string): RequestParam[] | null {
  try {
    const path = new URL(baseUrl).pathname.toLowerCase();
    const known: Record<string, RequestParam[]> = {
      '/v2/news': [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
      '/v2/event': [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
      '/v2/sentiment': [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
      '/v2/trending-headline': [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
      '/v2/sundown-digest': [],
      '/v2/check-status': [],
      '/v2/gems': [],
      '/v2/token-statistic': [],
      '/v2/token-risk/alerts': [
        { key: 'rugScoreMin', value: '80', enabled: true, description: 'Min normalised risk score (0-100)' },
        { key: 'source', value: 'new_tokens,recent,trending,verified', enabled: false, description: 'Comma-separated sources' },
        { key: 'limit', value: '20', enabled: false, description: 'Max tokens to check (1-50)' },
      ],
      '/v2/analytics/summary': [],
      '/v2/signal': [{ key: 'token', value: '', enabled: false, description: 'e.g. solana, bitcoin' }],
      '/v2/research': [{ key: 'query', value: '', enabled: true, description: 'e.g. token analysis, market trends' }],
      '/v2/browse': [{ key: 'query', value: '', enabled: true, description: 'Search query or URL' }],
      '/v2/x/search': [{ key: 'query', value: '', enabled: true, description: 'e.g. token name, topic' }],
      '/v2/x-search': [{ key: 'query', value: '', enabled: true, description: 'e.g. token name, topic' }],
      '/v2/exa-search': [{ key: 'query', value: '', enabled: true, description: 'e.g. latest news on Nvidia, crypto market' }],
      '/v2/token-report': [{ key: 'address', value: '', enabled: true, description: 'Token contract address' }],
      '/v2/token-god-mode': [{ key: 'tokenAddress', value: '', enabled: true, description: 'Token address for research' }],
      '/api/v1/profiler/address/current-balance': [
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain (e.g. solana, ethereum)' },
        { key: 'address', value: '', enabled: true, description: 'Wallet address' },
      ],
      '/api/v1/profiler/address/historical-balances': [
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
        { key: 'address', value: '', enabled: true, description: 'Wallet address' },
      ],
      '/api/v1/smart-money/netflow': [
        { key: 'chains', value: '["solana"]', enabled: true, description: 'JSON array of chains' },
        { key: 'pagination', value: '{"page":1,"per_page":25}', enabled: false, description: 'JSON pagination' },
      ],
      '/api/v1/smart-money/holdings': [
        { key: 'chains', value: '["solana"]', enabled: true, description: 'JSON array of chains' },
        { key: 'pagination', value: '{"page":1,"per_page":25}', enabled: false, description: 'JSON pagination' },
      ],
      '/api/v1/tgm/holders': [
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
        { key: 'token_address', value: '', enabled: true, description: 'Token contract address' },
        { key: 'pagination', value: '{"page":1,"per_page":10}', enabled: false, description: 'JSON pagination' },
      ],
      '/api/v1/tgm/flow-intelligence': [
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
        { key: 'token_address', value: '', enabled: true, description: 'Token contract address' },
      ],
      '/api/v1/tgm/dex-trades': [
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
        { key: 'token_address', value: '', enabled: true, description: 'Token contract address' },
      ],
      '/api/v1/token-screener': [
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
      ],
      '/api/v1/perp-screener': [],
      '/v2/kol': [{ key: 'address', value: '', enabled: true, description: 'Solana token contract address' }],
      '/v2/bubblemaps/maps': [{ key: 'address', value: '', enabled: true, description: 'Solana token contract address' }],
      '/v2/binance/correlation': [{ key: 'symbol', value: 'BTCUSDT', enabled: false, description: 'e.g. BTCUSDT, ETHUSDT' }],
      '/v2/binance/correlation-matrix': [],
      '/v2/coingecko/simple-price': [
        { key: 'symbols', value: 'btc,eth,sol', enabled: true, description: 'Comma-separated symbols (or use ids)' },
        { key: 'ids', value: '', enabled: false, description: 'Comma-separated CoinGecko ids (e.g. bitcoin,ethereum)' },
        { key: 'vs_currencies', value: 'usd', enabled: false, description: 'e.g. usd' },
        { key: 'include_market_cap', value: 'true', enabled: false, description: 'true/false' },
        { key: 'include_24hr_vol', value: 'true', enabled: false, description: 'true/false' },
        { key: 'include_24hr_change', value: 'true', enabled: false, description: 'true/false' },
      ],
      '/v2/coingecko/onchain/token-price': [
        { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana, eth' },
        { key: 'address', value: '', enabled: true, description: 'Token contract address (comma for multiple)' },
        { key: 'include_market_cap', value: 'true', enabled: false, description: 'true/false' },
      ],
      '/v2/coingecko/onchain/search-pools': [
        { key: 'query', value: '', enabled: true, description: 'Search query (name, symbol, or contract address)' },
        { key: 'network', value: 'solana', enabled: true, description: 'e.g. solana, base' },
        { key: 'page', value: '1', enabled: false, description: 'Page number' },
        { key: 'include', value: 'base_token,quote_token,dex', enabled: false, description: 'Comma-separated' },
      ],
      '/v2/coingecko/onchain/trending-pools': [
        { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana' },
        { key: 'duration', value: '5m', enabled: false, description: 'e.g. 5m' },
        { key: 'page', value: '1', enabled: false, description: 'Page number' },
      ],
      '/v2/coingecko/onchain/token': [
        { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana, eth' },
        { key: 'address', value: '', enabled: true, description: 'Token contract address' },
        { key: 'include', value: 'top_pools', enabled: false, description: 'e.g. top_pools' },
        { key: 'include_composition', value: 'true', enabled: false, description: 'true/false' },
      ],
    };
    const exact = known[path];
    if (exact) return exact.map((p) => ({ ...p }));
    return null;
  } catch {
    return null;
  }
}

/** Params for an example flow: from preset if set, otherwise from known API params by path. Use to decide if query-params modal should show and what fields to display. */
export function getParamsForExampleFlow(flow: ExampleFlowPreset): RequestParam[] {
  if (flow.params.length > 0) return flow.params.map((p) => ({ ...p }));
  const known = getKnownQueryParamsForPath(flow.url);
  if (known && known.length > 0) return known.map((p) => ({ ...p }));
  return [];
}

// Allow any valid http(s) URL so the playground works with Syra and all other x402 APIs
function isValidApiUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const urlObj = new URL(trimmed);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// localStorage keys for payment header (scoped by origin so we don't send one API's payment to another)
const PAYMENT_HEADER_KEY = 'x402_payment_header';
const PAYMENT_ORIGIN_KEY = 'x402_payment_origin';

function getRequestOrigin(urlStr: string): string | null {
  try {
    const u = urlStr.trim();
    if (!u) return null;
    return new URL(u).origin;
  } catch {
    return null;
  }
}

// localStorage key for history
const HISTORY_STORAGE_KEY = 'x402_api_playground_history';

// Helper functions for localStorage serialization/deserialization
function loadHistoryFromStorage(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
      request: {
        ...item.request,
        timestamp: new Date(item.request.timestamp),
      },
    }));
  } catch {
    return [];
  }
}

function saveHistoryToStorage(history: HistoryItem[]): void {
  try {
    // Limit history to last 100 items to prevent localStorage bloat
    const limitedHistory = history.slice(0, 100);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch {
    // Ignore localStorage errors
  }
}

// Auto-detect query parameters from URL
function parseUrlParams(url: string): RequestParam[] {
  try {
    const urlObj = new URL(url);
    const params: RequestParam[] = [];
    
    urlObj.searchParams.forEach((value, key) => {
      params.push({
        key,
        value,
        enabled: true,
      });
    });
    
    return params;
  } catch {
    // If URL parsing fails, try manual parsing
    try {
      const queryString = url.split('?')[1];
      if (!queryString) return [];
      
      const params: RequestParam[] = [];
      const pairs = queryString.split('&');
      
      pairs.forEach(pair => {
        const [key, value = ''] = pair.split('=').map(decodeURIComponent);
        if (key) {
          params.push({
            key,
            value,
            enabled: true,
          });
        }
      });
      
      return params;
    } catch {
      return [];
    }
  }
}

// Auto-detect common headers based on URL patterns
function detectHeadersFromUrl(url: string): RequestHeader[] {
  const headers: RequestHeader[] = [];
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Detect API key patterns in URL
    const apiKeyPatterns = [
      /[?&](api[_-]?key|apikey|key|token|access[_-]?token|auth[_-]?token)=([^&]+)/i,
      /[?&](bearer|token|auth)=([^&]+)/i,
    ];
    
    for (const pattern of apiKeyPatterns) {
      const match = url.match(pattern);
      if (match) {
        const [, keyName, value] = match;
        // Don't add if it's already in query params (we'll handle it there)
        // But we can add Authorization header if it looks like a token
        if (value && value.length > 20 && !keyName.toLowerCase().includes('key')) {
          headers.push({
            key: 'Authorization',
            value: value.startsWith('Bearer ') ? value : `Bearer ${value}`,
            enabled: true,
          });
        }
      }
    }
    
    // Detect common API endpoints and suggest headers
    if (hostname.includes('api.') || hostname.includes('api-')) {
      // Common API headers
      if (!headers.find(h => h.key.toLowerCase() === 'accept')) {
        headers.push({
          key: 'Accept',
          value: 'application/json',
          enabled: true,
        });
      }
    }
    
    // Detect GitHub API
    if (hostname.includes('api.github.com')) {
      headers.push({
        key: 'Accept',
        value: 'application/vnd.github.v3+json',
        enabled: true,
      });
    }
    
    // Detect Stripe API
    if (hostname.includes('api.stripe.com')) {
      headers.push({
        key: 'Accept',
        value: 'application/json',
        enabled: true,
      });
    }
    
  } catch {
    // URL parsing failed, skip header detection
  }
  
  return headers;
}

// Extract base URL without query parameters
function getBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch {
    // Fallback: remove query string manually
    return url.split('?')[0];
  }
}

export function useApiPlayground() {
  const { connection } = useConnection();
  const walletContext = useWalletContext();
  
  // Request state
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<RequestHeader[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [body, setBody] = useState('{\n  \n}');
  const [params, setParams] = useState<RequestParam[]>([]);

  // Response state
  const [response, setResponse] = useState<ApiResponse | undefined>();
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | undefined>();
  const [x402Response, setX402Response] = useState<X402Response | undefined>();
  const [paymentOption, setPaymentOption] = useState<X402PaymentOption | undefined>();
  const [paymentOptionsByChain, setPaymentOptionsByChain] = useState<{ solana: X402PaymentOption | null; base: X402PaymentOption | null }>({ solana: null, base: null });
  const [selectedPaymentChain, setSelectedPaymentChain] = useState<'solana' | 'base'>('solana');

  // Sync selected payment chain with connected wallet: prefer Base when Base is connected, else Solana when Solana is connected (so connecting Base always shows Base even if Solana auto-connected)
  useEffect(() => {
    if (walletContext.baseConnected) {
      setSelectedPaymentChain('base');
    } else if (walletContext.connected) {
      setSelectedPaymentChain('solana');
    }
  }, [walletContext.baseConnected, walletContext.connected]);

  // History state - load from localStorage on mount
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistoryFromStorage());
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();

  // Save history to localStorage whenever it changes
  useEffect(() => {
    saveHistoryToStorage(history);
  }, [history]);

  // Track last processed URL to avoid reprocessing
  const lastProcessedUrlRef = useRef<string>('');
  const autoDetectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  // Allowed methods from OPTIONS (for unknown URLs); cleared when base URL changes
  const [allowedMethodsFromDetection, setAllowedMethodsFromDetection] = useState<HttpMethod[]>([]);
  
  // Track cloned request ID to update it when user makes changes
  const clonedRequestIdRef = useRef<string | null>(null);
  
  // Track new request ID to update it when user makes changes
  const newRequestIdRef = useRef<string | null>(null);
  
  // Track the actual request ID being used (for updating existing items)
  const actualRequestIdRef = useRef<string>('');
  // When true, skip the next auto-detect fetch (e.g. after clicking an example flow to avoid double request)
  const skipNextAutoDetectRef = useRef<boolean>(false);
  // When true, URL was just set by an example flow – don't clear params in the URL effect (avoids double entry / wrong request)
  const exampleFlowJustRanRef = useRef<boolean>(false);

  // Response-only schema keys: do not show as query/input params (API expects input/query params only)
  const OUTPUT_SCHEMA_KEY_BLOCKLIST = new Set([
    'output', 'result', 'response', 'data', 'toolCalls', 'citations', 'news', 'message', 'error',
  ]);

  // Extract params from 402 response extensions (input/query only). Use known API param names (ticker, query, token, etc.) when 402 only gives generic "input".
  const extractParamsFrom402Response = useCallback((x402Resp: X402Response, baseUrl?: string): RequestParam[] => {
    const params: RequestParam[] = [];

    try {
      const schema = x402Resp.extensions?.bazaar?.schema;
      const exampleInput = x402Resp.extensions?.bazaar?.info?.input;

      if (schema?.properties) {
        Object.entries(schema.properties).forEach(([key, prop]) => {
          if (OUTPUT_SCHEMA_KEY_BLOCKLIST.has(key)) return;
          const exampleValue = exampleInput?.[key];
          const defaultValue =
            exampleValue !== undefined ? String(exampleValue) : '';
          const desc = prop && typeof prop === 'object' && 'description' in prop ? String((prop as { description?: string }).description || '') : undefined;
          params.push({
            key,
            value: defaultValue,
            enabled: schema.required?.includes(key) || false,
            ...(desc ? { description: desc } : {}),
          });
        });
      }

      const onlyGenericInput = params.length === 1 && params[0].key === 'input';
      const known = baseUrl ? getKnownQueryParamsForPath(baseUrl) : null;
      if (known !== null && (params.length === 0 || onlyGenericInput)) {
        return known;
      }
      // Endpoints not in our list often get a generic "input" from 402 schema; show no params instead
      if (onlyGenericInput) {
        return [];
      }
    } catch {
      // Ignore extraction errors
    }

    return params;
  }, []);

  // Track URL base to detect when it changes significantly
  const previousBaseUrlRef = useRef<string>('');

  // Auto-detect params and headers from 402 response
  useEffect(() => {
    // Clear any existing timeout
    if (autoDetectTimeoutRef.current) {
      clearTimeout(autoDetectTimeoutRef.current);
      setIsAutoDetecting(false);
    }

    if (!url.trim()) {
      setIsAutoDetecting(false);
      return;
    }

    // Get base URL to detect significant changes
    const currentBaseUrl = getBaseUrl(url);
    
    // When base URL changes, clear detection result; method will be set after 402/405 probe
    // Skip clearing params/headers when URL was just set by an example flow (avoids wiping params and double history entry)
    if (currentBaseUrl !== previousBaseUrlRef.current && !exampleFlowJustRanRef.current) {
      setAllowedMethodsFromDetection([]);
      // Clear params except those from URL query string
      setParams(currentParams => {
        return currentParams.filter(() => false);
      });
      setHeaders(currentHeaders => {
        const contentTypeHeader = currentHeaders.find(h =>
          h.key.toLowerCase() === 'content-type'
        );
        return contentTypeHeader
          ? [contentTypeHeader]
          : [{ key: 'Content-Type', value: 'application/json', enabled: true }];
      });
    }
    
    previousBaseUrlRef.current = currentBaseUrl;

    // Handle URL query params immediately (before 402 detection)
    try {
      const urlHasQueryParams = url.includes('?') && url.split('?')[1].includes('=');
      
      if (urlHasQueryParams) {
        const detectedParams = parseUrlParams(url);
        
        if (detectedParams.length > 0) {
          setParams(currentParams => {
            // Replace params with URL params
            const newBaseUrl = getBaseUrl(url);
            if (newBaseUrl !== url) {
              lastProcessedUrlRef.current = newBaseUrl;
              setTimeout(() => setUrl(newBaseUrl), 0);
            }
            return detectedParams;
          });
        }
      }
    } catch {
      // Ignore URL param extraction errors
    }

    // Set loading state
    setIsAutoDetecting(true);

    // Wait 1 second after user stops typing, then make request to detect 402 response
    autoDetectTimeoutRef.current = setTimeout(async () => {
      const currentUrl = url.trim();
      if (!currentUrl) {
        setIsAutoDetecting(false);
        return;
      }

      // Get base URL (without query params)
      const baseUrl = getBaseUrl(currentUrl);
      
      // Skip auto-detection for invalid URLs
      if (!isValidApiUrl(baseUrl)) {
        setIsAutoDetecting(false);
        return;
      }
      
      // Check if this base URL has already been processed
      if (baseUrl === lastProcessedUrlRef.current) {
        setIsAutoDetecting(false);
        return;
      }

      // Skip fetch when we just ran an example flow (avoids second request / double entry)
      if (skipNextAutoDetectRef.current) {
        setIsAutoDetecting(false);
        return;
      }

      // Mark as processed to avoid duplicate requests
      lastProcessedUrlRef.current = baseUrl;

      try {
        // Probe GET and POST to detect allowed methods from 402 (payment required) or 2xx; 405 = method not allowed
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const opts = { headers: { 'Content-Type': 'application/json' } as Record<string, string>, signal: controller.signal };

        const doProbe = async (probeMethod: HttpMethod): Promise<{ status: number; body?: string }> => {
          if (useBackendPlaygroundProxy(baseUrl)) {
            const res = await fetch(getPlaygroundProxyUrl(baseUrl), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...getApiHeaders() },
              body: JSON.stringify({
                url: baseUrl,
                method: probeMethod,
                headers: { 'Content-Type': 'application/json' },
                body: probeMethod === 'POST' ? '{}' : undefined,
              }),
              signal: controller.signal,
            });
            const text = await res.text();
            return { status: res.status, body: text };
          }
          const res = await fetch(getProxiedUrl(baseUrl), {
            method: probeMethod,
            ...opts,
            ...(probeMethod === 'POST' ? { body: '{}' } : {}),
          });
          const text = await res.text();
          return { status: res.status, body: text };
        };

        const [getResult, postResult] = await Promise.all([
          doProbe('GET').catch(() => ({ status: 0 })),
          doProbe('POST').catch(() => ({ status: 0 })),
        ]);
        clearTimeout(timeoutId);

        const methodAllowed = (s: number) => s === 402 || (s >= 200 && s < 300);
        const getAllowed = getResult.status !== 405 && methodAllowed(getResult.status);
        const postAllowed = postResult.status !== 405 && methodAllowed(postResult.status);
        const allowed: HttpMethod[] = [];
        if (getAllowed) allowed.push('GET');
        if (postAllowed) allowed.push('POST');

        if (allowed.length > 0) {
          setAllowedMethodsFromDetection(allowed);
          setMethod(allowed.includes('GET') ? 'GET' : 'POST');
        }

        // Use 402 response from the chosen method for params/headers (prefer GET if both 402)
        const chosenMethod = allowed.includes('GET') ? 'GET' : 'POST';
        const response402 =
          (chosenMethod === 'GET' && getResult.status === 402 ? getResult.body : null) ??
          (postResult.status === 402 ? postResult.body : null);

        if (response402) {
          try {
            const jsonData = JSON.parse(response402);
            const parsed = parseX402Response(jsonData);
            if (parsed) {
              const detectedParams = extractParamsFrom402Response(parsed, baseUrl);
              if (detectedParams.length > 0) {
                setParams((currentParams) => {
                  if (currentParams.length === 0) return detectedParams;
                  const existingKeys = new Set(currentParams.map((p) => p.key.toLowerCase()));
                  const newParams = detectedParams.filter((p) => !existingKeys.has(p.key.toLowerCase()));
                  return newParams.length > 0 ? [...currentParams, ...newParams] : currentParams;
                });
              }
              setHeaders((currentHeaders) => {
                const hasOnlyDefault =
                  currentHeaders.length === 1 &&
                  currentHeaders[0].key === 'Content-Type' &&
                  currentHeaders[0].value === 'application/json';
                if (!hasOnlyDefault) return currentHeaders;
                const detectedHeaders: RequestHeader[] = [];
                if (parsed.resource?.mimeType) {
                  detectedHeaders.push({ key: 'Accept', value: parsed.resource.mimeType, enabled: true });
                }
                detectedHeaders.push(...detectHeadersFromUrl(currentUrl));
                const existingKeys = new Set(currentHeaders.map((h) => h.key.toLowerCase()));
                const newHeaders = detectedHeaders.filter((h) => !existingKeys.has(h.key.toLowerCase()));
                return newHeaders.length > 0 ? [...currentHeaders, ...newHeaders] : currentHeaders;
              });
            }
          } catch {
            // Ignore parse errors
          }
        }
      } catch {
        // Silently fail - don't interrupt user input
      } finally {
        setIsAutoDetecting(false);
      }
    }, 1000); // 1 second delay

    // Cleanup timeout on unmount or URL change
    return () => {
      if (autoDetectTimeoutRef.current) {
        clearTimeout(autoDetectTimeoutRef.current);
      }
      setIsAutoDetecting(false);
    };
  }, [url, method, extractParamsFrom402Response]); // Run when URL or method changes

  // Transaction state
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ status: 'idle' });

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUnsupportedApiModalOpen, setIsUnsupportedApiModalOpen] = useState(false);
  const [isV1UnsupportedModalOpen, setIsV1UnsupportedModalOpen] = useState(false);
  
  // Desktop sidebar state - load from localStorage
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => {
    const stored = localStorage.getItem('x402_api_playground_desktop_sidebar_open');
    return stored !== null ? stored === 'true' : true; // Default to open
  });
  
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem('x402_api_playground_sidebar_width');
    return stored ? parseInt(stored, 10) : 448; // Default 28rem (448px)
  });
  
  // Save desktop sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('x402_api_playground_desktop_sidebar_open', String(isDesktopSidebarOpen));
  }, [isDesktopSidebarOpen]);
  
  // Save sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('x402_api_playground_sidebar_width', String(sidebarWidth));
  }, [sidebarWidth]);
  
  // Panel split ratio (percentage for request builder, 0-100)
  const [panelSplitRatio, setPanelSplitRatio] = useState(() => {
    const stored = localStorage.getItem('x402_api_playground_panel_split_ratio');
    return stored ? parseFloat(stored) : 42; // Default 42% request / 58% response so response body has more room
  });
  
  // Save panel split ratio to localStorage
  useEffect(() => {
    localStorage.setItem('x402_api_playground_panel_split_ratio', String(panelSplitRatio));
  }, [panelSplitRatio]);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Helper function to check if two requests are the same (ignoring ID and timestamp)
  const areRequestsEqual = (req1: Omit<ApiRequest, 'id' | 'timestamp'>, req2: Omit<ApiRequest, 'id' | 'timestamp'>): boolean => {
    // Compare method
    if (req1.method !== req2.method) return false;
    
    // Compare final URLs (with params already included)
    if (req1.url !== req2.url) return false;
    
    // Compare body (normalize whitespace for comparison)
    const body1 = (req1.body || '').trim();
    const body2 = (req2.body || '').trim();
    if (body1 !== body2) return false;
    
    return true;
  };

  // Map wallet context to WalletState interface
  const wallet: WalletState = {
    connected: walletContext.connected,
    address: walletContext.shortAddress || undefined,
    balance: walletContext.usdcBalance !== null 
      ? `${walletContext.usdcBalance.toFixed(2)} USDC` 
      : undefined,
    network: walletContext.network,
  };

  // Open connect-wallet modal (user chooses Solana or Base, then sees supported wallets)
  const connectWallet = useCallback(() => {
    setConnectModalOpen(true);
  }, []);

  // Optional override when running an example flow (use instead of state).
  type RequestOverride = {
    method: HttpMethod;
    url: string;
    params: RequestParam[];
    headers: RequestHeader[];
    body: string;
  };

  // Send request (optionally with payment header or full request override for example flows).
  // Returns the HTTP status on success (e.g. 200, 402) or undefined on network error.
  const sendRequest = useCallback(async (paymentHeader?: string, requestOverride?: RequestOverride): Promise<number | undefined> => {
    const useOverride = !!requestOverride;
    const baseUrl = useOverride ? requestOverride.url.trim() : url.trim();
    if (!baseUrl) return undefined;

    if (!isValidApiUrl(baseUrl)) {
      setIsUnsupportedApiModalOpen(true);
      return undefined;
    }

    const startTime = Date.now();
    const effectiveMethod = useOverride ? requestOverride.method : method;
    const effectiveParams = useOverride ? requestOverride.params : params;
    const effectiveHeaders = useOverride ? requestOverride.headers : headers;
    const effectiveBody = useOverride ? requestOverride.body : body;

    // Build URL with params (Nansen expects POST JSON body, so don't add params to URL)
    let finalUrl = baseUrl;
    const enabledParams = effectiveParams.filter(p => p.enabled && p.key);
    const isNansen = isNansenUrl(baseUrl);
    if (enabledParams.length > 0 && !isNansen) {
      const searchParams = new URLSearchParams();
      enabledParams.forEach(p => searchParams.append(p.key, p.value));
      finalUrl += (baseUrl.includes('?') ? '&' : '?') + searchParams.toString();
    }

    // Client-side validation: GET to query-required endpoints must have non-empty query param
    const pathname = (() => {
      try {
        return new URL(baseUrl).pathname.toLowerCase();
      } catch {
        return '';
      }
    })();
    if (effectiveMethod === 'GET' && (pathname === '/v2/exa-search' || pathname === '/v2/browse' || pathname === '/v2/x-search')) {
      const queryVal = enabledParams.find(p => p.key === 'query')?.value?.trim() ?? '';
      if (!queryVal) {
        toast({
          title: 'Query required',
          description: 'Please enter a search query in the Params section (e.g. "bitcoin insight", "latest Nvidia news").',
          variant: 'destructive',
        });
        return undefined;
      }
    }

    // For POST to query-based endpoints, ensure body includes query when body is empty (playground fills params, not body)
    let bodyToSend = effectiveBody;
    if (effectiveMethod === 'POST' && enabledParams.length > 0) {
      const pathname = (() => {
        try {
          return new URL(baseUrl).pathname.toLowerCase();
        } catch {
          return '';
        }
      })();
      const emptyBody = !effectiveBody.trim() || /^\s*\{\s*\}\s*$/.test(effectiveBody.trim()) || /^\s*\{\s*\n?\s*\}\s*$/.test(effectiveBody.trim());
      if (emptyBody && isNansen) {
        // Nansen API expects POST with JSON body; build from params (parse JSON-like values)
        const bodyObj: Record<string, unknown> = {};
        enabledParams.forEach(p => {
          const v = p.value?.trim() ?? '';
          if (v.startsWith('{') || v.startsWith('[')) {
            try {
              bodyObj[p.key] = JSON.parse(v);
            } catch {
              bodyObj[p.key] = p.value;
            }
          } else {
            bodyObj[p.key] = p.value;
          }
        });
        bodyToSend = JSON.stringify(bodyObj);
      } else if (emptyBody && (pathname === '/v2/exa-search' || pathname === '/v2/browse' || pathname === '/v2/x-search')) {
        const queryVal = enabledParams.find(p => p.key === 'query')?.value ?? '';
        bodyToSend = JSON.stringify({ query: queryVal });
      }
    }

    // Build headers
    const requestHeaders: Record<string, string> = {};
    effectiveHeaders.filter(h => h.enabled && h.key).forEach(h => {
      requestHeaders[h.key] = h.value;
    });

    // Add payment header if provided (for retry after payment). V2 format: use PAYMENT-SIGNATURE; also send X-Payment for legacy v1 APIs.
    if (paymentHeader) {
      requestHeaders['PAYMENT-SIGNATURE'] = paymentHeader;
      requestHeaders['X-Payment'] = paymentHeader;
    }
    // So production API can apply playground-dev pricing when this wallet is connected
    const payerAddress = walletContext.address ?? walletContext.baseAddress ?? null;
    if (payerAddress) {
      requestHeaders['X-Payer-Address'] = payerAddress;
    }
    // Nansen expects JSON body with Content-Type: application/json
    if (isNansen && bodyToSend.trim() && effectiveMethod === 'POST' && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    // Build request object for comparison (without ID and timestamp)
    const requestForComparison: Omit<ApiRequest, 'id' | 'timestamp'> = {
      method: effectiveMethod,
      url: finalUrl,
      headers: effectiveHeaders,
      body: effectiveBody,
      params: effectiveParams,
    };

    // Check if this is a tracked request (cloned or new)
    const trackedId = clonedRequestIdRef.current || newRequestIdRef.current;
    let requestId: string;

    if (trackedId) {
      // Use tracked ID
      requestId = trackedId;
      clonedRequestIdRef.current = null;
      newRequestIdRef.current = null;
    } else {
      // Check if there's an existing history item with the same request
      // We need to check history state, but since we're in a callback, we'll do it in setHistory
      requestId = generateId(); // Temporary ID, will be replaced if we find existing
    }

    const request: ApiRequest = {
      id: requestId,
      method: effectiveMethod,
      url: finalUrl,
      headers: effectiveHeaders,
      body: effectiveBody,
      params: effectiveParams,
      timestamp: new Date(),
    };

    // Update history and track actual request ID
    if (trackedId) {
      // Update tracked request (or add it if not yet in list – e.g. example flow before our setState flushed)
      actualRequestIdRef.current = requestId;
      const trackedRequestId = requestId;
      const loadingItem: HistoryItem = {
        id: trackedRequestId,
        request,
        status: 'loading',
        timestamp: new Date(),
      };
      setHistory(prev => {
        const idx = prev.findIndex(h => h.id === trackedRequestId);
        if (idx >= 0) {
          return prev.map(h =>
            h.id === trackedRequestId
              ? { ...h, request, status: 'loading' as const, response: undefined }
              : h
          );
        }
        return [loadingItem, ...prev];
      });
    } else {
      // Check for existing history item with same request
      setHistory(prev => {
        const existingIndex = prev.findIndex(h => {
          // Create comparison request from existing history item (without id and timestamp)
          const existingRequestForComparison: Omit<ApiRequest, 'id' | 'timestamp'> = {
            method: h.request.method,
            url: h.request.url,
            headers: h.request.headers,
            body: h.request.body,
            params: h.request.params,
          };
          return areRequestsEqual(existingRequestForComparison, requestForComparison);
        });
        
        if (existingIndex !== -1) {
          // Update existing history item instead of creating new one
          const existingItem = prev[existingIndex];
          const existingId = existingItem.id;
          actualRequestIdRef.current = existingId; // Track the actual ID being used
          
          const updated = [...prev];
          updated[existingIndex] = {
            ...existingItem,
            request: {
              ...request,
              id: existingId, // Use existing ID
            },
            status: 'loading',
            response: undefined,
            timestamp: new Date(), // Update timestamp to show it's the latest
          };
          // Move updated item to the top
          const [updatedItem] = updated.splice(existingIndex, 1);
          return [updatedItem, ...updated];
        } else {
          // Create new history item
          actualRequestIdRef.current = requestId;
          const historyItem: HistoryItem = {
            id: requestId,
            request,
            status: 'loading',
            timestamp: new Date(),
          };
          return [historyItem, ...prev];
        }
      });
    }
    
    // Use the actual request ID for response updates
    const actualRequestId = actualRequestIdRef.current;
    setStatus('loading');
    setResponse(undefined);
    setPaymentDetails(undefined);
    setX402Response(undefined);
    setPaymentOption(undefined);

    try {
      let fetchResponse: Response;
      if (useBackendPlaygroundProxy(finalUrl)) {
        // Cross-origin: use the **target** API's playground-proxy so the request reaches the right service (e.g. api.syraa.fun)
        const proxyUrl = getPlaygroundProxyUrl(finalUrl);
        fetchResponse = await fetch(proxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getApiHeaders() },
          body: JSON.stringify({
            url: finalUrl,
            method: effectiveMethod,
            body: bodyToSend.trim() || undefined,
            headers: requestHeaders,
          }),
        });
      } else {
        // Dev proxy or same-origin: request directly (or via Vite proxy)
        const fetchOptions: RequestInit = {
          method: effectiveMethod,
          headers: requestHeaders,
        };
        if (effectiveMethod === 'POST' && bodyToSend.trim()) {
          fetchOptions.body = bodyToSend;
        }
        const proxiedUrl = getProxiedUrl(finalUrl);
        fetchResponse = await fetch(proxiedUrl, fetchOptions);
      }
      
      // Get response body (store raw so Pretty/Raw toggle works in ResponseViewer)
      const responseText = await fetchResponse.text();

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const apiResponse: ApiResponse = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: responseHeaders,
        body: responseText,
        time: Date.now() - startTime,
        size: new TextEncoder().encode(responseText).length,
      };

      setResponse(apiResponse);

      // Check if 402 Payment Required
      if (fetchResponse.status === 402) {
        // Return so caller knows retry got 402 (e.g. don't show "success" toast)
        let parsed = null;
        let details = null;
        let jsonData: any = null;
        
        // Try to parse response as JSON
        try {
          jsonData = JSON.parse(responseText);
        } catch {
          // Response is not valid JSON
        }
        
        // Try to parse as x402 protocol
        if (jsonData) {
          try {
            parsed = parseX402Response(jsonData, responseHeaders);
            
            if (parsed) {
              setX402Response(parsed);
              const byChain = getPaymentOptionsByChain(parsed);
              setPaymentOptionsByChain(byChain);
              // Auto-detect chain from connected wallet: Solana wallet → Solana, Base (e.g. MetaMask) → Base
              let defaultChain: 'solana' | 'base' = 'solana';
              if (byChain.solana && byChain.base) {
                if (walletContext.baseConnected && !walletContext.connected) {
                  defaultChain = 'base';
                } else if (walletContext.connected) {
                  defaultChain = 'solana';
                }
                // else neither connected → keep solana as default
              } else if (byChain.base) {
                defaultChain = 'base';
              }
              setSelectedPaymentChain(defaultChain);
              const option = byChain[defaultChain] ?? getBestPaymentOption(parsed);
              setPaymentOption(option || undefined);
              details = option ? extractPaymentDetailsFromOption(option) : extractPaymentDetails(parsed);
              if (parsed.x402Version === 1 && !option) {
                setIsV1UnsupportedModalOpen(true);
              }
            }
          } catch {
            // Ignore x402 parsing errors
          }
        }
        
        // Always set status to payment_required for 402
        setStatus('payment_required');
        setHistory(prev => prev.map(h => 
          h.id === actualRequestId ? { ...h, response: apiResponse, status: 'payment_required' } : h
        ));
        
        // Try to build payment details from various sources if not already extracted
        if (!details && jsonData) {
          // Check if we have accepts array directly
          if (jsonData.accepts && Array.isArray(jsonData.accepts) && jsonData.accepts.length > 0) {
            const accept = jsonData.accepts[0];
            
            // Format amount (convert from micro-units if needed)
            let formattedAmount = accept.amount || '0';
            if (formattedAmount && parseInt(formattedAmount) > 10000) {
              // Likely micro-units, convert to human readable
              const microUnits = BigInt(formattedAmount);
              const divisor = BigInt(1000000);
              const intPart = microUnits / divisor;
              const decPart = microUnits % divisor;
              formattedAmount = decPart === BigInt(0) 
                ? intPart.toString() 
                : `${intPart}.${decPart.toString().padStart(6, '0').replace(/0+$/, '')}`;
            }
            
            details = {
              amount: formattedAmount,
              token: accept.asset === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USDC' : (accept.asset || 'USDC'),
              recipient: accept.payTo || '',
              network: accept.network?.includes('devnet') ? 'Solana Devnet' : 'Solana Mainnet',
              memo: accept.extra?.memo,
            };
          } else {
            // Fallback to generic field names
            const genericDetails: PaymentDetails = {
              amount: String(jsonData.amount || jsonData.price || jsonData.cost || '0'),
              token: jsonData.token || jsonData.asset || jsonData.currency || 'USDC',
              recipient: jsonData.payTo || jsonData.address || jsonData.recipient || jsonData.wallet || '',
              network: jsonData.network || jsonData.chain || 'Solana',
              memo: jsonData.memo || jsonData.description || jsonData.message,
            };
            
            if (genericDetails.recipient || genericDetails.amount !== '0') {
              details = genericDetails;
            }
          }
        }
        
        // Set payment details (or null if none found)
        if (details) {
          setPaymentDetails(details);
        }

        // Auto-open payment modal for initial 402 (v1 and v2). If we already sent a payment header (retry), do not open again.
        if (!paymentHeader) {
          if (details) {
            toast({
              title: "Payment Required",
              description: `This API requires ${details.amount} ${details.token} to access.`,
            });
          } else {
            toast({
              title: "Payment Required (402)",
              description: "This API requires payment. Check the response body for payment details.",
            });
          }
          setIsPaymentModalOpen(true);
        } else if (paymentHeader) {
          const apiError = jsonData?.error && typeof jsonData.error === 'string' ? jsonData.error : null;
          toast({
            title: "Payment not verified",
            description: apiError
              ? `The API rejected the payment: ${apiError}`
              : "Your payment could not be verified yet. Use « Retry » below or try paying again.",
            variant: apiError ? "destructive" : "default",
          });
        }
        return fetchResponse.status;
      }

      if (fetchResponse.ok) {
        setStatus('success');
        setPaymentDetails(undefined);
        setX402Response(undefined);
        setPaymentOption(undefined);
        setHistory(prev => prev.map(h => 
          h.id === actualRequestId ? { ...h, response: apiResponse, status: 'success' } : h
        ));
        return fetchResponse.status;
      }

      setStatus('error');
      setHistory(prev => prev.map(h => 
        h.id === actualRequestId ? { ...h, response: apiResponse, status: 'error' } : h
      ));
      return fetchResponse.status;

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError');
      
      const errorResponse: ApiResponse = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: JSON.stringify({ 
          error: 'Request failed', 
          message: errorMessage,
          hint: isNetworkError 
            ? 'This may be a CORS issue, network connectivity problem, or the server may be unreachable. Make sure the API URL is correct and the server is running.'
            : undefined
        }, null, 2),
        time: Date.now() - startTime,
        size: 0,
      };
      setResponse(errorResponse);
      setStatus('error');
      setHistory(prev => prev.map(h => 
        h.id === actualRequestId ? { ...h, response: errorResponse, status: 'error' } : h
      ));
      return undefined;
    }
  }, [method, url, headers, body, params]);

  // Run an example flow: load preset into builder and send immediately.
  // Optional paramsOverride (e.g. from Examples page modal) is used instead of preset.params when provided.
  // Uses a tracked ID so sendRequest adds exactly one history entry (no double from batching or double-click).
  const runExampleFlow = useCallback((flowId: string, paramsOverride?: RequestParam[]) => {
    const preset = getExampleFlows().find((f) => f.id === flowId);
    if (!preset) return;
    if (status === 'loading') return;
    // Use known params for this path when preset has none (e.g. exa-search needs query param for GET)
    const presetOrKnownParams = preset.params.length > 0 ? preset.params : getParamsForExampleFlow(preset);
    const effectiveParams = paramsOverride ?? presetOrKnownParams;
    const defaultHeaders: RequestHeader[] = [
      { key: 'Content-Type', value: 'application/json', enabled: true },
    ];
    // Skip the next auto-detect fetch and avoid URL effect clearing params (no double entry / pending)
    skipNextAutoDetectRef.current = true;
    exampleFlowJustRanRef.current = true;
    setTimeout(() => {
      skipNextAutoDetectRef.current = false;
      exampleFlowJustRanRef.current = false;
    }, 2500);
    // Default to GET for example flow; real method will be detected on 402 when user enters URL
    const defaultMethod = getDefaultMethodForUrl(preset.url);
    setMethod(defaultMethod);
    setUrl(preset.url);
    setParams(effectiveParams.map((p) => ({ ...p })));
    setHeaders(defaultHeaders);
    setBody('{\n  \n}');
    setResponse(undefined);
    setPaymentDetails(undefined);
    setX402Response(undefined);
    setPaymentOption(undefined);

    // For flows that require a non-empty query (exa-search, browse, x-search), don't send automatically when query is empty
    const pathname = (() => {
      try {
        return new URL(preset.url).pathname.toLowerCase();
      } catch {
        return '';
      }
    })();
    const queryRequiredPaths = ['/v2/exa-search', '/v2/browse', '/v2/x-search'];
    const queryValue = (effectiveParams.find((p) => p.key === 'query')?.value ?? '').trim();
    const shouldSend = !queryRequiredPaths.includes(pathname) || !!queryValue;

    if (shouldSend) {
      setStatus('loading');
      const newId = generateId();
      newRequestIdRef.current = newId;
      const override: RequestOverride = {
        method: defaultMethod,
        url: preset.url,
        params: effectiveParams.map((p) => ({ ...p })),
        headers: defaultHeaders,
        body: '{\n  \n}',
      };
      sendRequest(undefined, override);
      setSelectedHistoryId(newId);
    } else {
      setStatus('idle');
      toast({
        title: 'Enter your search query',
        description: 'Fill in the "query" param above (e.g. bitcoin insight, latest Nvidia news) and click Send.',
      });
    }
  }, [sendRequest, status]);

  // Try demo - randomly pick a v2 API and always create new history
  const tryDemo = useCallback(() => {
    // Randomly select a v2 API endpoint
    const endpoints = getV2ApiEndpoints();
    const randomIndex = Math.floor(Math.random() * endpoints.length);
    const randomEndpoint = endpoints[randomIndex];
    
    // Generate new request ID for try demo
    const newId = generateId();
    newRequestIdRef.current = newId;
    
    // Update form fields; auto-detect method (GET when both supported)
    setUrl(randomEndpoint);
    setMethod(getDefaultMethodForUrl(randomEndpoint));
    setBody('{\n  \n}'); // Clear body for GET requests
    setHeaders([
      { key: 'Content-Type', value: 'application/json', enabled: true },
    ]);
    setParams([]);
    
    // Always create a new history item for try demo
    const demoMethod = getDefaultMethodForUrl(randomEndpoint);
    const demoRequest: ApiRequest = {
      id: newId,
      method: demoMethod,
      url: randomEndpoint,
      headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
      body: '{\n  \n}',
      params: [],
      timestamp: new Date(),
    };
    
    const demoHistoryItem: HistoryItem = {
      id: newId,
      request: demoRequest,
      status: 'idle',
      timestamp: new Date(),
    };
    
    // Add to history (always new for try demo)
    setHistory(prev => [demoHistoryItem, ...prev]);
    
    // Select the newly created history item
    setSelectedHistoryId(newId);
    
    // Clear response state
    setResponse(undefined);
    setStatus('idle');
    setPaymentDetails(undefined);
    setX402Response(undefined);
    setPaymentOption(undefined);
  }, []);

  // Select history item
  const selectHistoryItem = useCallback((item: HistoryItem) => {
    // Clear cloned and new request tracking when selecting an existing item
    clonedRequestIdRef.current = null;
    newRequestIdRef.current = null;
    
    setSelectedHistoryId(item.id);
    setMethod(item.request.method);
    setUrl(item.request.url);
    setHeaders(item.request.headers);
    setBody(item.request.body);
    setParams(item.request.params);
    setResponse(item.response);
    setStatus(item.status);
    setIsSidebarOpen(false);
  }, []);

  // Create new request (reset form)
  const createNewRequest = useCallback(() => {
    // Clear cloned request tracking
    clonedRequestIdRef.current = null;
    
    // Generate new request ID for tracking
    const newId = generateId();
    newRequestIdRef.current = newId;
    
    setMethod('GET');
    setUrl('');
    const defaultHeaders = [{ key: 'Content-Type', value: 'application/json', enabled: true }];
    setHeaders(defaultHeaders);
    const defaultBody = '{\n  \n}';
    setBody(defaultBody);
    setParams([]);
    setResponse(undefined);
    setStatus('idle');
    setPaymentDetails(undefined);
    setX402Response(undefined);
    setPaymentOption(undefined);
    setIsSidebarOpen(false);
    
    // Create a new history item for the new request
    const newRequest: ApiRequest = {
      id: newId,
      method: 'GET',
      url: '',
      headers: defaultHeaders,
      body: defaultBody,
      params: [],
      timestamp: new Date(),
    };
    
    const newHistoryItem: HistoryItem = {
      id: newId,
      request: newRequest,
      status: 'idle',
      timestamp: new Date(),
    };
    
    // Add to history and save to localStorage
    setHistory(prev => [newHistoryItem, ...prev]);
    
    // Select the newly created history item to move focus to it
    setSelectedHistoryId(newId);
  }, []);

  // Clone history item
  const cloneHistoryItem = useCallback((item: HistoryItem) => {
    // Clear new request tracking
    newRequestIdRef.current = null;
    
    const clonedId = generateId();
    clonedRequestIdRef.current = clonedId;
    
    setSelectedHistoryId(undefined);
    setMethod(item.request.method);
    setUrl(item.request.url);
    // Deep clone headers and params to avoid reference issues
    const clonedHeaders = item.request.headers.map(h => ({ ...h }));
    const clonedParams = item.request.params.map(p => ({ ...p }));
    setHeaders(clonedHeaders);
    setBody(item.request.body);
    setParams(clonedParams);
    // Don't clone response - start fresh
    setResponse(undefined);
    setStatus('idle');
    setPaymentDetails(undefined);
    setX402Response(undefined);
    setPaymentOption(undefined);
    setIsSidebarOpen(false);
    
    // Create a new history item for the cloned request
    const clonedRequest: ApiRequest = {
      id: clonedId,
      method: item.request.method,
      url: item.request.url,
      headers: clonedHeaders,
      body: item.request.body,
      params: clonedParams,
      timestamp: new Date(),
    };
    
    const clonedHistoryItem: HistoryItem = {
      id: clonedId,
      request: clonedRequest,
      status: 'idle',
      timestamp: new Date(),
    };
    
    // Add to history and save to localStorage
    setHistory(prev => [clonedHistoryItem, ...prev]);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setSelectedHistoryId(undefined);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    // Clear request builder form fields
    setMethod('GET');
    setUrl('');
    setHeaders([{ key: 'Content-Type', value: 'application/json', enabled: true }]);
    setBody('{\n  \n}');
    setParams([]);
    setResponse(undefined);
    setStatus('idle');
    setPaymentDetails(undefined);
    setX402Response(undefined);
    setPaymentOption(undefined);
    // Clear tracking refs
    clonedRequestIdRef.current = null;
    newRequestIdRef.current = null;
  }, []);

  // Remove individual history item
  const removeHistoryItem = useCallback((itemId: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== itemId);
      // If the removed item was selected, clear selection
      if (selectedHistoryId === itemId) {
        setSelectedHistoryId(undefined);
      }
      return updated;
    });
  }, [selectedHistoryId]);

  // Switch selected payment chain and update option + details
  const selectPaymentChain = useCallback(
    (chain: 'solana' | 'base') => {
      setSelectedPaymentChain(chain);
      const option = chain === 'solana' ? paymentOptionsByChain.solana : paymentOptionsByChain.base;
      if (option) {
        setPaymentOption(option);
        setPaymentDetails(extractPaymentDetailsFromOption(option));
      }
    },
    [paymentOptionsByChain]
  );

  // Execute payment and auto-retry (Solana or Base)
  const pay = useCallback(async () => {
    if (!paymentOption) return;

    const isBase = isBaseNetwork(paymentOption);
    if (isBase) {
      if (!walletContext.baseConnected) return;
    } else {
      if (!walletContext.connected || !walletContext.publicKey) return;
    }

    setTransactionStatus({ status: 'pending' });

    const rawV1Accept =
      x402Response?.x402Version === 1 && x402Response._rawV1Accepts?.[0]
        ? x402Response._rawV1Accepts[0]
        : undefined;

    try {
      let result: Awaited<ReturnType<typeof executePayment>>;
      if (isBase) {
        const signer = await walletContext.getEvmSigner();
        if (!signer) {
          setTransactionStatus({ status: 'failed', error: 'Base wallet not available' });
          return;
        }
        result = await executeBasePayment(signer, paymentOption);
      } else {
        result = await executePayment(
            {
              connection,
              publicKey: walletContext.publicKey!,
              signTransaction: walletContext.signTransaction,
            },
            paymentOption,
            rawV1Accept
          );
      }

      if (result.success && result.paymentHeader) {
        setTransactionStatus({
          status: 'confirmed',
          hash: result.signature,
        });

        // Show warning toast if confirmation timed out (but transaction was submitted)
        if (result.warning) {
          toast({
            title: "Transaction Submitted",
            description: result.warning,
            variant: "default",
          });
        }

        // Store payment header and origin so we only reuse it for the same API
        localStorage.setItem(PAYMENT_HEADER_KEY, result.paymentHeader);
        const paidOrigin = getRequestOrigin(url);
        if (paidOrigin) localStorage.setItem(PAYMENT_ORIGIN_KEY, paidOrigin);
        
        // Auto-retry the request after a short delay to show success state
        setTimeout(async () => {
          setIsPaymentModalOpen(false);
          setTransactionStatus({ status: 'idle' });
          
          // Retry the request with payment header
          // The server will verify the transaction even if confirmation timed out
          const retryStatus = await sendRequest(result.paymentHeader);
          
          // Clear stored payment header and origin
          localStorage.removeItem(PAYMENT_HEADER_KEY);
          localStorage.removeItem(PAYMENT_ORIGIN_KEY);
          
          // Only show success toast when retry actually returned 200; otherwise
          // sendRequest already toasts "Payment not verified" for 402
          if (retryStatus === 200) {
            toast({
              title: "Payment Successful",
              description: "API data has been fetched successfully!",
            });
          }
        }, 3000); // 3s delay so server/facilitator can see the transaction before retry
      } else {
        setTransactionStatus({
          status: 'failed',
          error: result.error || 'Payment failed',
        });
        
        toast({
          title: "Payment Failed",
          description: result.error || 'Transaction was not completed.',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTransactionStatus({
        status: 'failed',
        error: error.message || 'Payment execution failed',
      });
      
      toast({
        title: "Payment Error",
        description: error.message || 'An unexpected error occurred.',
        variant: "destructive",
      });
    }
  }, [walletContext, paymentOption, connection, sendRequest, x402Response]);

  // Allowed methods from 402/405 probe (GET and/or POST); empty until detection runs
  const allowedMethods = useMemo((): HttpMethod[] => allowedMethodsFromDetection, [allowedMethodsFromDetection]);

  // Retry after payment (only use stored header if it was for this API's origin)
  const retryAfterPayment = useCallback(async () => {
    setIsPaymentModalOpen(false);
    
    const paymentHeader = localStorage.getItem(PAYMENT_HEADER_KEY);
    const storedOrigin = localStorage.getItem(PAYMENT_ORIGIN_KEY);
    const currentOrigin = getRequestOrigin(url);
    
    // Only send the stored payment header if it was for this same API origin
    if (paymentHeader && currentOrigin && storedOrigin && storedOrigin === currentOrigin) {
      setTransactionStatus({ status: 'idle' });
      await sendRequest(paymentHeader);
      localStorage.removeItem(PAYMENT_HEADER_KEY);
      localStorage.removeItem(PAYMENT_ORIGIN_KEY);
    } else {
      // Stored payment was for a different API or has no origin (legacy); don't send it
      if (paymentHeader && (!storedOrigin || (currentOrigin && storedOrigin !== currentOrigin))) {
        localStorage.removeItem(PAYMENT_HEADER_KEY);
        localStorage.removeItem(PAYMENT_ORIGIN_KEY);
        if (currentOrigin && storedOrigin && storedOrigin !== currentOrigin) {
          toast({
            title: "Payment was for a different API",
            description: "Your previous payment was for another service. Send the request again and pay for this API.",
            variant: "default",
          });
        }
      }
      // Send without payment header so user gets 402 and can pay for this API
      await sendRequest();
    }
  }, [sendRequest, url]);

  return {
    // Request state
    method,
    setMethod,
    url,
    setUrl,
    headers,
    setHeaders,
    body,
    setBody,
    params,
    setParams,

    // Response state
    response,
    status,
    paymentDetails,

    // History
    history,
    selectedHistoryId,
    selectHistoryItem,
    clearHistory,
    removeHistoryItem,
    createNewRequest,
    cloneHistoryItem,

    // Wallet
    wallet,
    transactionStatus,
    connectWallet,
    pay,
    retryAfterPayment,
    paymentOptionsByChain,
    selectedPaymentChain,
    selectPaymentChain,

    // Actions
    sendRequest: () => sendRequest(),
    tryDemo,
    runExampleFlow,

    // UI state
    isSidebarOpen,
    setIsSidebarOpen,
    connectModalOpen,
    setConnectModalOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isUnsupportedApiModalOpen,
    setIsUnsupportedApiModalOpen,
    isV1UnsupportedModalOpen,
    setIsV1UnsupportedModalOpen,
    isDesktopSidebarOpen,
    setIsDesktopSidebarOpen,
    sidebarWidth,
    setSidebarWidth,
    panelSplitRatio,
    setPanelSplitRatio,
    
    // Auto-detection state
    isAutoDetecting,

    // Allowed methods for current URL (from known path); empty = unknown, show both
    allowedMethods,
  };
}
