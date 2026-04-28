/**
 * Strict types for the Rise dashboard / screener. Mirrors the shapes returned
 * by the Syra api proxies (see api/routes/uponlyRiseMarket.js).
 *
 * Naming convention: every field that may legitimately be missing on the
 * upstream is `T | null` rather than `undefined`, so UI components only need
 * one branch (null check + render fallback) instead of three.
 */

export type RiseMarketRow = {
  mint: string;
  marketAddress: string | null;
  name: string;
  symbol: string;
  imageUrl: string | null;
  tokenUri: string | null;
  twitterUrl: string | null;
  telegramUrl: string | null;
  discordUrl: string | null;
  priceUsd: number | null;
  floorPriceUsd: number | null;
  marketCapUsd: number | null;
  floorMarketCapUsd: number | null;
  volume24hUsd: number | null;
  volumeAllTimeUsd: number | null;
  holders: number | null;
  creatorFeePct: number | null;
  startingPriceUsd: number | null;
  priceChange24hPct: number | null;
  floorDeltaPct: number | null;
  lockedSupplyPct: number | null;
  level: number | null;
  isVerified: boolean;
  disableSell: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  ageHours: number | null;
  creator: string | null;
};

export type RiseEcosystemTotals = {
  marketCount: number;
  sampledCount: number;
  totalMarketCapUsd: number;
  totalVolume24hUsd: number;
  totalFloorMarketCapUsd: number;
  totalHolders: number;
  verifiedCount: number;
  withFloorCount: number;
  medianCreatorFeePct: number | null;
};

export type RiseAggregateResponse = {
  success: true;
  updatedAt: string;
  degraded: boolean;
  uponly: RiseMarketRow | null;
  ecosystem: RiseEcosystemTotals;
  topVolume24h: RiseMarketRow[];
  topGainers24h: RiseMarketRow[];
  topLosers24h: RiseMarketRow[];
  mostHolders: RiseMarketRow[];
  largestByMcap: RiseMarketRow[];
  newest: RiseMarketRow[];
};

export type RiseMarketsListResponse = {
  success: true;
  page: number;
  limit: number;
  total: number | null;
  totalPages: number | null;
  count: number;
  markets: RiseMarketRow[];
  updatedAt: string;
};

export type RiseOhlcCandle = {
  time: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

export type RiseOhlcResponse = {
  success: true;
  address: string;
  timeframe: string;
  count: number;
  candles: RiseOhlcCandle[];
  updatedAt: string;
};

export type RiseTransactionRow = {
  kind: string | null;
  wallet: string | null;
  walletShort: string | null;
  priceUsd: number | null;
  amountTokens: number | null;
  amountUsd: number | null;
  feeUsd: number | null;
  txSig: string | null;
  ts: number | null;
};

export type RiseTransactionsResponse = {
  success: true;
  address: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number | null;
  transactions: RiseTransactionRow[];
  updatedAt: string;
};

export type RiseQuote = {
  direction: string;
  amountIn: number | null;
  amountInHuman: number | null;
  amountInUsd: number | null;
  amountOut: number | null;
  amountOutHuman: number | null;
  amountOutUsd: number | null;
  feeRate: number | null;
  feeAmount: number | null;
  feeAmountUsd: number | null;
  currentPrice: number | null;
  newPrice: number | null;
  averageFillPrice: number | null;
  priceImpact: number | null;
  currentSupply: number | null;
  newSupply: number | null;
};

export type RiseQuoteResponse = {
  success: true;
  address: string;
  quote: RiseQuote;
  updatedAt: string;
};

export type RiseBorrowQuote = {
  depositedTokens: number | null;
  walletBalance: number | null;
  debt: number | null;
  maxBorrowable: number | null;
  maxBorrowableUsd: number | null;
  maxBorrowableIfDepositAll: number | null;
  maxBorrowableIfDepositAllUsd: number | null;
  floorPrice: number | null;
  borrowFeePercent: number | null;
  requiredDeposit: number | null;
  grossBorrow: number | null;
};

export type RiseBorrowQuoteResponse = {
  success: true;
  address: string;
  wallet: string;
  quote: RiseBorrowQuote;
  updatedAt: string;
};

export type RisePortfolioSummary = {
  totalValueUsd: number;
  totalPnlUsd: number;
  totalTransactions: number;
  tokensHeld: number;
  tokensCreatedCount: number;
};

export type RisePortfolioSummaryResponse = {
  success: true;
  wallet: string;
  summary: RisePortfolioSummary;
  updatedAt: string;
};

export type RisePortfolioPosition = {
  mint: string;
  marketAddress: string | null;
  name: string | null;
  symbol: string | null;
  imageUrl: string | null;
  balance: number | null;
  balanceUsd: number | null;
  avgEntryUsd: number | null;
  pnlUsd: number | null;
  pnlPct: number | null;
  depositedTokens: number | null;
  debt: number | null;
};

export type RisePortfolioPositionsResponse = {
  success: true;
  wallet: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number | null;
  count: number;
  positions: RisePortfolioPosition[];
  updatedAt: string;
};

export type RiseTimeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
