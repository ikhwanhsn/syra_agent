import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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

/** Headers for Syra API. Do not embed API keys in client; the API injects auth for trusted origins (playground.syraa.fun). */
function getApiHeaders(): Record<string, string> {
  return {};
}

/** Nansen API base (call directly; x402 payment with wallet). Override via VITE_NANSEN_API_BASE_URL. */
function getNansenBaseUrl(): string {
  const base = import.meta.env.VITE_NANSEN_API_BASE_URL as string | undefined;
  return (base && base.trim()) || 'https://api.nansen.ai';
}

/** Purch Vault API base (marketplace for agent skills, knowledge, personas). Override via VITE_PURCH_VAULT_API_BASE_URL. */
function getPurchVaultBaseUrl(): string {
  const base = import.meta.env.VITE_PURCH_VAULT_API_BASE_URL as string | undefined;
  return (base && base.trim()) || 'https://api.purch.xyz';
}

function isNansenUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.origin === new URL(getNansenBaseUrl()).origin;
  } catch {
    return false;
  }
}

function isPurchVaultUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.origin === new URL(getPurchVaultBaseUrl()).origin;
  } catch {
    return false;
  }
}

function isPurchVaultBuyUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.origin === new URL(getPurchVaultBaseUrl()).origin && u.pathname.toLowerCase().endsWith('/x402/vault/buy');
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
  /** Optional default JSON body for POST (e.g. 8004 register-agent). */
  body?: string;
}

/** All API endpoint example flows (unversioned paths; resolved at runtime so dev uses localhost:3000). First N are shown on Request Builder; rest on /examples. */
export function getExampleFlows(): ExampleFlowPreset[] {
  const base = getApiBaseUrl();
  return [
  // Featured (shown on main builder)
  {
    id: 'correlation-matrix',
    label: 'Correlation matrix',
    method: 'GET',
    url: `${base}/binance/correlation-matrix`,
    params: [],
  },
  {
    id: 'token-risk',
    label: 'Token risk',
    method: 'GET',
    url: `${base}/token-statistic`,
    params: [],
  },
  {
    id: 'token-risk-alerts',
    label: 'Token risk alerts',
    method: 'GET',
    url: `${base}/token-risk/alerts`,
    params: [
      { key: 'rugScoreMin', value: '80', enabled: true, description: 'Min normalised risk score (0-100)' },
      { key: 'source', value: 'new_tokens,recent,trending,verified', enabled: true, description: 'new_tokens, recent, trending, verified' },
      { key: 'limit', value: '20', enabled: true, description: 'Max tokens to check (1-50)' },
    ],
  },
  {
    id: 'dashboard-summary',
    label: 'Dashboard summary',
    method: 'GET',
    url: `${base}/dashboard-summary`,
    params: [{ key: 'period', value: '1D', enabled: true, description: '1H, 4H, 1D, 1W' }],
  },
  {
    id: 'website-crawl',
    label: 'Website crawl',
    method: 'POST',
    url: `${base}/crawl`,
    params: [
      { key: 'url', value: 'https://blog.cloudflare.com/', enabled: true, description: 'Starting URL to crawl (required)' },
      { key: 'limit', value: '20', enabled: true, description: 'Max pages (default 20, max 500)' },
      { key: 'depth', value: '2', enabled: true, description: 'Max link depth (default 2)' },
    ],
  },
  {
    id: 'browser-use',
    label: 'Browser Use (browser task)',
    method: 'POST',
    url: `${base}/browser-use`,
    params: [
      { key: 'task', value: 'What is the top post on Hacker News right now?', enabled: true, description: 'Natural language task for the browser agent (required)' },
      { key: 'start_url', value: '', enabled: false, description: 'Optional start URL (e.g. https://news.ycombinator.com)' },
    ],
  },
  {
    id: 'binance-ticker',
    label: 'Binance ticker',
    method: 'GET',
    url: `${base}/binance-ticker`,
    params: [],
  },
  {
    id: 'x-feed',
    label: 'X feed (profile + tweets)',
    method: 'GET',
    url: `${base}/x/feed`,
    params: [
      { key: 'username', value: 'syra_agent', enabled: true, description: 'X username' },
      { key: 'max_results', value: '5', enabled: true, description: 'Tweets to return (3–20)' },
    ],
  },
  {
    id: 'x-user',
    label: 'X user lookup',
    method: 'GET',
    url: `${base}/x/user`,
    params: [{ key: 'username', value: 'syra_agent', enabled: true, description: 'X username (without @)' }],
  },
  {
    id: 'x-search-recent',
    label: 'X search recent',
    method: 'GET',
    url: `${base}/x/search/recent`,
    params: [
      { key: 'query', value: 'crypto lang:en', enabled: true, description: 'Search query (e.g. crypto lang:en)' },
      { key: 'max_results', value: '10', enabled: true, description: '10–100' },
    ],
  },
  {
    id: 'news',
    label: 'Get news',
    method: 'GET',
    url: `${base}/news`,
    params: [{ key: 'ticker', value: 'general', enabled: true }],
  },
  {
    id: 'check-status',
    label: 'Check status',
    method: 'GET',
    url: `${base}/check-status`,
    params: [],
  },
  {
    id: 'mpp-check-status',
    label: 'MPP check status (v1)',
    method: 'GET',
    url: `${base}/mpp/v1/check-status`,
    params: [],
  },
  {
    id: '8004-stats',
    label: '8004 global stats',
    method: 'GET',
    url: `${base}/8004/stats`,
    params: [],
  },
  {
    id: '8004-leaderboard',
    label: '8004 leaderboard',
    method: 'GET',
    url: `${base}/8004/leaderboard`,
    params: [
      { key: 'minTier', value: '2', enabled: false, description: 'Min trust tier (0-4, e.g. 2 = Silver+)' },
      { key: 'limit', value: '20', enabled: true, description: 'Max results (default 50)' },
    ],
  },
  {
    id: '8004-register-agent',
    label: '8004 register agent',
    method: 'POST',
    url: `${base}/8004/register-agent`,
    params: [],
    body: JSON.stringify(
      {
        name: 'Syra',
        description: 'AI Trading Intelligence Agent for Solana. Real-time signals, crypto news, sentiment, deep research, token reports, and x402-native API.',
        image: 'https://syraa.fun/images/logo.jpg',
        services: [{ type: 'MCP', value: 'https://api.syraa.fun' }],
        skills: [
          'natural_language_processing/text_classification/sentiment_analysis',
          'natural_language_processing/information_retrieval_synthesis/knowledge_synthesis',
          'natural_language_processing/analytical_reasoning/problem_solving',
          'tool_interaction/tool_use_planning',
        ],
        domains: ['finance_and_business/finance'],
        x402Support: true,
        collectionPointer: 'c1:bafkreid3g6kogo55n5iob7pi36xppcycynn7m64pds7wshnankxjo52mfm',
      },
      null,
      2
    ),
  },
  {
    id: '8004scan-stats',
    label: '8004scan stats',
    method: 'GET',
    url: `${base}/8004scan/stats`,
    params: [],
  },
  {
    id: '8004scan-chains',
    label: '8004scan chains',
    method: 'GET',
    url: `${base}/8004scan/chains`,
    params: [],
  },
  {
    id: '8004scan-agents',
    label: '8004scan list agents',
    method: 'GET',
    url: `${base}/8004scan/agents`,
    params: [
      { key: 'page', value: '1', enabled: false, description: 'Page number' },
      { key: 'limit', value: '25', enabled: false, description: 'Per page' },
    ],
  },
  {
    id: '8004scan-agents-search',
    label: '8004scan search agents',
    method: 'GET',
    url: `${base}/8004scan/agents/search`,
    params: [{ key: 'q', value: 'trading', enabled: true, description: 'Search query (required)' }],
  },
  {
    id: 'heylol-feed',
    label: 'hey.lol feed',
    method: 'GET',
    url: `${base}/heylol/feed`,
    params: [],
  },
  {
    id: 'analytics-summary',
    label: 'Analytics summary',
    method: 'GET',
    url: `${base}/analytics/summary`,
    params: [],
  },
  // Core
  {
    id: 'signal',
    label: 'Signal',
    method: 'GET',
    url: `${base}/signal`,
    params: [{ key: 'token', value: 'bitcoin', enabled: true, description: 'e.g. bitcoin, solana' }],
  },
  {
    id: 'sentiment',
    label: 'Sentiment',
    method: 'GET',
    url: `${base}/sentiment`,
    params: [{ key: 'ticker', value: 'general', enabled: true }],
  },
  {
    id: 'event',
    label: 'Event',
    method: 'GET',
    url: `${base}/event`,
    params: [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
  },
  {
    id: 'exa-search',
    label: 'EXA search',
    method: 'GET',
    url: `${base}/exa-search`,
    params: [{ key: 'query', value: 'latest crypto news', enabled: true, description: 'e.g. latest news on Nvidia, crypto market' }],
  },
  {
    id: 'trending-headline',
    label: 'Trending headline',
    method: 'GET',
    url: `${base}/trending-headline`,
    params: [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
  },
  {
    id: 'sundown-digest',
    label: 'Sundown digest',
    method: 'GET',
    url: `${base}/sundown-digest`,
    params: [],
  },
  {
    id: 'brain',
    label: 'Brain (single-question AI)',
    method: 'GET',
    url: `${base}/brain`,
    params: [{ key: 'question', value: 'What is the latest BTC news?', enabled: true, description: 'Natural language question (e.g. trending pools on Solana, BTC price)' }],
  },
  // Partner
  {
    id: 'smart-money',
    label: 'Smart money',
    method: 'GET',
    url: `${base}/smart-money`,
    params: [],
  },
  {
    id: 'token-god-mode',
    label: 'Token god mode',
    method: 'GET',
    url: `${base}/token-god-mode`,
    params: [{ key: 'tokenAddress', value: '', enabled: true, description: 'Token address for Nansen research' }],
  },
  {
    id: 'dexscreener',
    label: 'DexScreener',
    method: 'GET',
    url: `${base}/dexscreener`,
    params: [],
  },
  {
    id: 'trending-jupiter',
    label: 'Trending Jupiter',
    method: 'GET',
    url: `${base}/trending-jupiter`,
    params: [],
  },
  {
    id: 'token-report',
    label: 'Token report',
    method: 'GET',
    url: `${base}/token-report`,
    params: [{ key: 'address', value: '', enabled: true, description: 'Token contract address (Rugcheck)' }],
  },
  {
    id: 'bubblemaps-maps',
    label: 'Bubblemaps maps',
    method: 'GET',
    url: `${base}/bubblemaps/maps`,
    params: [{ key: 'address', value: '', enabled: true, description: 'Solana token contract address' }],
  },
  {
    id: 'binance-correlation',
    label: 'Binance correlation',
    method: 'GET',
    url: `${base}/binance/correlation`,
    params: [{ key: 'symbol', value: 'BTCUSDT', enabled: true, description: 'e.g. BTCUSDT, ETHUSDT' }],
  },
  {
    id: 'binance-ticker-24h',
    label: 'Binance 24h ticker',
    method: 'GET',
    url: `${base}/binance/spot/ticker/24hr`,
    params: [{ key: 'symbol', value: 'BTCUSDT', enabled: false, description: 'Optional; omit for all symbols' }],
  },
  {
    id: 'binance-orderbook',
    label: 'Binance order book',
    method: 'GET',
    url: `${base}/binance/spot/depth`,
    params: [
      { key: 'symbol', value: 'BTCUSDT', enabled: true, description: 'e.g. BTCUSDT' },
      { key: 'limit', value: '100', enabled: true, description: '5, 10, 20, 50, 100, 500, 1000' },
    ],
  },
  {
    id: 'binance-exchange-info',
    label: 'Binance exchange info',
    method: 'GET',
    url: `${base}/binance/spot/exchange-info`,
    params: [{ key: 'symbol', value: 'BTCUSDT', enabled: false, description: 'Optional symbol or symbols' }],
  },
  {
    id: 'binance-spot-account',
    label: 'Binance spot account',
    method: 'GET',
    url: `${base}/binance/spot/account`,
    params: [],
  },
  {
    id: 'binance-spot-order',
    label: 'Binance place spot order',
    method: 'POST',
    url: `${base}/binance/spot/order`,
    params: [
      { key: 'symbol', value: 'BTCUSDT', enabled: true, description: 'Trading pair (required)' },
      { key: 'side', value: 'BUY', enabled: true, description: 'BUY or SELL' },
      { key: 'type', value: 'MARKET', enabled: true, description: 'MARKET, LIMIT, etc.' },
      { key: 'quantity', value: '0.001', enabled: true, description: 'Base asset quantity (or use quoteOrderQty for MARKET)' },
    ],
  },
  {
    id: 'kraken-ticker',
    label: 'Kraken ticker',
    method: 'GET',
    url: `${base}/kraken/ticker`,
    params: [{ key: 'pair', value: 'BTCUSD', enabled: true, description: 'Pair(s) comma-separated (default BTCUSD)' }],
  },
  {
    id: 'kraken-orderbook',
    label: 'Kraken orderbook',
    method: 'GET',
    url: `${base}/kraken/orderbook`,
    params: [
      { key: 'pair', value: 'BTCUSD', enabled: true, description: 'Pair (default BTCUSD)' },
      { key: 'count', value: '25', enabled: true, description: 'Depth (default 25, max 500)' },
    ],
  },
  {
    id: 'kraken-ohlc',
    label: 'Kraken OHLC',
    method: 'GET',
    url: `${base}/kraken/ohlc`,
    params: [
      { key: 'pair', value: 'BTCUSD', enabled: true, description: 'Pair (default BTCUSD)' },
      { key: 'interval', value: '60', enabled: true, description: 'Minutes (default 60)' },
    ],
  },
  {
    id: 'kraken-trades',
    label: 'Kraken trades',
    method: 'GET',
    url: `${base}/kraken/trades`,
    params: [
      { key: 'pair', value: 'BTCUSD', enabled: true, description: 'Pair (default BTCUSD)' },
      { key: 'count', value: '100', enabled: true, description: 'Number of trades (default 100, max 1000)' },
    ],
  },
  {
    id: 'kraken-status',
    label: 'Kraken status',
    method: 'GET',
    url: `${base}/kraken/status`,
    params: [],
  },
  {
    id: 'kraken-server-time',
    label: 'Kraken server time',
    method: 'GET',
    url: `${base}/kraken/server-time`,
    params: [],
  },
  // KuCoin spot (ticker, stats, orderbook, trades, candles, symbols, currencies, server-time)
  {
    id: 'kucoin-ticker',
    label: 'KuCoin ticker',
    method: 'GET',
    url: `${base}/kucoin/ticker`,
    params: [{ key: 'symbol', value: 'BTC-USDT', enabled: false, description: 'Optional symbol (omit for all tickers)' }],
  },
  {
    id: 'kucoin-stats',
    label: 'KuCoin 24h stats',
    method: 'GET',
    url: `${base}/kucoin/stats`,
    params: [{ key: 'symbol', value: 'BTC-USDT', enabled: true, description: 'Symbol (default BTC-USDT)' }],
  },
  {
    id: 'kucoin-orderbook',
    label: 'KuCoin orderbook',
    method: 'GET',
    url: `${base}/kucoin/orderbook`,
    params: [
      { key: 'symbol', value: 'BTC-USDT', enabled: true, description: 'Symbol (default BTC-USDT)' },
      { key: 'level', value: 'level2_20', enabled: true, description: 'level2_20 or level2_100' },
    ],
  },
  {
    id: 'kucoin-trades',
    label: 'KuCoin trades',
    method: 'GET',
    url: `${base}/kucoin/trades`,
    params: [{ key: 'symbol', value: 'BTC-USDT', enabled: true, description: 'Symbol (default BTC-USDT)' }],
  },
  {
    id: 'kucoin-candles',
    label: 'KuCoin candles',
    method: 'GET',
    url: `${base}/kucoin/candles`,
    params: [
      { key: 'symbol', value: 'BTC-USDT', enabled: true, description: 'Symbol (default BTC-USDT)' },
      { key: 'type', value: '1min', enabled: true, description: '1min, 1hour, 1day, etc.' },
      { key: 'pageSize', value: '100', enabled: true, description: 'Candles to return (max 1500)' },
    ],
  },
  {
    id: 'kucoin-symbols',
    label: 'KuCoin symbols',
    method: 'GET',
    url: `${base}/kucoin/symbols`,
    params: [],
  },
  {
    id: 'kucoin-currencies',
    label: 'KuCoin currencies',
    method: 'GET',
    url: `${base}/kucoin/currencies`,
    params: [],
  },
  {
    id: 'kucoin-server-time',
    label: 'KuCoin server time',
    method: 'GET',
    url: `${base}/kucoin/server-time`,
    params: [],
  },
  // OKX market (ticker, tickers, books, candles, trades, funding-rate, open-interest, etc.)
  {
    id: 'okx-ticker',
    label: 'OKX ticker',
    method: 'GET',
    url: `${base}/okx/ticker`,
    params: [{ key: 'instId', value: 'BTC-USDT', enabled: true, description: 'Instrument ID (e.g. BTC-USDT, ETH-USDT-SWAP)' }],
  },
  {
    id: 'okx-tickers',
    label: 'OKX tickers',
    method: 'GET',
    url: `${base}/okx/tickers`,
    params: [{ key: 'instType', value: 'SPOT', enabled: true, description: 'SPOT, SWAP, FUTURES, OPTION, MARGIN' }],
  },
  {
    id: 'okx-books',
    label: 'OKX order book',
    method: 'GET',
    url: `${base}/okx/books`,
    params: [
      { key: 'instId', value: 'BTC-USDT', enabled: true, description: 'Instrument ID (default BTC-USDT)' },
      { key: 'sz', value: '20', enabled: true, description: 'Depth (default 20, max 400)' },
    ],
  },
  {
    id: 'okx-candles',
    label: 'OKX candles',
    method: 'GET',
    url: `${base}/okx/candles`,
    params: [
      { key: 'instId', value: 'BTC-USDT', enabled: true, description: 'Instrument ID (default BTC-USDT)' },
      { key: 'bar', value: '1H', enabled: true, description: '1m, 3m, 5m, 15m, 30m, 1H, 2H, 4H, 6H, 12H, 1D, 1W, 1M' },
      { key: 'limit', value: '100', enabled: true, description: 'Candles to return (default 100, max 300)' },
    ],
  },
  {
    id: 'okx-trades',
    label: 'OKX trades',
    method: 'GET',
    url: `${base}/okx/trades`,
    params: [
      { key: 'instId', value: 'BTC-USDT', enabled: true, description: 'Instrument ID (default BTC-USDT)' },
      { key: 'limit', value: '100', enabled: true, description: 'Trades (default 100, max 500)' },
    ],
  },
  {
    id: 'okx-funding-rate',
    label: 'OKX funding rate',
    method: 'GET',
    url: `${base}/okx/funding-rate`,
    params: [{ key: 'instId', value: 'BTC-USDT-SWAP', enabled: true, description: 'Perpetual swap instId (default BTC-USDT-SWAP)' }],
  },
  {
    id: 'okx-open-interest',
    label: 'OKX open interest',
    method: 'GET',
    url: `${base}/okx/open-interest`,
    params: [{ key: 'instId', value: 'BTC-USDT-SWAP', enabled: true, description: 'Perpetual swap instId (default BTC-USDT-SWAP)' }],
  },
  {
    id: 'okx-mark-price',
    label: 'OKX mark price',
    method: 'GET',
    url: `${base}/okx/mark-price`,
    params: [{ key: 'instId', value: 'BTC-USDT-SWAP', enabled: true, description: 'Derivatives instId (default BTC-USDT-SWAP)' }],
  },
  {
    id: 'okx-time',
    label: 'OKX server time',
    method: 'GET',
    url: `${base}/okx/time`,
    params: [],
  },
  // OKX DEX (on-chain by token address + chain)
  {
    id: 'okx-dex-price',
    label: 'OKX DEX price',
    method: 'GET',
    url: `${base}/okx/dex/price`,
    params: [
      { key: 'address', value: 'So11111111111111111111111111111111111111112', enabled: true, description: 'Token contract address' },
      { key: 'chain', value: 'solana', enabled: true, description: 'Chain (ethereum, solana, base, etc.)' },
    ],
  },
  {
    id: 'okx-dex-prices',
    label: 'OKX DEX batch prices',
    method: 'GET',
    url: `${base}/okx/dex/prices`,
    params: [
      { key: 'tokens', value: '501:So11111111111111111111111111111111111111112', enabled: true, description: 'Comma-separated chainIndex:address or addresses' },
      { key: 'chain', value: 'solana', enabled: false, description: 'Default chain when tokens are plain addresses' },
    ],
  },
  {
    id: 'okx-dex-kline',
    label: 'OKX DEX kline',
    method: 'GET',
    url: `${base}/okx/dex/kline`,
    params: [
      { key: 'address', value: 'So11111111111111111111111111111111111111112', enabled: true, description: 'Token contract address' },
      { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
      { key: 'bar', value: '1H', enabled: true, description: '1m, 1H, 1D, etc.' },
      { key: 'limit', value: '100', enabled: true, description: 'Candles (max 299)' },
    ],
  },
  {
    id: 'okx-dex-trades',
    label: 'OKX DEX trades',
    method: 'GET',
    url: `${base}/okx/dex/trades`,
    params: [
      { key: 'address', value: 'So11111111111111111111111111111111111111112', enabled: true, description: 'Token contract address' },
      { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
      { key: 'limit', value: '100', enabled: true, description: 'Trades (max 500)' },
    ],
  },
  {
    id: 'okx-dex-index',
    label: 'OKX DEX index price',
    method: 'GET',
    url: `${base}/okx/dex/index`,
    params: [
      { key: 'address', value: '', enabled: true, description: 'Token address (empty for native)' },
      { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
    ],
  },
  {
    id: 'okx-dex-signal-chains',
    label: 'OKX DEX signal chains',
    method: 'GET',
    url: `${base}/okx/dex/signal-chains`,
    params: [],
  },
  {
    id: 'okx-dex-signal-list',
    label: 'OKX DEX signal list',
    method: 'GET',
    url: `${base}/okx/dex/signal-list`,
    params: [
      { key: 'chain', value: 'solana', enabled: true, description: 'Chain (e.g. solana, ethereum)' },
      { key: 'walletType', value: '1,2,3', enabled: false, description: '1=Smart Money, 2=KOL, 3=Whale' },
      { key: 'minAmountUsd', value: '1000', enabled: false, description: 'Min USD amount' },
    ],
  },
  {
    id: 'okx-dex-memepump-chains',
    label: 'OKX DEX memepump chains',
    method: 'GET',
    url: `${base}/okx/dex/memepump-chains`,
    params: [],
  },
  {
    id: 'okx-dex-memepump-tokens',
    label: 'OKX DEX memepump tokens',
    method: 'GET',
    url: `${base}/okx/dex/memepump-tokens`,
    params: [
      { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
      { key: 'stage', value: 'NEW', enabled: true, description: 'NEW, MIGRATING, or MIGRATED' },
    ],
  },
  {
    id: 'okx-dex-memepump-token-details',
    label: 'OKX DEX memepump token details',
    method: 'GET',
    url: `${base}/okx/dex/memepump-token-details`,
    params: [
      { key: 'address', value: '', enabled: true, description: 'Token contract address' },
      { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
    ],
  },
  {
    id: 'okx-dex-memepump-token-dev-info',
    label: 'OKX DEX memepump token dev info',
    method: 'GET',
    url: `${base}/okx/dex/memepump-token-dev-info`,
    params: [
      { key: 'address', value: '', enabled: true, description: 'Token contract address' },
      { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
    ],
  },
  {
    id: 'okx-dex-memepump-similar-tokens',
    label: 'OKX DEX memepump similar tokens',
    method: 'GET',
    url: `${base}/okx/dex/memepump-similar-tokens`,
    params: [
      { key: 'address', value: '', enabled: true, description: 'Token contract address' },
      { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
    ],
  },
  {
    id: 'okx-dex-memepump-token-bundle-info',
    label: 'OKX DEX memepump token bundle info',
    method: 'GET',
    url: `${base}/okx/dex/memepump-token-bundle-info`,
    params: [
      { key: 'address', value: '', enabled: true, description: 'Token contract address' },
      { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
    ],
  },
  {
    id: 'okx-dex-memepump-aped-wallet',
    label: 'OKX DEX memepump aped wallet',
    method: 'GET',
    url: `${base}/okx/dex/memepump-aped-wallet`,
    params: [
      { key: 'address', value: '', enabled: true, description: 'Token contract address' },
      { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
      { key: 'wallet', value: '', enabled: false, description: 'Wallet to highlight' },
    ],
  },
  {
    id: 'jupiter-swap-order',
    label: 'Jupiter swap order',
    method: 'GET',
    url: `${base}/jupiter/swap/order`,
    params: [
      { key: 'inputMint', value: 'So11111111111111111111111111111111111111112', enabled: true, description: 'Input token mint (SOL wrapped)' },
      { key: 'outputMint', value: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', enabled: true, description: 'Output token mint (USDC)' },
      { key: 'amount', value: '1000000', enabled: true, description: 'Amount in smallest units (1M lamports = 0.001 SOL)' },
      { key: 'taker', value: '', enabled: true, description: 'Your wallet public key (executes the swap)' },
    ],
  },
  {
    id: 'squid-route',
    label: 'Squid cross-chain route',
    method: 'POST',
    url: `${base}/squid/route`,
    params: [
      { key: 'fromAddress', value: '', enabled: true, description: 'Source chain wallet address' },
      { key: 'fromChain', value: '8453', enabled: true, description: 'Source chain ID (e.g. 8453 Base, 42161 Arbitrum, 56 BNB)' },
      { key: 'fromToken', value: '', enabled: true, description: 'Source token contract address' },
      { key: 'fromAmount', value: '1000000', enabled: true, description: 'Amount in smallest units' },
      { key: 'toChain', value: '42161', enabled: true, description: 'Destination chain ID' },
      { key: 'toToken', value: '', enabled: true, description: 'Destination token contract address' },
      { key: 'toAddress', value: '', enabled: true, description: 'Destination wallet address' },
      { key: 'slippage', value: '1', enabled: true, description: 'Slippage tolerance percent (default 1)' },
    ],
  },
  {
    id: 'squid-status',
    label: 'Squid cross-chain status',
    method: 'GET',
    url: `${base}/squid/status`,
    params: [
      { key: 'transactionId', value: '', enabled: true, description: 'Source chain transaction hash' },
      { key: 'requestId', value: '', enabled: true, description: 'x-request-id from route response' },
      { key: 'fromChainId', value: '', enabled: true, description: 'Source chain ID' },
      { key: 'toChainId', value: '', enabled: true, description: 'Destination chain ID' },
      { key: 'quoteId', value: '', enabled: false, description: 'quoteId from route (Coral V2)' },
    ],
  },
  // Purch Vault (api.purch.xyz — marketplace for agent skills, knowledge, personas; x402 payment with wallet)
  {
    id: 'purch-vault-search',
    label: 'Purch Vault search',
    method: 'GET',
    url: `${getPurchVaultBaseUrl()}/x402/vault/search`,
    params: [
      { key: 'q', value: 'development', enabled: true, description: 'Search query (optional)' },
      { key: 'category', value: 'development', enabled: false, description: 'marketing, development, automation, career, ios, productivity' },
      { key: 'productType', value: '', enabled: false, description: 'skill, knowledge, persona' },
      { key: 'limit', value: '30', enabled: true, description: 'Items per page (1-100, default 30)' },
    ],
  },
  {
    id: 'purch-vault-buy',
    label: 'Purch Vault buy',
    method: 'POST',
    url: `${getPurchVaultBaseUrl()}/x402/vault/buy`,
    params: [
      { key: 'slug', value: 'faith', enabled: true, description: 'Item slug from search (required)' },
      { key: 'walletAddress', value: '', enabled: true, description: 'Your Solana wallet (payer)' },
      { key: 'email', value: 'user@example.com', enabled: true, description: 'Email for receipt' },
    ],
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
    url: `${base}/coingecko/simple-price`,
    params: [
      { key: 'symbols', value: 'btc,eth,sol', enabled: true, description: 'Comma-separated symbols' },
      { key: 'ids', value: 'bitcoin', enabled: false, description: 'Or use ids instead of symbols (e.g. bitcoin,ethereum)' },
      { key: 'vs_currencies', value: 'usd', enabled: true, description: 'e.g. usd' },
      { key: 'include_market_cap', value: 'true', enabled: false, description: 'true/false' },
      { key: 'include_24hr_vol', value: 'true', enabled: false, description: 'true/false' },
      { key: 'include_24hr_change', value: 'true', enabled: false, description: 'true/false' },
    ],
  },
  {
    id: 'coingecko-onchain-token-price',
    label: 'CoinGecko onchain token price',
    method: 'GET',
    url: `${base}/coingecko/onchain/token-price`,
    params: [
      { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana, eth' },
      { key: 'address', value: '', enabled: true, description: 'Token contract address (comma for multiple)' },
    ],
  },
  {
    id: 'coingecko-search-pools',
    label: 'CoinGecko search pools',
    method: 'GET',
    url: `${base}/coingecko/onchain/search-pools`,
    params: [
      { key: 'query', value: 'pump', enabled: true, description: 'Search query (name, symbol, or address)' },
      { key: 'network', value: 'solana', enabled: true, description: 'e.g. solana, base' },
    ],
  },
  {
    id: 'coingecko-trending-pools',
    label: 'CoinGecko trending pools',
    method: 'GET',
    url: `${base}/coingecko/onchain/trending-pools`,
    params: [
      { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana' },
      { key: 'duration', value: '5m', enabled: false, description: 'e.g. 5m' },
    ],
  },
  {
    id: 'coingecko-onchain-token',
    label: 'CoinGecko onchain token',
    method: 'GET',
    url: `${base}/coingecko/onchain/token`,
    params: [
      { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana, eth' },
      { key: 'address', value: '', enabled: true, description: 'Token contract address' },
    ],
  },
  {
    id: 'coinmarketcap-quotes',
    label: 'CoinMarketCap quotes latest',
    method: 'GET',
    url: `${base}/coinmarketcap`,
    params: [
      { key: 'endpoint', value: 'quotes-latest', enabled: true, description: 'quotes-latest, listing-latest, dex-pairs-quotes-latest, dex-search, mcp' },
      { key: 'id', value: '1', enabled: true, description: 'CMC id (e.g. 1 for Bitcoin, 1027 for Ethereum)' },
      { key: 'convert', value: 'USD', enabled: true, description: 'Convert to (default USD)' },
    ],
  },
  {
    id: 'coinmarketcap-listing',
    label: 'CoinMarketCap listing latest',
    method: 'GET',
    url: `${base}/coinmarketcap`,
    params: [
      { key: 'endpoint', value: 'listing-latest', enabled: true, description: 'listing-latest' },
      { key: 'start', value: '1', enabled: true, description: 'Start rank (default 1)' },
      { key: 'limit', value: '10', enabled: true, description: 'Limit (default 10)' },
      { key: 'convert', value: 'USD', enabled: true, description: 'Convert to (default USD)' },
    ],
  },
  {
    id: 'coinmarketcap-dex-search',
    label: 'CoinMarketCap DEX search',
    method: 'GET',
    url: `${base}/coinmarketcap`,
    params: [
      { key: 'endpoint', value: 'dex-search', enabled: true, description: 'dex-search' },
      { key: 'q', value: 'pepe', enabled: true, description: 'Search keyword (name, symbol, or contract address)' },
    ],
  },
  {
    id: 'coinmarketcap-dex-pairs',
    label: 'CoinMarketCap DEX pairs quotes',
    method: 'GET',
    url: `${base}/coinmarketcap`,
    params: [
      { key: 'endpoint', value: 'dex-pairs-quotes-latest', enabled: true, description: 'dex-pairs-quotes-latest' },
      { key: 'chain_id', value: '8453', enabled: true, description: 'Chain id (e.g. 8453 for Base)' },
      { key: 'pair_address', value: '0x3548029694fbb241d45fb24ba0cd9c9d4e745f16', enabled: true, description: 'Pair address (WETH/USDC on Base by default)' },
    ],
  },
  // Messari x402
  {
    id: 'messari-ai',
    label: 'Messari AI chat',
    method: 'POST',
    url: `${base}/messari/ai`,
    params: [
      { key: 'question', value: 'What is the latest on Bitcoin?', enabled: true, description: 'Natural language question' },
    ],
  },
  {
    id: 'messari-asset-details',
    label: 'Messari asset details',
    method: 'GET',
    url: `${base}/messari/assets/details`,
    params: [
      { key: 'slugs', value: 'bitcoin,ethereum', enabled: true, description: 'Comma-separated asset slugs' },
    ],
  },
  {
    id: 'messari-ath',
    label: 'Messari all-time highs',
    method: 'GET',
    url: `${base}/messari/ath`,
    params: [
      { key: 'slugs', value: 'bitcoin,ethereum,solana', enabled: true, description: 'Comma-separated asset slugs' },
    ],
  },
  {
    id: 'messari-roi',
    label: 'Messari ROI',
    method: 'GET',
    url: `${base}/messari/roi`,
    params: [
      { key: 'slugs', value: 'bitcoin,ethereum', enabled: true, description: 'Comma-separated asset slugs' },
    ],
  },
  {
    id: 'messari-mindshare-gainers',
    label: 'Messari mindshare gainers',
    method: 'GET',
    url: `${base}/messari/mindshare-gainers`,
    params: [
      { key: 'period', value: '24h', enabled: true, description: '24h (default) or 7d' },
    ],
  },
  {
    id: 'messari-mindshare-losers',
    label: 'Messari mindshare losers',
    method: 'GET',
    url: `${base}/messari/mindshare-losers`,
    params: [
      { key: 'period', value: '24h', enabled: true, description: '24h (default) or 7d' },
    ],
  },
  {
    id: 'messari-signal',
    label: 'Messari signal (social intelligence)',
    method: 'GET',
    url: `${base}/messari/signal`,
    params: [
      { key: 'limit', value: '20', enabled: true, description: 'Max results' },
    ],
  },
  {
    id: 'messari-news',
    label: 'Messari news feed',
    method: 'GET',
    url: `${base}/messari/news`,
    params: [
      { key: 'assetSlugs', value: '', enabled: false, description: 'Filter by asset slugs (e.g. bitcoin,solana)' },
      { key: 'limit', value: '10', enabled: true, description: 'Max results' },
    ],
  },
  {
    id: 'messari-token-unlocks',
    label: 'Messari token unlock events',
    method: 'GET',
    url: `${base}/messari/token-unlocks`,
    params: [
      { key: 'assetId', value: 'arbitrum', enabled: true, description: 'Messari asset ID (e.g. arbitrum, aptos)' },
    ],
  },
  {
    id: 'messari-timeseries',
    label: 'Messari timeseries (price)',
    method: 'GET',
    url: `${base}/messari/timeseries`,
    params: [
      { key: 'assetId', value: 'bitcoin', enabled: true, description: 'Asset slug (e.g. bitcoin, ethereum)' },
      { key: 'datasetSlug', value: 'price', enabled: true, description: 'Dataset (e.g. price, volume)' },
      { key: 'granularity', value: '1d', enabled: true, description: '5m, 15m, 1h, 1d' },
    ],
  },
  {
    id: 'messari-fundraising',
    label: 'Messari fundraising rounds',
    method: 'GET',
    url: `${base}/messari/fundraising`,
    params: [
      { key: 'limit', value: '10', enabled: true, description: 'Max results' },
      { key: 'roundTypes', value: '', enabled: false, description: 'seed, series-a, series-b, etc.' },
    ],
  },
  {
    id: 'messari-fundraising-investors',
    label: 'Messari fundraising investors',
    method: 'GET',
    url: `${base}/messari/fundraising/investors`,
    params: [
      { key: 'limit', value: '10', enabled: true, description: 'Max results' },
    ],
  },
  {
    id: 'messari-stablecoins',
    label: 'Messari stablecoins',
    method: 'GET',
    url: `${base}/messari/stablecoins`,
    params: [
      { key: 'limit', value: '20', enabled: true, description: 'Max results' },
    ],
  },
  {
    id: 'messari-networks',
    label: 'Messari networks',
    method: 'GET',
    url: `${base}/messari/networks`,
    params: [
      { key: 'limit', value: '20', enabled: true, description: 'Max results' },
    ],
  },
  {
    id: 'messari-x-users',
    label: 'Messari X-users (influencers)',
    method: 'GET',
    url: `${base}/messari/x-users`,
    params: [
      { key: 'limit', value: '20', enabled: true, description: 'Max results' },
    ],
  },
];
};

/** Group slug and display name for example flow grouping on /examples. */
export interface ExampleFlowGroup {
  slug: string;
  name: string;
  description?: string;
  count: number;
}

/** Derive group from flow id/url for grouping on Examples page. */
export function getFlowGroup(flow: ExampleFlowPreset): { slug: string; name: string } {
  const id = flow.id.toLowerCase();
  const url = flow.url;
  const nansenBase = getNansenBaseUrl();
  const purchBase = getPurchVaultBaseUrl();
  if (url.includes(new URL(nansenBase).origin)) return { slug: 'nansen', name: 'Nansen' };
  if (url.includes(new URL(purchBase).origin)) return { slug: 'purch-vault', name: 'Purch Vault' };
  if (id.startsWith('nansen-')) return { slug: 'nansen', name: 'Nansen' };
  if (id.startsWith('purch-')) return { slug: 'purch-vault', name: 'Purch Vault' };
  if (id.startsWith('binance-') || id === 'correlation-matrix') return { slug: 'binance', name: 'Binance' };
  if (id.startsWith('kraken-')) return { slug: 'kraken', name: 'Kraken' };
  if (id.startsWith('kucoin-')) return { slug: 'kucoin', name: 'KuCoin' };
  if (id.startsWith('okx-')) return { slug: 'okx', name: 'OKX' };
  if (id.startsWith('8004scan-')) return { slug: '8004scan', name: '8004scan' };
  if (id.startsWith('8004-')) return { slug: '8004', name: '8004' };
  if (id.startsWith('coingecko-')) return { slug: 'coingecko', name: 'CoinGecko' };
  if (id.startsWith('coinmarketcap-')) return { slug: 'coinmarketcap', name: 'CoinMarketCap' };
  if (id.startsWith('messari-')) return { slug: 'messari', name: 'Messari' };
  if (id.startsWith('x-') && (id === 'x-feed' || id === 'x-user' || id === 'x-search-recent')) return { slug: 'x', name: 'X (Twitter)' };
  if (id.startsWith('jupiter-')) return { slug: 'jupiter', name: 'Jupiter' };
  if (id.startsWith('squid-')) return { slug: 'squid', name: 'Squid' };
  if (id.startsWith('heylol-')) return { slug: 'heylol', name: 'HeyLol' };
  const tokenDexIds = ['token-risk', 'token-risk-alerts', 'token-statistic', 'token-report', 'token-god-mode', 'bubblemaps-maps', 'dexscreener', 'trending-jupiter'];
  if (tokenDexIds.some((t) => id === t)) return { slug: 'tokens-dex', name: 'Tokens & DEX' };
  return { slug: 'syra-core', name: 'Syra Core' };
}

/** All groups with flow counts for the Examples landing page. */
export function getExampleFlowGroups(): ExampleFlowGroup[] {
  const flows = getExampleFlows();
  const bySlug = new Map<string, { name: string; count: number }>();
  for (const f of flows) {
    const { slug, name } = getFlowGroup(f);
    const cur = bySlug.get(slug);
    if (!cur) bySlug.set(slug, { name, count: 1 });
    else cur.count += 1;
  }
  const order = ['syra-core', 'tokens-dex', 'binance', '8004', '8004scan', 'kraken', 'kucoin', 'okx', 'coingecko', 'coinmarketcap', 'messari', 'nansen', 'x', 'jupiter', 'squid', 'purch-vault', 'heylol'];
  const result: ExampleFlowGroup[] = [];
  for (const slug of order) {
    const cur = bySlug.get(slug);
    if (cur) result.push({ slug, name: cur.name, count: cur.count });
  }
  const remaining = [...bySlug.entries()].filter(([s]) => !order.includes(s));
  remaining.forEach(([slug, { name, count }]) => result.push({ slug, name, count }));
  return result;
}

/** Flows for a single group (for /examples/:groupSlug detail page). */
export function getExampleFlowsForGroup(groupSlug: string): ExampleFlowPreset[] {
  const flows = getExampleFlows();
  return flows.filter((f) => getFlowGroup(f).slug === groupSlug);
}

/** Number of example flows to show on the Request Builder; rest are on /examples. */
export const EXAMPLE_FLOWS_VISIBLE_COUNT = 5;

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

// Always route through Syra's backend proxy so the playground can call any external x402 API.
// The proxy at api.syraa.fun/api/playground-proxy forwards to any target URL passed in the body.
function getPlaygroundProxyUrl(_targetUrl: string): string {
  return `${getApiBaseUrl()}/api/playground-proxy`;
}

// API endpoints list (unversioned paths; resolved at runtime for dev localhost). Nansen: direct api.nansen.ai.
// Aligned with api/index.js x402Paths and /.well-known/x402 discovery.
function getApiEndpoints(): string[] {
  const base = getApiBaseUrl();
  const nansenBase = getNansenBaseUrl();
  return [
    `${base}/brain`,
    `${base}/news`,
    `${base}/signal`,
    `${base}/sentiment`,
    `${base}/event`,
    `${base}/trending-headline`,
    `${base}/sundown-digest`,
    `${base}/check-status`,
    `${base}/mpp/v1/check-status`,
    `${base}/exa-search`,
    `${base}/crawl`,
    `${base}/browser-use`,
    `${base}/analytics/summary`,
    `${base}/smart-money`,
    `${base}/dexscreener`,
    `${base}/token-god-mode`,
    `${base}/trending-jupiter`,
    `${base}/jupiter/swap/order`,
    `${base}/squid/route`,
    `${base}/squid/status`,
    `${base}/token-report`,
    `${base}/token-statistic`,
    `${base}/token-risk/alerts`,
    `${base}/bubblemaps/maps`,
    `${base}/binance/correlation`,
    `${base}/binance/correlation-matrix`,
    `${base}/binance/spot/ticker/24hr`,
    `${base}/binance/spot/depth`,
    `${base}/binance/spot/exchange-info`,
    `${base}/binance/spot/account`,
    `${base}/binance/spot/order`,
    `${base}/kraken/ticker`,
    `${base}/kraken/orderbook`,
    `${base}/kraken/ohlc`,
    `${base}/kraken/trades`,
    `${base}/kraken/status`,
    `${base}/kraken/server-time`,
    `${base}/kucoin/ticker`,
    `${base}/kucoin/stats`,
    `${base}/kucoin/orderbook`,
    `${base}/kucoin/trades`,
    `${base}/kucoin/candles`,
    `${base}/kucoin/symbols`,
    `${base}/kucoin/currencies`,
    `${base}/kucoin/server-time`,
    `${base}/okx/ticker`,
    `${base}/okx/tickers`,
    `${base}/okx/books`,
    `${base}/okx/candles`,
    `${base}/okx/trades`,
    `${base}/okx/funding-rate`,
    `${base}/okx/open-interest`,
    `${base}/okx/mark-price`,
    `${base}/okx/time`,
    `${base}/okx/dex/price`,
    `${base}/okx/dex/prices`,
    `${base}/okx/dex/kline`,
    `${base}/okx/dex/trades`,
    `${base}/okx/dex/index`,
    `${base}/okx/dex/signal-chains`,
    `${base}/okx/dex/signal-list`,
    `${base}/okx/dex/memepump-chains`,
    `${base}/okx/dex/memepump-tokens`,
    `${base}/okx/dex/memepump-token-details`,
    `${base}/okx/dex/memepump-token-dev-info`,
    `${base}/okx/dex/memepump-similar-tokens`,
    `${base}/okx/dex/memepump-token-bundle-info`,
    `${base}/okx/dex/memepump-aped-wallet`,
    `${base}/coingecko/simple-price`,
    `${base}/coingecko/onchain/token-price`,
    `${base}/coingecko/onchain/search-pools`,
    `${base}/coingecko/onchain/trending-pools`,
    `${base}/coingecko/onchain/token`,
    `${base}/coinmarketcap`,
    `${base}/8004/stats`,
    `${base}/8004/leaderboard`,
    `${base}/8004/agents/search`,
    `${base}/8004/register-agent`,
    `${base}/8004/agent-by-wallet`,
    `${base}/8004scan/stats`,
    `${base}/8004scan/chains`,
    `${base}/8004scan/agents`,
    `${base}/8004scan/agents/search`,
    `${base}/8004scan/agent`,
    `${base}/8004scan/feedbacks`,
    `${base}/messari/ai`,
    `${base}/messari/assets`,
    `${base}/messari/assets/details`,
    `${base}/messari/assets/metrics`,
    `${base}/messari/ath`,
    `${base}/messari/roi`,
    `${base}/messari/timeseries`,
    `${base}/messari/signal`,
    `${base}/messari/mindshare-gainers`,
    `${base}/messari/mindshare-losers`,
    `${base}/messari/news`,
    `${base}/messari/token-unlocks`,
    `${base}/messari/token-unlocks/assets`,
    `${base}/messari/token-unlocks/vesting`,
    `${base}/messari/fundraising`,
    `${base}/messari/fundraising/investors`,
    `${base}/messari/fundraising/projects`,
    `${base}/messari/fundraising/mna`,
    `${base}/messari/stablecoins`,
    `${base}/messari/networks`,
    `${base}/messari/x-users`,
    `${base}/heylol/feed`,
    `${base}/heylol/profile/me`,
    `${base}/heylol/search`,
    `${nansenBase}/api/v1/profiler/address/current-balance`,
    `${nansenBase}/api/v1/smart-money/netflow`,
    `${nansenBase}/api/v1/smart-money/holdings`,
    `${nansenBase}/api/v1/tgm/holders`,
  ];
}

// x402 only supports GET and POST methods
const SUPPORTED_METHODS: HttpMethod[] = ['GET', 'POST'];

/** Default method when detection hasn't run yet (e.g. example flow). Detection uses 402/405 from actual requests. */
export function getDefaultMethodForUrl(url: string): HttpMethod {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (path === '/brain') return 'POST'; // Brain supports GET (query) and POST (body); default POST
    if (path === '/binance/spot/order') return 'POST'; // Place order is POST
    if (path === '/messari/ai') return 'POST'; // Messari AI chat is POST
  } catch {
    // ignore
  }
  return 'GET';
}

/** Known Syra API GET query param names and API descriptions by path (for placeholder text) */
function getKnownQueryParamsForPath(baseUrl: string): RequestParam[] | null {
  try {
    const path = new URL(baseUrl).pathname.toLowerCase();
    const known: Record<string, RequestParam[]> = {
      '/dashboard-summary': [{ key: 'period', value: '1D', enabled: true, description: '1H, 4H, 1D, 1W' }],
      '/binance-ticker': [],
      '/x/feed': [
        { key: 'username', value: 'syra_agent', enabled: true, description: 'X username' },
        { key: 'max_results', value: '5', enabled: true, description: 'Tweets to return (3–20)' },
      ],
      '/x/user': [{ key: 'username', value: 'syra_agent', enabled: true, description: 'X username (without @)' }],
      '/x/search/recent': [
        { key: 'query', value: 'crypto lang:en', enabled: true, description: 'Search query' },
        { key: 'max_results', value: '10', enabled: true, description: '10–100' },
      ],
      '/preview/news': [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
      '/preview/sentiment': [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
      '/preview/signal': [{ key: 'token', value: 'bitcoin', enabled: true, description: 'e.g. bitcoin, solana' }],
      '/news': [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
      '/event': [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
      '/sentiment': [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
      '/trending-headline': [{ key: 'ticker', value: 'general', enabled: true, description: "e.g. BTC, ETH or 'general'" }],
      '/sundown-digest': [],
      '/check-status': [],
      '/mpp/v1/check-status': [],
      '/brain': [{ key: 'question', value: 'What is the latest BTC news?', enabled: true, description: 'Natural language question (e.g. trending pools on Solana, BTC price)' }],
      '/token-statistic': [],
      '/token-risk/alerts': [
        { key: 'rugScoreMin', value: '80', enabled: true, description: 'Min normalised risk score (0-100)' },
        { key: 'source', value: 'new_tokens,recent,trending,verified', enabled: true, description: 'Comma-separated sources' },
        { key: 'limit', value: '20', enabled: true, description: 'Max tokens to check (1-50)' },
      ],
      '/analytics/summary': [],
      '/signal': [{ key: 'token', value: 'bitcoin', enabled: true, description: 'e.g. solana, bitcoin' }],
      '/exa-search': [{ key: 'query', value: 'latest crypto news', enabled: true, description: 'e.g. latest news on Nvidia, crypto market' }],
      '/crawl': [
        { key: 'url', value: 'https://blog.cloudflare.com/', enabled: true, description: 'Starting URL to crawl (required)' },
        { key: 'limit', value: '20', enabled: true, description: 'Max pages (default 20, max 500)' },
        { key: 'depth', value: '2', enabled: true, description: 'Max link depth (default 2)' },
      ],
      '/browser-use': [
        { key: 'task', value: 'What is the top post on Hacker News right now?', enabled: true, description: 'Natural language task for the browser agent (required)' },
        { key: 'start_url', value: '', enabled: false, description: 'Optional start URL' },
      ],
      '/messari/ai': [{ key: 'question', value: 'What is the latest on Bitcoin?', enabled: true, description: 'Natural language question about crypto' }],
      '/messari/assets': [
        { key: 'limit', value: '20', enabled: true, description: 'Max results' },
        { key: 'assetSlugs', value: '', enabled: false, description: 'Filter by slugs (e.g. bitcoin,ethereum)' },
      ],
      '/messari/assets/details': [{ key: 'slugs', value: 'bitcoin,ethereum', enabled: true, description: 'Comma-separated asset slugs' }],
      '/messari/assets/metrics': [],
      '/messari/ath': [{ key: 'slugs', value: 'bitcoin,ethereum,solana', enabled: true, description: 'Comma-separated asset slugs' }],
      '/messari/roi': [{ key: 'slugs', value: 'bitcoin,ethereum', enabled: true, description: 'Comma-separated asset slugs' }],
      '/messari/timeseries': [
        { key: 'assetId', value: 'bitcoin', enabled: true, description: 'Asset ID or slug (e.g. bitcoin, ethereum)' },
        { key: 'datasetSlug', value: 'price', enabled: true, description: 'Dataset slug (e.g. price, volume)' },
        { key: 'granularity', value: '1d', enabled: true, description: '5m, 15m, 1h, 1d' },
      ],
      '/messari/signal': [{ key: 'limit', value: '20', enabled: true, description: 'Max results' }],
      '/messari/mindshare-gainers': [{ key: 'period', value: '24h', enabled: true, description: '24h or 7d' }],
      '/messari/mindshare-losers': [{ key: 'period', value: '24h', enabled: true, description: '24h or 7d' }],
      '/messari/news': [
        { key: 'assetSlugs', value: '', enabled: false, description: 'Filter by asset slugs' },
        { key: 'limit', value: '10', enabled: true, description: 'Max results' },
      ],
      '/messari/token-unlocks': [{ key: 'assetId', value: '', enabled: true, description: 'Messari asset ID (required)' }],
      '/messari/token-unlocks/assets': [{ key: 'limit', value: '20', enabled: true, description: 'Max results' }],
      '/messari/token-unlocks/vesting': [{ key: 'assetId', value: 'arbitrum', enabled: true, description: 'Messari asset ID (e.g. arbitrum, aptos)' }],
      '/messari/fundraising': [
        { key: 'limit', value: '10', enabled: true, description: 'Max results' },
        { key: 'roundTypes', value: '', enabled: false, description: 'seed, series-a, series-b, etc.' },
      ],
      '/messari/fundraising/investors': [{ key: 'limit', value: '10', enabled: true, description: 'Max results' }],
      '/messari/fundraising/projects': [{ key: 'limit', value: '20', enabled: true, description: 'Max results' }],
      '/messari/fundraising/mna': [{ key: 'limit', value: '10', enabled: true, description: 'Max results' }],
      '/messari/stablecoins': [{ key: 'limit', value: '20', enabled: true, description: 'Max results' }],
      '/messari/networks': [{ key: 'limit', value: '20', enabled: true, description: 'Max results' }],
      '/messari/x-users': [{ key: 'limit', value: '20', enabled: true, description: 'Max results' }],
      '/token-report': [{ key: 'address', value: '', enabled: true, description: 'Token contract address' }],
      '/token-god-mode': [{ key: 'tokenAddress', value: '', enabled: true, description: 'Token address for research' }],
      '/x402/vault/search': [
        { key: 'q', value: 'development', enabled: true, description: 'Search query (optional)' },
        { key: 'category', value: 'development', enabled: false, description: 'marketing, development, automation, career, ios, productivity' },
        { key: 'productType', value: '', enabled: false, description: 'skill, knowledge, persona' },
        { key: 'limit', value: '30', enabled: true, description: 'Items per page (1-100)' },
      ],
      '/x402/vault/buy': [
        { key: 'slug', value: 'faith', enabled: true, description: 'Item slug from search (required)' },
        { key: 'walletAddress', value: '', enabled: true, description: 'Your Solana wallet (payer)' },
        { key: 'email', value: 'user@example.com', enabled: true, description: 'Email for receipt' },
      ],
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
      '/bubblemaps/maps': [{ key: 'address', value: '', enabled: true, description: 'Solana token contract address' }],
      '/binance/correlation': [{ key: 'symbol', value: 'BTCUSDT', enabled: true, description: 'e.g. BTCUSDT, ETHUSDT' }],
      '/binance/correlation-matrix': [],
      '/binance/spot/ticker/24hr': [{ key: 'symbol', value: 'BTCUSDT', enabled: false, description: 'Optional; omit for all' }],
      '/binance/spot/depth': [
        { key: 'symbol', value: 'BTCUSDT', enabled: true, description: 'e.g. BTCUSDT' },
        { key: 'limit', value: '100', enabled: true, description: '5, 10, 20, 50, 100, 500, 1000' },
      ],
      '/binance/spot/exchange-info': [{ key: 'symbol', value: 'BTCUSDT', enabled: false, description: 'Optional' }],
      '/binance/spot/account': [],
      '/binance/spot/order': [
        { key: 'symbol', value: 'BTCUSDT', enabled: true, description: 'Trading pair' },
        { key: 'side', value: 'BUY', enabled: true, description: 'BUY or SELL' },
        { key: 'type', value: 'MARKET', enabled: true, description: 'MARKET, LIMIT, etc.' },
        { key: 'quantity', value: '0.001', enabled: true, description: 'Base quantity or quoteOrderQty' },
      ],
      '/kraken/ticker': [{ key: 'pair', value: 'BTCUSD', enabled: true, description: 'Pair(s) comma-separated (default BTCUSD)' }],
      '/kraken/orderbook': [
        { key: 'pair', value: 'BTCUSD', enabled: true, description: 'Pair (default BTCUSD)' },
        { key: 'count', value: '25', enabled: true, description: 'Depth (default 25)' },
      ],
      '/kraken/ohlc': [
        { key: 'pair', value: 'BTCUSD', enabled: true, description: 'Pair (default BTCUSD)' },
        { key: 'interval', value: '60', enabled: true, description: 'Minutes (default 60)' },
      ],
      '/kraken/trades': [
        { key: 'pair', value: 'BTCUSD', enabled: true, description: 'Pair (default BTCUSD)' },
        { key: 'count', value: '100', enabled: true, description: 'Count (default 100)' },
      ],
      '/kraken/status': [],
      '/kraken/server-time': [],
      '/kucoin/ticker': [{ key: 'symbol', value: 'BTC-USDT', enabled: false, description: 'Optional; omit for all tickers' }],
      '/kucoin/stats': [{ key: 'symbol', value: 'BTC-USDT', enabled: true, description: 'Symbol (default BTC-USDT)' }],
      '/kucoin/orderbook': [
        { key: 'symbol', value: 'BTC-USDT', enabled: true, description: 'Symbol (default BTC-USDT)' },
        { key: 'level', value: 'level2_20', enabled: true, description: 'level2_20 or level2_100' },
      ],
      '/kucoin/trades': [{ key: 'symbol', value: 'BTC-USDT', enabled: true, description: 'Symbol (default BTC-USDT)' }],
      '/kucoin/candles': [
        { key: 'symbol', value: 'BTC-USDT', enabled: true, description: 'Symbol (default BTC-USDT)' },
        { key: 'type', value: '1min', enabled: true, description: '1min, 1hour, 1day, etc.' },
        { key: 'pageSize', value: '100', enabled: true, description: 'Candles (max 1500)' },
      ],
      '/kucoin/symbols': [],
      '/kucoin/currencies': [],
      '/kucoin/server-time': [],
      '/okx/ticker': [{ key: 'instId', value: 'BTC-USDT', enabled: true, description: 'Instrument ID (e.g. BTC-USDT, ETH-USDT-SWAP)' }],
      '/okx/tickers': [{ key: 'instType', value: 'SPOT', enabled: true, description: 'SPOT, SWAP, FUTURES, OPTION, MARGIN' }],
      '/okx/books': [
        { key: 'instId', value: 'BTC-USDT', enabled: true, description: 'Instrument ID (default BTC-USDT)' },
        { key: 'sz', value: '20', enabled: true, description: 'Depth (default 20, max 400)' },
      ],
      '/okx/candles': [
        { key: 'instId', value: 'BTC-USDT', enabled: true, description: 'Instrument ID' },
        { key: 'bar', value: '1H', enabled: true, description: '1m, 3m, 5m, 15m, 30m, 1H, 2H, 4H, 6H, 12H, 1D, 1W, 1M' },
        { key: 'limit', value: '100', enabled: true, description: 'Candles (default 100, max 300)' },
      ],
      '/okx/trades': [
        { key: 'instId', value: 'BTC-USDT', enabled: true, description: 'Instrument ID' },
        { key: 'limit', value: '100', enabled: true, description: 'Trades (default 100, max 500)' },
      ],
      '/okx/funding-rate': [{ key: 'instId', value: 'BTC-USDT-SWAP', enabled: true, description: 'Perpetual swap instId' }],
      '/okx/open-interest': [{ key: 'instId', value: 'BTC-USDT-SWAP', enabled: true, description: 'Perpetual swap instId' }],
      '/okx/mark-price': [{ key: 'instId', value: 'BTC-USDT-SWAP', enabled: true, description: 'Derivatives instId' }],
      '/okx/time': [],
      '/okx/dex/price': [
        { key: 'address', value: '', enabled: true, description: 'Token contract address' },
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain (ethereum, solana, base)' },
      ],
      '/okx/dex/prices': [
        { key: 'tokens', value: '', enabled: true, description: 'Comma chainIndex:address or addresses' },
        { key: 'chain', value: 'solana', enabled: false, description: 'Default chain' },
      ],
      '/okx/dex/kline': [
        { key: 'address', value: '', enabled: true, description: 'Token contract address' },
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
        { key: 'bar', value: '1H', enabled: true, description: '1m, 1H, 1D' },
        { key: 'limit', value: '100', enabled: true, description: 'Max 299' },
      ],
      '/okx/dex/trades': [
        { key: 'address', value: '', enabled: true, description: 'Token contract address' },
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
        { key: 'limit', value: '100', enabled: true, description: 'Max 500' },
      ],
      '/okx/dex/index': [
        { key: 'address', value: '', enabled: true, description: 'Token address (empty for native)' },
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
      ],
      '/okx/dex/signal-chains': [],
      '/okx/dex/signal-list': [
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
        { key: 'walletType', value: '1,2,3', enabled: false, description: '1=Smart Money, 2=KOL, 3=Whale' },
        { key: 'minAmountUsd', value: '', enabled: false, description: 'Min USD' },
      ],
      '/okx/dex/memepump-chains': [],
      '/okx/dex/memepump-tokens': [
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
        { key: 'stage', value: 'NEW', enabled: true, description: 'NEW, MIGRATING, MIGRATED' },
      ],
      '/okx/dex/memepump-token-details': [
        { key: 'address', value: '', enabled: true, description: 'Token address' },
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
      ],
      '/okx/dex/memepump-token-dev-info': [
        { key: 'address', value: '', enabled: true, description: 'Token address' },
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
      ],
      '/okx/dex/memepump-similar-tokens': [
        { key: 'address', value: '', enabled: true, description: 'Token address' },
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
      ],
      '/okx/dex/memepump-token-bundle-info': [
        { key: 'address', value: '', enabled: true, description: 'Token address' },
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
      ],
      '/okx/dex/memepump-aped-wallet': [
        { key: 'address', value: '', enabled: true, description: 'Token address' },
        { key: 'chain', value: 'solana', enabled: true, description: 'Chain' },
        { key: 'wallet', value: '', enabled: false, description: 'Wallet to highlight' },
      ],
      '/jupiter/swap/order': [
        { key: 'inputMint', value: 'So11111111111111111111111111111111111111112', enabled: true, description: 'Input token mint (SOL wrapped)' },
        { key: 'outputMint', value: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', enabled: true, description: 'Output token mint (USDC)' },
        { key: 'amount', value: '1000000', enabled: true, description: 'Amount in smallest units (1M lamports = 0.001 SOL)' },
        { key: 'taker', value: '', enabled: true, description: 'Your wallet public key (executes the swap)' },
      ],
      '/squid/route': [
        { key: 'fromAddress', value: '', enabled: true, description: 'Source chain wallet address' },
        { key: 'fromChain', value: '8453', enabled: true, description: 'Source chain ID (e.g. 8453 Base, 42161 Arbitrum)' },
        { key: 'fromToken', value: '', enabled: true, description: 'Source token contract address' },
        { key: 'fromAmount', value: '1000000', enabled: true, description: 'Amount in smallest units' },
        { key: 'toChain', value: '42161', enabled: true, description: 'Destination chain ID' },
        { key: 'toToken', value: '', enabled: true, description: 'Destination token contract address' },
        { key: 'toAddress', value: '', enabled: true, description: 'Destination wallet address' },
        { key: 'slippage', value: '1', enabled: true, description: 'Slippage tolerance percent' },
      ],
      '/squid/status': [
        { key: 'transactionId', value: '', enabled: true, description: 'Source chain transaction hash' },
        { key: 'requestId', value: '', enabled: true, description: 'x-request-id from route response' },
        { key: 'fromChainId', value: '', enabled: true, description: 'Source chain ID' },
        { key: 'toChainId', value: '', enabled: true, description: 'Destination chain ID' },
        { key: 'quoteId', value: '', enabled: false, description: 'quoteId from route (Coral V2)' },
      ],
      '/coingecko/simple-price': [
        { key: 'symbols', value: 'btc,eth,sol', enabled: true, description: 'Comma-separated symbols (or use ids)' },
        { key: 'ids', value: 'bitcoin', enabled: false, description: 'Comma-separated CoinGecko ids (e.g. bitcoin,ethereum); default when symbols omitted' },
        { key: 'vs_currencies', value: 'usd', enabled: true, description: 'e.g. usd' },
        { key: 'include_market_cap', value: 'true', enabled: false, description: 'true/false' },
        { key: 'include_24hr_vol', value: 'true', enabled: false, description: 'true/false' },
        { key: 'include_24hr_change', value: 'true', enabled: false, description: 'true/false' },
      ],
      '/coingecko/onchain/token-price': [
        { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana, eth' },
        { key: 'address', value: '', enabled: true, description: 'Token contract address (comma for multiple)' },
        { key: 'include_market_cap', value: 'true', enabled: false, description: 'true/false' },
      ],
      '/coingecko/onchain/search-pools': [
        { key: 'query', value: 'pump', enabled: true, description: 'Search query (name, symbol, or contract address)' },
        { key: 'network', value: 'solana', enabled: true, description: 'e.g. solana, base' },
        { key: 'page', value: '1', enabled: false, description: 'Page number' },
        { key: 'include', value: 'base_token,quote_token,dex', enabled: false, description: 'Comma-separated' },
      ],
      '/coingecko/onchain/trending-pools': [
        { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana' },
        { key: 'duration', value: '5m', enabled: true, description: 'e.g. 5m' },
        { key: 'page', value: '1', enabled: false, description: 'Page number' },
      ],
      '/coingecko/onchain/token': [
        { key: 'network', value: 'base', enabled: true, description: 'e.g. base, solana, eth' },
        { key: 'address', value: '', enabled: true, description: 'Token contract address' },
        { key: 'include', value: 'top_pools', enabled: false, description: 'e.g. top_pools' },
        { key: 'include_composition', value: 'true', enabled: false, description: 'true/false' },
      ],
      '/8004/stats': [],
      '/8004/leaderboard': [
        { key: 'minTier', value: '2', enabled: false, description: 'Min trust tier (0-4)' },
        { key: 'limit', value: '50', enabled: true, description: 'Max results' },
        { key: 'collection', value: '', enabled: false, description: 'Collection pubkey (optional)' },
      ],
      '/8004/agents/search': [
        { key: 'owner', value: '', enabled: false, description: 'Owner pubkey' },
        { key: 'creator', value: '', enabled: false, description: 'Creator pubkey' },
        { key: 'limit', value: '20', enabled: true, description: 'Max results' },
        { key: 'offset', value: '0', enabled: false, description: 'Offset' },
      ],
      '/8004/agent-by-wallet': [],
      '/8004scan/stats': [],
      '/8004scan/chains': [],
      '/8004scan/agents': [
        { key: 'page', value: '1', enabled: false, description: 'Page number' },
        { key: 'limit', value: '25', enabled: false, description: 'Per page' },
        { key: 'chainId', value: '', enabled: false, description: 'Chain ID filter' },
        { key: 'ownerAddress', value: '', enabled: false, description: 'Owner address' },
        { key: 'search', value: '', enabled: false, description: 'Search text' },
      ],
      '/8004scan/agents/search': [
        { key: 'q', value: 'trading', enabled: true, description: 'Search query (required)' },
        { key: 'limit', value: '20', enabled: false, description: 'Max results' },
        { key: 'chainId', value: '', enabled: false, description: 'Chain ID filter' },
      ],
      '/8004scan/agent': [
        { key: 'chainId', value: '', enabled: true, description: 'Chain ID (required)' },
        { key: 'tokenId', value: '', enabled: true, description: 'Token ID (required)' },
      ],
      '/8004scan/feedbacks': [],
      '/heylol/feed': [],
      '/heylol/profile/me': [],
      '/heylol/search': [{ key: 'q', value: '', enabled: true, description: 'Search query' }],
      '/coinmarketcap': [
        { key: 'endpoint', value: 'quotes-latest', enabled: true, description: 'quotes-latest, listing-latest, dex-pairs-quotes-latest, dex-search, mcp' },
        { key: 'id', value: '1', enabled: true, description: 'CMC id (e.g. 1 for Bitcoin, 1027 for Ethereum)' },
        { key: 'slug', value: 'bitcoin', enabled: false, description: 'Slug for quotes/listing (e.g. bitcoin)' },
        { key: 'symbol', value: 'BTC', enabled: false, description: 'Symbol(s) for quotes/listing (e.g. BTC,ETH)' },
        { key: 'start', value: '1', enabled: true, description: 'Start rank for listing (default 1)' },
        { key: 'limit', value: '10', enabled: true, description: 'Limit for listing (default 10)' },
        { key: 'convert', value: 'USD', enabled: true, description: 'Convert to (default USD)' },
        { key: 'q', value: 'pepe', enabled: true, description: 'Search query for dex-search (e.g. pepe, sol)' },
        { key: 'chain_id', value: '8453', enabled: true, description: 'Chain id for DEX (e.g. 8453 for Base)' },
        { key: 'pair_address', value: '0x3548029694fbb241d45fb24ba0cd9c9d4e745f16', enabled: true, description: 'Pair address for DEX pairs quotes (WETH/USDC on Base)' },
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
const PAYMENT_HEADER_VERSION_KEY = 'x402_payment_version'; // 1 = X-PAYMENT only, 2 = PAYMENT-SIGNATURE only (avoids nginx "header too large")
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

/** Payload for playground share API (method, url, params, headers, body, optional sharedBy*). */
interface SharePayload {
  method: string;
  url: string;
  params: RequestParam[];
  headers: RequestHeader[];
  body: string;
  sharedByWallet?: string | null;
  sharedByChain?: 'solana' | 'base' | null;
  sharedByEmail?: string | null;
}

/** POST request config to playground share API; returns slug or null. */
async function saveShareToApi(payload: SharePayload): Promise<string | null> {
  try {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/playground/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.slug ?? null;
  } catch {
    return null;
  }
}

/** GET shared request config by slug. */
async function loadShareFromApi(slug: string): Promise<SharePayload | null> {
  try {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/playground/share/${slug}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

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
  const walletContext = useWalletContext();
  const connection = walletContext.connection;
  
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

  // Extract params from 402 response extensions (input/query only).
  // Handles two bazaar schema layouts:
  //   1) Flat: schema.properties = { ticker: {...}, query: {...} }  (Syra APIs)
  //   2) Nested: schema.properties.input.properties.body.properties = { symbol: {...} }  (Heurist / external x402 APIs)
  const extractParamsFrom402Response = useCallback((x402Resp: X402Response, baseUrl?: string): RequestParam[] => {
    const params: RequestParam[] = [];

    try {
      const schema = x402Resp.extensions?.bazaar?.schema;
      const bazaarInfo = x402Resp.extensions?.bazaar?.info;
      const exampleInput = bazaarInfo?.input;

      // Try nested schema first: schema.properties.input.properties.body.properties
      const nestedBodySchema = (schema?.properties as any)?.input?.properties?.body;
      const nestedBodyProps = nestedBodySchema?.properties as Record<string, any> | undefined;
      const nestedBodyRequired: string[] = nestedBodySchema?.required ?? [];

      if (nestedBodyProps && Object.keys(nestedBodyProps).length > 0) {
        const exampleBody = exampleInput?.body as Record<string, any> | undefined;
        Object.entries(nestedBodyProps).forEach(([key, prop]) => {
          if (OUTPUT_SCHEMA_KEY_BLOCKLIST.has(key)) return;
          const exampleVal = exampleBody?.[key];
          const schemaDefault = prop && typeof prop === 'object' && 'default' in prop ? prop.default : undefined;
          const defaultValue = exampleVal !== undefined && exampleVal !== ''
            ? String(exampleVal)
            : schemaDefault !== undefined ? String(schemaDefault) : '';
          const desc = prop && typeof prop === 'object' && 'description' in prop
            ? String((prop as { description?: string }).description || '')
            : undefined;
          params.push({
            key,
            value: defaultValue,
            enabled: nestedBodyRequired.includes(key) || false,
            ...(desc ? { description: desc } : {}),
          });
        });
        if (params.length > 0) return params;
      }

      // Flat schema: schema.properties = { ticker: {...}, query: {...} }
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

        // Parse 402 response to extract params, headers, and preferred method.
        // Try POST 402 first (richer schema for body-based APIs), fallback to GET 402.
        const response402 =
          (postResult.status === 402 ? postResult.body : null) ??
          (getResult.status === 402 ? getResult.body : null);

        if (response402) {
          try {
            const jsonData = JSON.parse(response402);
            const parsed = parseX402Response(jsonData);
            if (parsed) {
              // Override method if bazaar info specifies one (e.g. Heurist declares method: "POST")
              const bazaarMethod = parsed.extensions?.bazaar?.info?.input?.method as string | undefined;
              if (bazaarMethod && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(bazaarMethod.toUpperCase())) {
                const preferred = bazaarMethod.toUpperCase() as HttpMethod;
                if (allowed.includes(preferred) || allowed.length === 0) {
                  setMethod(preferred);
                }
              }

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

  // Open Privy's login/connect modal; use chain-aware connect so Phantom is requested for Solana (not Ethereum), avoiding "Unsupported account" when Phantom has Solana selected
  /** Connect wallet for the given chain (or current selected chain). Use the chain the UI is showing so Phantom/multi-chain wallets connect for the right network. */
  const connectWallet = useCallback(
    (chain?: 'solana' | 'base') => {
      walletContext.connectForChain(chain ?? selectedPaymentChain);
    },
    [walletContext, selectedPaymentChain]
  );

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
  const sendRequest = useCallback(async (paymentHeader?: string, requestOverride?: RequestOverride, paymentVersion?: 1 | 2): Promise<number | undefined> => {
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

    // Build URL with params: GET → query string; POST → body (handled below)
    let finalUrl = baseUrl;
    const enabledParams = effectiveParams.filter(p => p.enabled && p.key);
    const isNansen = isNansenUrl(baseUrl);
    if (effectiveMethod === 'GET' && enabledParams.length > 0) {
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
    if (effectiveMethod === 'GET' && pathname === '/exa-search') {
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
    if (effectiveMethod === 'POST' && pathname === '/crawl') {
      const urlVal = enabledParams.find(p => p.key === 'url')?.value?.trim() ?? '';
      if (!urlVal) {
        toast({
          title: 'URL required',
          description: 'Please enter a starting URL in the Params section (e.g. https://blog.cloudflare.com/).',
          variant: 'destructive',
        });
        return undefined;
      }
    }
    if (effectiveMethod === 'POST' && pathname === '/browser-use') {
      const taskVal = enabledParams.find(p => p.key === 'task')?.value?.trim() ?? '';
      if (!taskVal) {
        toast({
          title: 'Task required',
          description: 'Please enter a natural language task in the Params section (e.g. What is the top post on Hacker News?).',
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
      } else if (emptyBody && isPurchVaultBuyUrl(baseUrl)) {
        // Purch Vault buy expects POST body: { slug, walletAddress, email }
        const slugVal = enabledParams.find(p => p.key === 'slug')?.value?.trim() ?? '';
        const walletVal = enabledParams.find(p => p.key === 'walletAddress')?.value?.trim() ?? '';
        const emailVal = enabledParams.find(p => p.key === 'email')?.value?.trim() ?? 'user@example.com';
        bodyToSend = JSON.stringify({ slug: slugVal, walletAddress: walletVal, email: emailVal });
      } else if (emptyBody && pathname === '/exa-search') {
        const queryVal = enabledParams.find(p => p.key === 'query')?.value ?? '';
        bodyToSend = JSON.stringify({ query: queryVal });
      } else if (emptyBody && pathname === '/crawl') {
        const urlVal = enabledParams.find(p => p.key === 'url')?.value ?? '';
        const limitVal = enabledParams.find(p => p.key === 'limit')?.value ?? '20';
        const depthVal = enabledParams.find(p => p.key === 'depth')?.value ?? '2';
        const crawlBody: Record<string, string | number> = { url: urlVal };
        if (limitVal && !Number.isNaN(Number(limitVal))) crawlBody.limit = Number(limitVal);
        if (depthVal && !Number.isNaN(Number(depthVal))) crawlBody.depth = Number(depthVal);
        bodyToSend = JSON.stringify(crawlBody);
      } else if (emptyBody && pathname === '/browser-use') {
        const taskVal = enabledParams.find(p => p.key === 'task')?.value ?? '';
        const startUrlVal = enabledParams.find(p => p.key === 'start_url')?.value?.trim() ?? '';
        const browserUseBody: Record<string, string> = { task: taskVal };
        if (startUrlVal) browserUseBody.start_url = startUrlVal;
        bodyToSend = JSON.stringify(browserUseBody);
      } else if (emptyBody && pathname === '/brain') {
        const questionVal = enabledParams.find(p => p.key === 'question')?.value ?? '';
        bodyToSend = JSON.stringify({ question: questionVal });
      } else if (emptyBody) {
        // Generic fallback: build JSON body from params for any POST endpoint (external x402 APIs, etc.)
        const bodyObj: Record<string, unknown> = {};
        enabledParams.forEach(p => {
          const v = p.value?.trim() ?? '';
          if (v === 'true') bodyObj[p.key] = true;
          else if (v === 'false') bodyObj[p.key] = false;
          else if (v !== '' && !Number.isNaN(Number(v)) && v !== '') bodyObj[p.key] = Number(v);
          else if (v.startsWith('{') || v.startsWith('[')) {
            try { bodyObj[p.key] = JSON.parse(v); } catch { bodyObj[p.key] = v; }
          } else {
            bodyObj[p.key] = v;
          }
        });
        bodyToSend = JSON.stringify(bodyObj);
      }
    }

    // Build headers
    const requestHeaders: Record<string, string> = {};
    effectiveHeaders.filter(h => h.enabled && h.key).forEach(h => {
      requestHeaders[h.key] = h.value;
    });

    // Add a single payment header to avoid "Request Header Or Cookie Too Large" (nginx). v1: X-PAYMENT; v2: PAYMENT-SIGNATURE.
    if (paymentHeader) {
      const version = paymentVersion ?? (typeof localStorage !== 'undefined' ? (localStorage.getItem(PAYMENT_HEADER_VERSION_KEY) === '1' ? 1 : 2) : 2);
      if (version === 1) {
        requestHeaders['X-PAYMENT'] = paymentHeader;
      } else {
        requestHeaders['PAYMENT-SIGNATURE'] = paymentHeader;
      }
    }
    // So production API can apply playground-dev pricing when this wallet is connected
    const payerAddress = walletContext.address ?? walletContext.baseAddress ?? null;
    if (payerAddress) {
      requestHeaders['X-Payer-Address'] = payerAddress;
    }
    // POST with a JSON body needs Content-Type: application/json
    if (effectiveMethod === 'POST' && bodyToSend.trim() && !requestHeaders['Content-Type']) {
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
        saveShareToApi({ method: request.method, url: request.url, headers: request.headers, body: request.body, params: request.params }).then(slug => {
          if (slug) setHistory(prev => prev.map(h => h.id === actualRequestId ? { ...h, shareSlug: slug } : h));
        });
        
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

        // On 402: show toast and set payment details; do not auto-open payment modal so first visit never opens a modal. User opens it by clicking "Pay and retry" or "Connect Wallet".
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
          // Do not auto-open: setIsPaymentModalOpen(true);
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
        saveShareToApi({ method: request.method, url: request.url, headers: request.headers, body: request.body, params: request.params }).then(slug => {
          if (slug) setHistory(prev => prev.map(h => h.id === actualRequestId ? { ...h, shareSlug: slug } : h));
        });
        return fetchResponse.status;
      }

      setStatus('error');
      setHistory(prev => prev.map(h => 
        h.id === actualRequestId ? { ...h, response: apiResponse, status: 'error' } : h
      ));
      saveShareToApi({ method: request.method, url: request.url, headers: request.headers, body: request.body, params: request.params }).then(slug => {
        if (slug) setHistory(prev => prev.map(h => h.id === actualRequestId ? { ...h, shareSlug: slug } : h));
      });
      return fetchResponse.status;

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError');
      const usedProxy = useBackendPlaygroundProxy(finalUrl);
      const hint = isNetworkError
        ? usedProxy
          ? 'The request was sent via our proxy. The connection may have timed out, or the target API may block server-side requests or be unreachable from our server. Try again; if it persists, the API provider may need to allow our proxy.'
          : 'This may be a CORS issue, network connectivity problem, or the server may be unreachable. Make sure the API URL is correct and the server is running.'
        : undefined;

      const errorResponse: ApiResponse = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: JSON.stringify({
          error: 'Request failed',
          message: errorMessage,
          hint,
        }, null, 2),
        time: Date.now() - startTime,
        size: 0,
      };
      setResponse(errorResponse);
      setStatus('error');
      setHistory(prev => prev.map(h => 
        h.id === actualRequestId ? { ...h, response: errorResponse, status: 'error' } : h
      ));
      saveShareToApi({ method: request.method, url: request.url, headers: request.headers, body: request.body, params: request.params }).then(slug => {
        if (slug) setHistory(prev => prev.map(h => h.id === actualRequestId ? { ...h, shareSlug: slug } : h));
      });
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
    // Use preset method when set (e.g. POST for browser-use, crawl); else detect from URL
    const defaultMethod = preset.method ?? getDefaultMethodForUrl(preset.url);
    const defaultBody = preset.body ?? '{\n  \n}';
    setMethod(defaultMethod);
    setUrl(preset.url);
    setParams(effectiveParams.map((p) => ({ ...p })));
    setHeaders(defaultHeaders);
    setBody(defaultBody);
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
    const queryRequiredPaths = ['/exa-search'];
    const urlRequiredPaths = ['/crawl'];
    const taskRequiredPaths = ['/browser-use'];
    const queryValue = (effectiveParams.find((p) => p.key === 'query')?.value ?? '').trim();
    const urlValue = (effectiveParams.find((p) => p.key === 'url')?.value ?? '').trim();
    const taskValue = (effectiveParams.find((p) => p.key === 'task')?.value ?? '').trim();
    const shouldSend =
      (!queryRequiredPaths.includes(pathname) || !!queryValue) &&
      (!urlRequiredPaths.includes(pathname) || !!urlValue) &&
      (!taskRequiredPaths.includes(pathname) || !!taskValue);

    if (shouldSend) {
      setStatus('loading');
      const newId = generateId();
      newRequestIdRef.current = newId;
      const override: RequestOverride = {
        method: defaultMethod,
        url: preset.url,
        params: effectiveParams.map((p) => ({ ...p })),
        headers: defaultHeaders,
        body: defaultBody,
      };
      sendRequest(undefined, override);
      setSelectedHistoryId(newId);
    } else {
      setStatus('idle');
      if (urlRequiredPaths.includes(pathname)) {
        toast({
          title: 'Enter a URL to crawl',
          description: 'Fill in the "url" param above (e.g. https://blog.cloudflare.com/) and click Send.',
        });
      } else if (taskRequiredPaths.includes(pathname)) {
        toast({
          title: 'Enter a browser task',
          description: 'Fill in the "task" param above (e.g. What is the top post on Hacker News?) and click Send.',
        });
      } else {
        toast({
          title: 'Enter your search query',
          description: 'Fill in the "query" param above (e.g. bitcoin insight, latest Nvidia news) and click Send.',
        });
      }
    }
  }, [sendRequest, status]);

  // Try demo - randomly pick an API endpoint and always create new history
  const tryDemo = useCallback(() => {
    // Randomly select an API endpoint
    const endpoints = getApiEndpoints();
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
    const wasSelected = selectedHistoryId === itemId;
    setHistory(prev => prev.filter(item => item.id !== itemId));
    if (wasSelected) {
      setSelectedHistoryId(undefined);
      // Clear request builder and response when the active tab/item is deleted
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
      clonedRequestIdRef.current = null;
      newRequestIdRef.current = null;
    }
  }, [selectedHistoryId]);

  /** Load shared request by slug from API and prefill form. Returns true if loaded. */
  const loadSharedRequest = useCallback(async (slug: string): Promise<boolean> => {
    const data = await loadShareFromApi(slug);
    if (!data) return false;
    setMethod((data.method as HttpMethod) || 'GET');
    setUrl(data.url || '');
    setParams(Array.isArray(data.params) ? data.params.map(p => ({ key: p.key || '', value: p.value ?? '', enabled: p.enabled !== false, ...(p.description ? { description: p.description } : {}) })) : []);
    setHeaders(Array.isArray(data.headers) ? data.headers.map(h => ({ key: h.key || '', value: h.value ?? '', enabled: h.enabled !== false })) : [{ key: 'Content-Type', value: 'application/json', enabled: true }]);
    setBody(typeof data.body === 'string' ? data.body : '{\n  \n}');
    setResponse(undefined);
    setStatus('idle');
    setPaymentDetails(undefined);
    return true;
  }, []);

  /** Create share link for current request (POST to API, return full URL). Optionally includes sharedBy* when wallet is connected. */
  const createShareLink = useCallback(async (): Promise<string | null> => {
    const payload: SharePayload = { method, url, headers, body, params };
    const chain = selectedPaymentChain;
    const walletAddress = chain === 'base' ? walletContext.baseAddress : walletContext.address;
    if (walletAddress) {
      payload.sharedByWallet = walletAddress;
      payload.sharedByChain = chain;
    }
    const slug = await saveShareToApi(payload);
    if (!slug) return null;
    // Update selected history item with shareSlug so that when we navigate to /s/:slug (onAfterShare),
    // the load effect skips and does not overwrite the current response.
    if (selectedHistoryId) {
      setHistory(prev =>
        prev.map(h => (h.id === selectedHistoryId ? { ...h, shareSlug: slug } : h))
      );
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/s/${slug}`;
  }, [method, url, headers, body, params, selectedPaymentChain, selectedHistoryId, walletContext.address, walletContext.baseAddress]);

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

    // For v1, send the raw accept that matches the payment we're making (by payTo then by network)
    const rawV1Accept = (() => {
      if (x402Response?.x402Version !== 1 || !x402Response._rawV1Accepts?.length || !paymentOption?.payTo) return undefined;
      const raw = x402Response._rawV1Accepts as Record<string, any>[];
      const matchByPayTo = raw.find((a: any) => String(a.payTo || '').trim() === String(paymentOption.payTo || '').trim());
      if (matchByPayTo) return matchByPayTo;
      if (isBase) {
        const baseRaw = raw.find((a: any) => a.network === 'base' || String(a.network || '').startsWith('eip155:'));
        return baseRaw ?? raw[0];
      }
      const solanaRaw = raw.find((a: any) => a.network === 'solana' || (typeof a.network === 'string' && a.network.startsWith('solana')));
      return solanaRaw ?? raw[0];
    })();

    // Resource URL (request that got 402) so v2 APIs can verify payment was for this endpoint
    let resourceUrl = url.trim();
    const enabledParams = params.filter((p: { enabled: boolean; key: string }) => p.enabled && p.key);
    if (method === 'GET' && enabledParams.length > 0) {
      const searchParams = new URLSearchParams();
      enabledParams.forEach((p: { key: string; value: string }) => searchParams.append(p.key, p.value));
      resourceUrl += (url.includes('?') ? '&' : '?') + searchParams.toString();
    }

    try {
      let result: Awaited<ReturnType<typeof executePayment>>;
      if (isBase) {
        const signer = await walletContext.getEvmSigner();
        if (!signer) {
          setTransactionStatus({ status: 'failed', error: 'Base wallet not available' });
          return;
        }
        result = await executeBasePayment(signer, paymentOption, resourceUrl);
      } else {
        result = await executePayment(
            {
              connection,
              publicKey: walletContext.publicKey!,
              signTransaction: walletContext.signTransaction,
            },
            paymentOption,
            rawV1Accept,
            resourceUrl
          );
      }

      if (result.success && result.paymentHeader) {
        setTransactionStatus({
          status: 'confirmed',
          hash: result.signature,
        });

        // Store payment header, version, and origin so we only reuse it for the same API
        localStorage.setItem(PAYMENT_HEADER_KEY, result.paymentHeader);
        localStorage.setItem(PAYMENT_HEADER_VERSION_KEY, x402Response?.x402Version === 1 ? '1' : '2');
        const paidOrigin = getRequestOrigin(url);
        if (paidOrigin) localStorage.setItem(PAYMENT_ORIGIN_KEY, paidOrigin);
        
        // Auto-retry: the signed tx is in the header; the API server will submit and verify it.
        const payVersion: 1 | 2 = x402Response?.x402Version === 1 ? 1 : 2;
        setTimeout(async () => {
          setIsPaymentModalOpen(false);
          setTransactionStatus({ status: 'idle' });
          
          const retryStatus = await sendRequest(result.paymentHeader, undefined, payVersion);
          
          localStorage.removeItem(PAYMENT_HEADER_KEY);
          localStorage.removeItem(PAYMENT_HEADER_VERSION_KEY);
          localStorage.removeItem(PAYMENT_ORIGIN_KEY);
          
          if (retryStatus === 200) {
            toast({
              title: "Payment Successful",
              description: "API data has been fetched successfully!",
            });
          }
        }, 1000);
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
  }, [walletContext, paymentOption, connection, sendRequest, x402Response, url, method, params]);

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
      await sendRequest(paymentHeader, undefined, localStorage.getItem(PAYMENT_HEADER_VERSION_KEY) === '1' ? 1 : 2);
      localStorage.removeItem(PAYMENT_HEADER_KEY);
      localStorage.removeItem(PAYMENT_HEADER_VERSION_KEY);
      localStorage.removeItem(PAYMENT_ORIGIN_KEY);
    } else {
      // Stored payment was for a different API or has no origin (legacy); don't send it
      if (paymentHeader && (!storedOrigin || (currentOrigin && storedOrigin !== currentOrigin))) {
        localStorage.removeItem(PAYMENT_HEADER_KEY);
        localStorage.removeItem(PAYMENT_HEADER_VERSION_KEY);
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
    loadSharedRequest,
    createShareLink,

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
