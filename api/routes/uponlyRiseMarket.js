/**
 * Public read-only RISE proxies for the /uponly and /rise landing pages.
 * Same upstream as the agent: rise* helpers in api/libs/riseClient.js → public.rise.rich.
 *
 * Routers exported:
 *  - createUponlyRiseMarketRouter()       mounted at /uponly-rise-market
 *      GET   /:address                          → market detail (legacy, normalized)
 *      GET   /:address/ohlc/:timeframe          → OHLC candles
 *      GET   /:address/transactions             → recent trades
 *      POST  /:address/quote                    → buy/sell quote (no signing)
 *      POST  /:address/borrow-quote             → borrow capacity quote (read-only)
 *  - createUponlyRiseMarketsRouter()      mounted at /uponly-rise-markets
 *      GET   /                                  → paginated markets list (normalized rows)
 *      GET   /aggregate                         → ecosystem digest + UPONLY spotlight
 *  - createUponlyRisePortfolioRouter()    mounted at /uponly-rise-portfolio
 *      GET   /:wallet/summary                   → portfolio summary
 *      GET   /:wallet/positions                 → portfolio positions
 *
 * All responses are normalized for the landing UI and cached at the edge.
 * No /program/* (signing) routes are exposed here on purpose — they remain agent-only.
 */
import express from "express";
import {
  riseGetMarkets,
  riseGetMarketByAddress,
  riseGetMarketTransactions,
  riseGetMarketOhlc,
  risePostMarketQuote,
  risePostBorrowQuote,
  riseGetPortfolioSummary,
  riseGetPortfolioPositions,
} from "../libs/riseClient.js";

const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const RISE_UPONLY_MINT = "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise";
const ADDR_MIN = 32;
const ADDR_MAX = 50;
const AGGREGATE_PAGE_SIZE = 100;
const MAX_AGGREGATE_PAGES = 200;
const RISE_CALL_TIMEOUT_MS = 4_500;
const TOP_N = 10;

const CACHE_LIST = "public, max-age=20, s-maxage=45, stale-while-revalidate=120";
const CACHE_AGGREGATE = "public, max-age=30, s-maxage=60, stale-while-revalidate=180";
const CACHE_DETAIL = "public, max-age=30, s-maxage=60, stale-while-revalidate=120";
const CACHE_OHLC = "public, max-age=20, s-maxage=45, stale-while-revalidate=120";
const CACHE_TX = "public, max-age=15, s-maxage=30, stale-while-revalidate=60";
const CACHE_QUOTE = "no-store";
const CACHE_PORTFOLIO = "public, max-age=20, s-maxage=45, stale-while-revalidate=120";

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStr(v) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function toBool(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function isValidAddress(addr) {
  if (typeof addr !== "string") return false;
  const t = addr.trim();
  return t.length >= ADDR_MIN && t.length <= ADDR_MAX;
}

function median(arr) {
  const xs = arr.filter((v) => typeof v === "number" && Number.isFinite(v)).slice().sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

function sumOrZero(items, key) {
  let s = 0;
  for (const r of items) {
    const v = r[key];
    if (typeof v === "number" && Number.isFinite(v)) s += v;
  }
  return s;
}

function withTimeout(promise, ms) {
  let timer = null;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, status: 504, error: "rise upstream timeout" }), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Normalize a single RISE market row to the lightweight shape the screener uses.
 * Tolerant to missing fields — returns nulls instead of throwing.
 */
function normalizeRiseMarketRow(m) {
  if (!m || typeof m !== "object") return null;
  const mint = toStr(m.mint_token);
  if (!mint) return null;
  const mintMain = toStr(m.mint_main) || "";
  const isUsdcQuote = mintMain === USDC_MAINNET;
  const priceInCollateral = toNum(m.price);
  const floorInCollateral = toNum(m.mayflower_floor);
  const directPriceUsd = toNum(m.price_usd) ?? toNum(m.token_price_usd) ?? toNum(m.spot_price_usd);
  const directFloorUsd = toNum(m.mayflower_floor_usd) ?? toNum(m.floor_price_usd);
  // Some markets omit explicit USD fields. Fall back to quoted values so the
  // dashboard can still render price/floor instead of null.
  const priceUsd =
    directPriceUsd != null
      ? directPriceUsd
      : isUsdcQuote
        ? priceInCollateral
        : priceInCollateral;
  const floorPriceUsd =
    directFloorUsd != null
      ? directFloorUsd
      : isUsdcQuote
        ? floorInCollateral
        : floorInCollateral;
  const marketCapUsd = toNum(m.market_cap_usd) ?? toNum(m.marketCapUsd);
  const floorMarketCapUsd = toNum(m.floor_market_cap_usd);
  const volume24hUsd = toNum(m.volume_h24_usd) ?? toNum(m.volumeH24Usd);
  const volumeAllTimeUsd = toNum(m.volume_all_time_usd);
  const holdersRaw = toNum(m.holders_count);
  const holders = holdersRaw != null ? Math.max(0, Math.round(holdersRaw)) : null;
  const creatorFeePct = toNum(m.creator_fee_percent);
  const startingPriceUsd = toNum(m.starting_price);
  const priceChange24hPct = toNum(m.price_variation_percentage_24h);
  const floorDeltaPct = toNum(m.delta_to_floor_percentage);
  const lockedSupplyPct = toNum(m.locked_supply_percentage);
  const level = toNum(m.level);
  const isVerified = Boolean(m.is_verified);
  const disableSell = Boolean(m.disableSell);
  const createdAt = toStr(m.created_at);
  const updatedAt = toStr(m.updated_at);
  const ageHours = createdAt ? Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 3_600_000) : null;
  const tokenImage = toStr(m.token_image);
  const imageUrl = tokenImage && tokenImage.startsWith("http") ? tokenImage : null;
  const tokenUri = toStr(m.token_uri);

  return {
    mint,
    marketAddress: toStr(m.rise_market_address),
    name: toStr(m.token_name) || "",
    symbol: toStr(m.token_symbol) || "",
    imageUrl,
    tokenUri: tokenUri && tokenUri.startsWith("http") ? tokenUri : null,
    twitterUrl: toStr(m.twitter),
    telegramUrl: toStr(m.telegram),
    discordUrl: toStr(m.discord),
    priceUsd,
    floorPriceUsd,
    marketCapUsd,
    floorMarketCapUsd,
    volume24hUsd,
    volumeAllTimeUsd,
    holders,
    creatorFeePct,
    startingPriceUsd,
    priceChange24hPct,
    floorDeltaPct,
    lockedSupplyPct,
    level,
    isVerified,
    disableSell,
    createdAt,
    updatedAt,
    ageHours,
    creator: toStr(m.creator),
  };
}

/**
 * Legacy normalizer for the existing /uponly-rise-market/:address route.
 * Preserves the field names the /uponly page already consumes.
 *
 * @param {Record<string, unknown>} m
 */
export function normalizeRisePublicMarket(m) {
  if (!m || typeof m !== "object") {
    return {
      priceUsd: null,
      marketCapUsd: null,
      volume24hUsd: null,
      holders: null,
      floorPriceUsd: null,
      creatorFeePct: null,
      startingPriceUsd: null,
      allTimeHighUsd: null,
      floorPctOfAth: null,
      totalSupply: null,
      borrowableUsd: null,
      imageUrl: null,
    };
  }
  const mintMain = String(m.mint_main || "");
  const isUsdcQuote = mintMain === USDC_MAINNET;
  const priceInCollateral = toNum(m.price);
  const floorInCollateral = toNum(m.mayflower_floor);
  const directPriceUsd = toNum(m.price_usd) ?? toNum(m.token_price_usd) ?? toNum(m.spot_price_usd);
  const directFloorUsd = toNum(m.mayflower_floor_usd) ?? toNum(m.floor_price_usd);
  const priceUsd =
    directPriceUsd != null
      ? directPriceUsd
      : isUsdcQuote
        ? priceInCollateral
        : priceInCollateral;
  const floorPriceUsd =
    directFloorUsd != null
      ? directFloorUsd
      : isUsdcQuote
        ? floorInCollateral
        : floorInCollateral;
  const marketCapUsd = toNum(m.market_cap_usd) ?? toNum(m.marketCapUsd);
  const volume24hUsd = toNum(m.volume_h24_usd) ?? toNum(m.volumeH24Usd);
  const hc = m.holders_count;
  const holdersRaw = typeof hc === "number" && Number.isFinite(hc) ? hc : toNum(hc);
  const holders = holdersRaw != null && Number.isFinite(holdersRaw) ? Math.max(0, Math.round(holdersRaw)) : null;
  const creator = m.creator_fee_percent != null ? toNum(m.creator_fee_percent) : toNum(m.creatorFeePercent);
  const creatorFeePct = creator;
  const startingPriceUsd = toNum(m.starting_price) ?? toNum(m.startingPrice);
  const allTimeHighUsd = toNum(m.ath_price_usd) ?? toNum(m.ath) ?? toNum(m.allTimeHighUsd);
  let floorPctOfAth = null;
  if (allTimeHighUsd != null && allTimeHighUsd > 0 && floorPriceUsd != null) {
    floorPctOfAth = (floorPriceUsd / allTimeHighUsd) * 100;
  }
  const imageUrl = typeof m.token_image === "string" && m.token_image.startsWith("http") ? m.token_image : null;
  return {
    priceUsd,
    marketCapUsd,
    volume24hUsd,
    holders,
    floorPriceUsd,
    creatorFeePct: creatorFeePct != null ? creatorFeePct : null,
    startingPriceUsd: startingPriceUsd != null ? startingPriceUsd : null,
    allTimeHighUsd: allTimeHighUsd != null ? allTimeHighUsd : null,
    floorPctOfAth: floorPctOfAth != null ? floorPctOfAth : null,
    totalSupply: null,
    borrowableUsd: null,
    imageUrl,
  };
}

/**
 * OHLC normalization. Rise responses observed as `data: []` of objects with
 * mixed keys; we coerce common shapes (time/open/high/low/close/volume) and
 * drop anything we cannot map.
 */
function normalizeOhlcCandle(c) {
  if (!c || typeof c !== "object") return null;
  const t = c.time ?? c.timestamp ?? c.t ?? c.opentime ?? c.openTime ?? c.bucket;
  const time = typeof t === "number" ? t : t ? Number(t) : null;
  const open = toNum(c.open ?? c.o);
  const high = toNum(c.high ?? c.h);
  const low = toNum(c.low ?? c.l);
  const close = toNum(c.close ?? c.c ?? c.price);
  const volume = toNum(c.volume ?? c.v);
  if (close == null && open == null) return null;
  return {
    time: time != null && Number.isFinite(time) ? time : null,
    open: open ?? close,
    high: high ?? close,
    low: low ?? close,
    close: close ?? open,
    volume,
  };
}

function normalizeTransaction(tx) {
  if (!tx || typeof tx !== "object") return null;
  const ts = tx.timestamp ?? tx.time ?? tx.created_at ?? tx.ts;
  const tsNum = typeof ts === "number" ? ts : ts ? Number(ts) : null;
  const wallet = toStr(tx.wallet) || toStr(tx.user) || toStr(tx.signer);
  const sig = toStr(tx.signature) || toStr(tx.tx) || toStr(tx.tx_signature);
  const direction = toStr(tx.direction) || toStr(tx.type) || toStr(tx.kind);
  return {
    kind: direction ? direction.toLowerCase() : null,
    wallet,
    walletShort: wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : null,
    priceUsd: toNum(tx.price_usd) ?? toNum(tx.priceUsd) ?? toNum(tx.price),
    amountTokens: toNum(tx.amount_tokens) ?? toNum(tx.amountTokens) ?? toNum(tx.token_amount) ?? toNum(tx.amount),
    amountUsd: toNum(tx.amount_usd) ?? toNum(tx.amountUsd),
    feeUsd: toNum(tx.fee_usd) ?? toNum(tx.feeUsd),
    txSig: sig,
    ts: tsNum != null && Number.isFinite(tsNum) ? tsNum : null,
  };
}

/* --------------------------------------------------------------------------
 * Handlers — singular /uponly-rise-market router
 * -------------------------------------------------------------------------- */

/** GET /uponly-rise-market/:address — legacy detail (preserved shape) */
async function marketDetailHandler(req, res) {
  const address = (req.params.address || "").trim();
  if (!address) return res.status(400).json({ success: false, error: "address required" });
  if (!isValidAddress(address)) return res.status(400).json({ success: false, error: "invalid address" });

  const result = await withTimeout(riseGetMarketByAddress(address), RISE_CALL_TIMEOUT_MS);
  if (!result.ok) {
    const code = result.status && result.status < 500 ? result.status : 502;
    return res.status(code).json({ success: false, error: result.error || "RISE request failed" });
  }
  const body = result.data;
  if (!body || typeof body !== "object" || !body.ok || !body.market) {
    return res.status(404).json({ success: false, error: "Market not found for this address" });
  }
  const normalized = normalizeRisePublicMarket(body.market);
  const row = normalizeRiseMarketRow(body.market);
  res.setHeader("Cache-Control", CACHE_DETAIL);
  return res.json({
    success: true,
    address,
    updatedAt: new Date().toISOString(),
    normalized,
    row,
  });
}

/** GET /uponly-rise-market/:address/ohlc/:timeframe?limit */
async function ohlcHandler(req, res) {
  const address = (req.params.address || "").trim();
  const timeframe = (req.params.timeframe || "").trim();
  if (!isValidAddress(address)) return res.status(400).json({ success: false, error: "invalid address" });
  if (!timeframe) return res.status(400).json({ success: false, error: "timeframe required" });
  const limit = clampInt(req.query.limit, 1, 500, 168);

  const result = await withTimeout(riseGetMarketOhlc(address, timeframe, { limit }), RISE_CALL_TIMEOUT_MS);
  if (!result.ok) {
    const code = result.status && result.status < 500 ? result.status : 502;
    return res.status(code).json({ success: false, error: result.error || "RISE OHLC request failed" });
  }
  const raw = Array.isArray(result.data?.data) ? result.data.data : [];
  const candles = raw.map(normalizeOhlcCandle).filter(Boolean);
  res.setHeader("Cache-Control", CACHE_OHLC);
  return res.json({
    success: true,
    address,
    timeframe: result.data?.timeframe || timeframe,
    count: candles.length,
    candles,
    updatedAt: new Date().toISOString(),
  });
}

/** GET /uponly-rise-market/:address/transactions?page&limit */
async function transactionsHandler(req, res) {
  const address = (req.params.address || "").trim();
  if (!isValidAddress(address)) return res.status(400).json({ success: false, error: "invalid address" });
  const page = clampInt(req.query.page, 1, 1000, 1);
  const limit = clampInt(req.query.limit, 1, 100, 25);

  const result = await withTimeout(riseGetMarketTransactions(address, { page, limit }), RISE_CALL_TIMEOUT_MS);
  if (!result.ok) {
    const code = result.status && result.status < 500 ? result.status : 502;
    return res.status(code).json({ success: false, error: result.error || "RISE transactions request failed" });
  }
  const raw = Array.isArray(result.data?.transactions) ? result.data.transactions : [];
  const transactions = raw.map(normalizeTransaction).filter(Boolean);
  res.setHeader("Cache-Control", CACHE_TX);
  return res.json({
    success: true,
    address,
    page,
    limit,
    total: toNum(result.data?.total) ?? transactions.length,
    totalPages: toNum(result.data?.totalPages) ?? null,
    transactions,
    updatedAt: new Date().toISOString(),
  });
}

/** POST /uponly-rise-market/:address/quote   body { amount, direction } */
async function quoteHandler(req, res) {
  const address = (req.params.address || "").trim();
  if (!isValidAddress(address)) return res.status(400).json({ success: false, error: "invalid address" });
  const body = req.body || {};
  const amount = toNum(body.amount);
  const direction = toStr(body.direction);
  if (amount == null || amount <= 0) return res.status(400).json({ success: false, error: "amount must be a positive number (raw units)" });
  if (!direction || (direction !== "buy" && direction !== "sell")) {
    return res.status(400).json({ success: false, error: "direction must be 'buy' or 'sell'" });
  }

  const result = await withTimeout(risePostMarketQuote(address, { amount, direction }), RISE_CALL_TIMEOUT_MS);
  if (!result.ok) {
    const code = result.status && result.status < 500 ? result.status : 502;
    return res.status(code).json({ success: false, error: result.error || "RISE quote request failed" });
  }
  const q = result.data?.quote;
  if (!q || typeof q !== "object") return res.status(502).json({ success: false, error: "Malformed quote response" });
  res.setHeader("Cache-Control", CACHE_QUOTE);
  return res.json({
    success: true,
    address,
    quote: {
      direction: toStr(q.direction) || direction,
      amountIn: toNum(q.amountIn),
      amountInHuman: toNum(q.amountInHuman),
      amountInUsd: toNum(q.amountInUsd),
      amountOut: toNum(q.amountOut),
      amountOutHuman: toNum(q.amountOutHuman),
      amountOutUsd: toNum(q.amountOutUsd),
      feeRate: toNum(q.feeRate),
      feeAmount: toNum(q.feeAmount),
      feeAmountUsd: toNum(q.feeAmountUsd),
      currentPrice: toNum(q.currentPrice),
      newPrice: toNum(q.newPrice),
      averageFillPrice: toNum(q.averageFillPrice),
      priceImpact: toNum(q.priceImpact),
      currentSupply: toNum(q.currentSupply),
      newSupply: toNum(q.newSupply),
    },
    updatedAt: new Date().toISOString(),
  });
}

/** POST /uponly-rise-market/:address/borrow-quote   body { wallet, amountToBorrow } */
async function borrowQuoteHandler(req, res) {
  const address = (req.params.address || "").trim();
  if (!isValidAddress(address)) return res.status(400).json({ success: false, error: "invalid address" });
  const body = req.body || {};
  const wallet = toStr(body.wallet);
  const amountToBorrow = toNum(body.amountToBorrow);
  if (!wallet || !isValidAddress(wallet)) return res.status(400).json({ success: false, error: "valid wallet required" });
  if (amountToBorrow != null && amountToBorrow < 0) return res.status(400).json({ success: false, error: "amountToBorrow must be >= 0" });

  const result = await withTimeout(
    risePostBorrowQuote(address, { wallet, amountToBorrow: amountToBorrow ?? 0 }),
    RISE_CALL_TIMEOUT_MS,
  );
  if (!result.ok) {
    const code = result.status && result.status < 500 ? result.status : 502;
    return res.status(code).json({ success: false, error: result.error || "RISE borrow-quote request failed" });
  }
  const d = result.data || {};
  res.setHeader("Cache-Control", CACHE_QUOTE);
  return res.json({
    success: true,
    address,
    wallet,
    quote: {
      depositedTokens: toNum(d.depositedTokens),
      walletBalance: toNum(d.walletBalance),
      debt: toNum(d.debt),
      maxBorrowable: toNum(d.maxBorrowable),
      maxBorrowableUsd: toNum(d.maxBorrowableUsd),
      maxBorrowableIfDepositAll: toNum(d.maxBorrowableIfDepositAll),
      maxBorrowableIfDepositAllUsd: toNum(d.maxBorrowableIfDepositAllUsd),
      floorPrice: toNum(d.floorPrice),
      borrowFeePercent: toNum(d.borrowFeePercent),
      requiredDeposit: toNum(d.requiredDeposit),
      grossBorrow: toNum(d.grossBorrow),
    },
    updatedAt: new Date().toISOString(),
  });
}

export function createUponlyRiseMarketRouter() {
  const router = express.Router();
  router.get("/:address/ohlc/:timeframe", ohlcHandler);
  router.get("/:address/transactions", transactionsHandler);
  router.post("/:address/quote", quoteHandler);
  router.post("/:address/borrow-quote", borrowQuoteHandler);
  router.get("/:address", marketDetailHandler);
  return router;
}

/* --------------------------------------------------------------------------
 * Handlers — plural /uponly-rise-markets router
 * -------------------------------------------------------------------------- */

/** GET /uponly-rise-markets?page&limit */
async function listHandler(req, res) {
  const page = clampInt(req.query.page, 1, 1000, 1);
  const limit = clampInt(req.query.limit, 1, 100, 50);
  const verifiedOnly = toBool(req.query.verified);
  const hasFloorOnly = toBool(req.query.hasFloor);
  const minMarketCap = toNum(req.query.minMarketCap);

  const needsGlobalFilterPass = verifiedOnly || hasFloorOnly;
  let rows = [];
  let total = null;
  let totalPages = null;

  if (!needsGlobalFilterPass) {
    const result = await withTimeout(riseGetMarkets({ page, limit }), RISE_CALL_TIMEOUT_MS);
    if (!result.ok) {
      const code = result.status && result.status < 500 ? result.status : 502;
      return res.status(code).json({ success: false, error: result.error || "RISE markets request failed" });
    }
    const raw = Array.isArray(result.data?.markets) ? result.data.markets : [];
    rows = raw.map(normalizeRiseMarketRow).filter(Boolean);
    if (minMarketCap != null) rows = rows.filter((r) => (r.marketCapUsd ?? 0) >= minMarketCap);
    total = toNum(result.data?.total);
    totalPages = toNum(result.data?.totalPages);
  } else {
    // For global verified/floor filters, collect all pages first so filters are
    // applied to the entire market universe (not just one paginated page).
    const first = await withTimeout(riseGetMarkets({ page: 1, limit: 100 }), RISE_CALL_TIMEOUT_MS);
    if (!first.ok) {
      const code = first.status && first.status < 500 ? first.status : 502;
      return res.status(code).json({ success: false, error: first.error || "RISE markets request failed" });
    }
    const upstreamTotalPages = clampInt(first.data?.totalPages, 1, 200, 1);
    const allRaw = Array.isArray(first.data?.markets) ? [...first.data.markets] : [];

    if (upstreamTotalPages > 1) {
      const calls = [];
      for (let p = 2; p <= upstreamTotalPages; p += 1) {
        calls.push(withTimeout(riseGetMarkets({ page: p, limit: 100 }), RISE_CALL_TIMEOUT_MS));
      }
      const settled = await Promise.allSettled(calls);
      for (const s of settled) {
        if (s.status !== "fulfilled" || !s.value?.ok) continue;
        if (Array.isArray(s.value.data?.markets)) allRaw.push(...s.value.data.markets);
      }
    }

    const dedup = new Map();
    for (const m of allRaw) {
      const row = normalizeRiseMarketRow(m);
      if (row && row.mint && !dedup.has(row.mint)) dedup.set(row.mint, row);
    }
    let filtered = Array.from(dedup.values());
    if (verifiedOnly) filtered = filtered.filter((r) => r.isVerified);
    if (hasFloorOnly) filtered = filtered.filter((r) => (r.floorPriceUsd ?? 0) > 0);
    if (minMarketCap != null) filtered = filtered.filter((r) => (r.marketCapUsd ?? 0) >= minMarketCap);

    total = filtered.length;
    totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    rows = filtered.slice(start, start + limit);
  }

  res.setHeader("Cache-Control", CACHE_LIST);
  return res.json({
    success: true,
    page,
    limit,
    total,
    totalPages,
    count: rows.length,
    markets: rows,
    updatedAt: new Date().toISOString(),
  });
}

/** GET /uponly-rise-markets/aggregate */
async function aggregateHandler(req, res) {
  const firstPageResult = await withTimeout(
    riseGetMarkets({ page: 1, limit: AGGREGATE_PAGE_SIZE }),
    RISE_CALL_TIMEOUT_MS,
  );
  if (!firstPageResult.ok) {
    const code = firstPageResult.status && firstPageResult.status < 500 ? firstPageResult.status : 502;
    return res.status(code).json({ success: false, error: firstPageResult.error || "RISE markets request failed" });
  }

  const totalPages = clampInt(firstPageResult.data?.totalPages, 1, MAX_AGGREGATE_PAGES, 1);
  const totalMarkets = clampInt(firstPageResult.data?.total, 0, Number.MAX_SAFE_INTEGER, 0);
  const pageCalls = [];
  for (let p = 2; p <= totalPages; p += 1) {
    pageCalls.push(withTimeout(riseGetMarkets({ page: p, limit: AGGREGATE_PAGE_SIZE }), RISE_CALL_TIMEOUT_MS));
  }
  const settledPages = await Promise.allSettled(pageCalls);
  const uponlyResult = await withTimeout(riseGetMarketByAddress(RISE_UPONLY_MINT), RISE_CALL_TIMEOUT_MS);

  const allPageResults = [firstPageResult, ...settledPages.map((s) => (s.status === "fulfilled" ? s.value : null))];
  let degraded = false;
  const allRows = [];
  const seen = new Set();

  for (const r of allPageResults) {
    if (!r?.ok || !r.data?.markets) {
      degraded = true;
      continue;
    }
    for (const m of r.data.markets) {
      const row = normalizeRiseMarketRow(m);
      if (!row || !row.mint || seen.has(row.mint)) continue;
      seen.add(row.mint);
      allRows.push(row);
    }
  }

  let uponly = allRows.find((r) => r.mint === RISE_UPONLY_MINT) || null;
  if (uponlyResult.ok && uponlyResult.data?.market) {
    const row = normalizeRiseMarketRow(uponlyResult.data.market);
    if (row) {
      uponly = row;
      if (!seen.has(row.mint)) {
        seen.add(row.mint);
        allRows.push(row);
      }
    }
  } else if (!uponly) {
    degraded = true;
  }

  const ecosystem = {
    marketCount: totalMarkets || allRows.length,
    sampledCount: allRows.length,
    totalMarketCapUsd: sumOrZero(allRows, "marketCapUsd"),
    totalVolume24hUsd: sumOrZero(allRows, "volume24hUsd"),
    totalFloorMarketCapUsd: sumOrZero(allRows, "floorMarketCapUsd"),
    totalHolders: Math.round(sumOrZero(allRows, "holders")),
    verifiedCount: allRows.filter((r) => r.isVerified).length,
    withFloorCount: allRows.filter((r) => (r.floorPriceUsd ?? 0) > 0).length,
    medianCreatorFeePct: median(allRows.map((r) => r.creatorFeePct ?? null)),
  };

  const sortBy = (key, desc = true) =>
    [...allRows]
      .filter((r) => typeof r[key] === "number" && Number.isFinite(r[key]))
      .sort((a, b) => (desc ? b[key] - a[key] : a[key] - b[key]))
      .slice(0, TOP_N);

  const newest = [...allRows]
    .filter((r) => r.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, TOP_N);

  res.setHeader("Cache-Control", CACHE_AGGREGATE);
  return res.json({
    success: true,
    updatedAt: new Date().toISOString(),
    degraded,
    uponly,
    ecosystem,
    topVolume24h: sortBy("volume24hUsd", true),
    topGainers24h: sortBy("priceChange24hPct", true),
    topLosers24h: sortBy("priceChange24hPct", false),
    mostHolders: sortBy("holders", true),
    largestByMcap: sortBy("marketCapUsd", true),
    newest,
  });
}

export function createUponlyRiseMarketsRouter() {
  const router = express.Router();
  router.get("/aggregate", aggregateHandler);
  router.get("/", listHandler);
  return router;
}

/* --------------------------------------------------------------------------
 * Handlers — /uponly-rise-portfolio router
 * -------------------------------------------------------------------------- */

/** GET /uponly-rise-portfolio/:wallet/summary */
async function portfolioSummaryHandler(req, res) {
  const wallet = (req.params.wallet || "").trim();
  if (!isValidAddress(wallet)) return res.status(400).json({ success: false, error: "invalid wallet" });

  const result = await withTimeout(riseGetPortfolioSummary(wallet), RISE_CALL_TIMEOUT_MS);
  if (!result.ok) {
    const code = result.status && result.status < 500 ? result.status : 502;
    return res.status(code).json({ success: false, error: result.error || "RISE portfolio summary failed" });
  }
  const s = result.data?.summary || {};
  res.setHeader("Cache-Control", CACHE_PORTFOLIO);
  return res.json({
    success: true,
    wallet,
    summary: {
      totalValueUsd: toNum(s.total_value_usd) ?? 0,
      totalPnlUsd: toNum(s.total_pnl_usd) ?? 0,
      totalTransactions: toNum(s.total_transactions) ?? 0,
      tokensHeld: toNum(s.tokens_held) ?? 0,
      tokensCreatedCount: toNum(s.tokens_created_count) ?? 0,
    },
    updatedAt: new Date().toISOString(),
  });
}

/** GET /uponly-rise-portfolio/:wallet/positions?page&limit */
async function portfolioPositionsHandler(req, res) {
  const wallet = (req.params.wallet || "").trim();
  if (!isValidAddress(wallet)) return res.status(400).json({ success: false, error: "invalid wallet" });
  const page = clampInt(req.query.page, 1, 1000, 1);
  const limit = clampInt(req.query.limit, 1, 100, 25);

  const result = await withTimeout(riseGetPortfolioPositions(wallet, { page, limit }), RISE_CALL_TIMEOUT_MS);
  if (!result.ok) {
    const code = result.status && result.status < 500 ? result.status : 502;
    return res.status(code).json({ success: false, error: result.error || "RISE portfolio positions failed" });
  }
  const raw = Array.isArray(result.data?.results) ? result.data.results : [];
  const positions = raw.map((p) => {
    if (!p || typeof p !== "object") return null;
    const mint = toStr(p.mint_token) || toStr(p.mint);
    if (!mint) return null;
    return {
      mint,
      marketAddress: toStr(p.rise_market_address) || toStr(p.market),
      name: toStr(p.token_name),
      symbol: toStr(p.token_symbol),
      imageUrl: (() => {
        const img = toStr(p.token_image);
        return img && img.startsWith("http") ? img : null;
      })(),
      balance: toNum(p.balance) ?? toNum(p.amount),
      balanceUsd: toNum(p.balance_usd) ?? toNum(p.value_usd),
      avgEntryUsd: toNum(p.avg_entry_usd) ?? toNum(p.entry_price_usd),
      pnlUsd: toNum(p.pnl_usd),
      pnlPct: toNum(p.pnl_pct) ?? toNum(p.pnl_percentage),
      depositedTokens: toNum(p.deposited_tokens),
      debt: toNum(p.debt),
    };
  }).filter(Boolean);

  res.setHeader("Cache-Control", CACHE_PORTFOLIO);
  return res.json({
    success: true,
    wallet,
    page,
    limit,
    total: toNum(result.data?.total) ?? positions.length,
    totalPages: toNum(result.data?.totalPages),
    count: positions.length,
    positions,
    updatedAt: new Date().toISOString(),
  });
}

export function createUponlyRisePortfolioRouter() {
  const router = express.Router();
  router.get("/:wallet/summary", portfolioSummaryHandler);
  router.get("/:wallet/positions", portfolioPositionsHandler);
  return router;
}
