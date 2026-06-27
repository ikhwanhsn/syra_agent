/**
 * Top-holder profit, last trade, and net worth (GMGN token holders + optional portfolio stats).
 */
import { runGmgnAgentTool } from './gmgnAgentService.js';

const CACHE_TTL_MS = 90_000;
const GMGN_HOLDER_LIMIT = 10;
const HOLDINGS_PAGE_LIMIT = 50;
const HOLDINGS_MAX_PAGES = 8;
const WALLET_NETWORTH_CONCURRENCY = 4;

/** @type {Map<string, { expires: number; data: unknown }>} */
const insightsCache = new Map();

/** @param {unknown} v */
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** @param {string} mint @param {string[]} wallets */
function cacheKey(mint, wallets) {
  const sorted = [...new Set(wallets.map((w) => w.trim()).filter(Boolean))].sort();
  return `v2-portfolio|${mint}|${sorted.join(',')}`;
}

/** @param {string} key */
function readCache(key) {
  const hit = insightsCache.get(key);
  if (!hit || Date.now() > hit.expires) {
    if (hit) insightsCache.delete(key);
    return null;
  }
  return hit.data;
}

/** @param {string} key @param {unknown} data */
function writeCache(key, data) {
  insightsCache.set(key, { expires: Date.now() + CACHE_TTL_MS, data });
}

/** @param {unknown} root */
function extractHolderList(root) {
  if (!root || typeof root !== 'object') return [];
  const o = /** @type {Record<string, unknown>} */ (root);
  const data = o.data && typeof o.data === 'object' ? /** @type {Record<string, unknown>} */ (o.data) : o;
  const candidates = [data.list, data.holders, data.items, data.rank, o.list, o.holders];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

/** @param {Record<string, unknown>} row */
function walletFromRow(row) {
  const w = row.address ?? row.wallet ?? row.owner ?? row.account ?? row.holder;
  return typeof w === 'string' && w.trim() ? w.trim() : null;
}

/** @param {unknown} v @returns {string | null} */
function parseTimestampIso(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      if (Number.isFinite(n)) {
        const ms = n > 1_000_000_000_000 ? n : n * 1000;
        const d = new Date(ms);
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
      }
    }
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    const ms = v > 1_000_000_000_000 ? v : v * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

/** @param {unknown} raw @returns {'buy' | 'sell' | null} */
function normalizeTradeSide(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s.includes('buy') || s === 'b') return 'buy';
  if (s.includes('sell') || s === 's') return 'sell';
  return null;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {{ inProfit: boolean | null; profitUsd: number | null; profitPct: number | null; costUsd: number | null }}
 */
function profitFromRow(row) {
  const profitUsd =
    toNum(row.profit) ??
    toNum(row.total_profit) ??
    toNum(row.pnl) ??
    (() => {
      const realized = toNum(row.realized_profit ?? row.realizedProfit);
      const unrealized = toNum(row.unrealized_profit ?? row.unrealizedProfit);
      if (realized == null && unrealized == null) return null;
      return (realized ?? 0) + (unrealized ?? 0);
    })();

  const costUsd =
    toNum(row.cost) ??
    toNum(row.total_cost) ??
    toNum(row.accu_cost) ??
    toNum(row.history_bought_cost ?? row.historyBoughtCost) ??
    toNum(row.buy_volume_cur ?? row.buyVolumeCur);

  let inProfit = null;
  if (profitUsd != null) {
    if (Math.abs(profitUsd) >= 0.01) inProfit = profitUsd > 0;
  } else if (costUsd != null) {
    const usdValue = toNum(row.usd_value ?? row.usdValue);
    if (usdValue != null) {
      const delta = usdValue - costUsd;
      if (Math.abs(delta) >= 0.01) inProfit = delta > 0;
    }
  }

  const profitPct =
    profitUsd != null && costUsd != null && costUsd > 0 ? (profitUsd / costUsd) * 100 : null;

  return { inProfit, profitUsd, profitPct, costUsd };
}

/**
 * @param {Record<string, unknown>} row
 * @returns {{ side: 'buy' | 'sell' | null; at: string | null; amountToken: number | null; amountUsd: number | null }}
 */
function lastTradeFromRow(row) {
  const explicitSide = normalizeTradeSide(
    row.last_tx_type ??
      row.last_action ??
      row.last_side ??
      row.recent_side ??
      row.last_trade_side ??
      row.trade_side,
  );

  const lastBuyAt = parseTimestampIso(
    row.last_buy_timestamp ??
      row.last_buy_time ??
      row.recent_buy_time ??
      row.last_buy_at ??
      row.lastBuyTimestamp,
  );
  const lastSellAt = parseTimestampIso(
    row.last_sell_timestamp ??
      row.last_sell_time ??
      row.recent_sell_time ??
      row.last_sell_at ??
      row.lastSellTimestamp,
  );
  const lastActiveAt = parseTimestampIso(
    row.last_active_timestamp ??
      row.last_active_time ??
      row.lastActiveTimestamp ??
      row.last_trade_timestamp ??
      row.lastTradeTimestamp,
  );

  /** @type {{ side: 'buy' | 'sell' | null; at: string | null; amountToken: number | null; amountUsd: number | null }} */
  let result = { side: explicitSide, at: null, amountToken: null, amountUsd: null };

  if (lastBuyAt && lastSellAt) {
    const buyMs = new Date(lastBuyAt).getTime();
    const sellMs = new Date(lastSellAt).getTime();
    if (buyMs >= sellMs) {
      result = {
        side: result.side ?? 'buy',
        at: lastBuyAt,
        amountToken: toNum(row.last_buy_amount ?? row.recent_buy_amount ?? row.last_buy_token_amount),
        amountUsd: toNum(
          row.last_buy_volume ??
            row.last_buy_volume_usd ??
            row.recent_buy_volume_usd ??
            row.last_buy_usd,
        ),
      };
    } else {
      result = {
        side: result.side ?? 'sell',
        at: lastSellAt,
        amountToken: toNum(row.last_sell_amount ?? row.recent_sell_amount ?? row.last_sell_token_amount),
        amountUsd: toNum(
          row.last_sell_volume ??
            row.last_sell_volume_usd ??
            row.recent_sell_volume_usd ??
            row.last_sell_usd,
        ),
      };
    }
    return result;
  }

  if (lastBuyAt) {
    return {
      side: result.side ?? 'buy',
      at: lastBuyAt,
      amountToken: toNum(row.last_buy_amount ?? row.recent_buy_amount ?? row.last_buy_token_amount),
      amountUsd: toNum(
        row.last_buy_volume ??
          row.last_buy_volume_usd ??
          row.recent_buy_volume_usd ??
          row.last_buy_usd,
      ),
    };
  }

  if (lastSellAt) {
    return {
      side: result.side ?? 'sell',
      at: lastSellAt,
      amountToken: toNum(row.last_sell_amount ?? row.recent_sell_amount ?? row.last_sell_token_amount),
      amountUsd: toNum(
        row.last_sell_volume ??
          row.last_sell_volume_usd ??
          row.recent_sell_volume_usd ??
          row.last_sell_usd,
      ),
    };
  }

  if (lastActiveAt) {
    const buyTx = toNum(row.buy_tx_count_cur ?? row.buy_tx_count ?? row.buy_tx_count_cur);
    const sellTx = toNum(row.sell_tx_count_cur ?? row.sell_tx_count ?? row.sell_tx_count_cur);
    let inferredSide = result.side;
    if (!inferredSide && buyTx != null && sellTx != null && buyTx !== sellTx) {
      inferredSide = buyTx > sellTx ? 'buy' : 'sell';
    }

    return {
      side: inferredSide,
      at: lastActiveAt,
      amountToken: toNum(
        row.last_trade_amount ??
          row.trade_amount ??
          row.last_amount ??
          (inferredSide === 'buy'
            ? row.buy_amount_cur ?? row.buyAmountCur
            : inferredSide === 'sell'
              ? row.sell_amount_cur ?? row.sellAmountCur
              : null),
      ),
      amountUsd: toNum(
        row.last_trade_usd ??
          row.trade_usd ??
          row.last_trade_volume_usd ??
          (inferredSide === 'buy'
            ? row.buy_volume_cur ?? row.buyVolumeCur
            : inferredSide === 'sell'
              ? row.sell_volume_cur ?? row.sellVolumeCur
              : null),
      ),
    };
  }

  return result;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {{ nativeBalanceSol: number | null; nativeBalanceUsd: number | null; tokenPositionUsd: number | null }}
 */
function walletMetaFromRow(row) {
  const nativeRaw = toNum(row.native_balance ?? row.nativeBalance ?? row.sol_balance ?? row.solBalance);
  let nativeBalanceSol = null;
  if (nativeRaw != null) {
    nativeBalanceSol = nativeRaw >= 1_000_000 ? nativeRaw / 1e9 : nativeRaw;
  }

  return {
    nativeBalanceSol,
    nativeBalanceUsd: toNum(row.native_balance_usd ?? row.nativeBalanceUsd ?? row.sol_balance_usd),
    tokenPositionUsd: toNum(row.usd_value ?? row.usdValue ?? row.amount_usd ?? row.amountUsd),
  };
}

/** @param {unknown} data */
function extractPayload(data) {
  if (!data || typeof data !== 'object') return {};
  const root = /** @type {Record<string, unknown>} */ (data);
  return root.data && typeof root.data === 'object'
    ? /** @type {Record<string, unknown>} */ (root.data)
    : root;
}

/** @param {Record<string, unknown>} payload */
function totalUsdFromPayload(payload) {
  return (
    toNum(payload.total_usd_value) ??
    toNum(payload.total_usd) ??
    toNum(payload.total_balance_usd) ??
    toNum(payload.wallet_balance_usd) ??
    toNum(payload.balance_usd) ??
    toNum(payload.total_value_usd)
  );
}

/** @param {Record<string, unknown>} payload */
function nextHoldingsCursor(payload) {
  const raw = payload.next ?? payload.next_cursor ?? payload.cursor;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

/** @param {unknown[]} list */
function sumTokenRowsUsd(list) {
  let sum = 0;
  let found = false;
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const row = /** @type {Record<string, unknown>} */ (item);
    const usd = toNum(row.usd_value ?? row.usdValue ?? row.value_usd ?? row.balance_usd ?? row.amount_usd);
    if (usd != null) {
      sum += usd;
      found = true;
    }
  }
  return found ? sum : null;
}

/**
 * Sum USD value of all token holdings in a wallet (paginated GMGN portfolio holdings).
 * @param {string} wallet
 */
async function fetchWalletHoldingsNetWorth(wallet) {
  let total = 0;
  let found = false;
  /** @type {string | undefined} */
  let cursor;
  let page = 0;

  while (page < HOLDINGS_MAX_PAGES) {
    /** @type {Record<string, string | number>} */
    const params = {
      chain: 'sol',
      wallet,
      limit: HOLDINGS_PAGE_LIMIT,
      show_small: 'true',
    };
    if (cursor) params.cursor = cursor;

    const result = await runGmgnAgentTool('gmgn-portfolio-holdings', params);
    if (!result.ok) break;

    const payload = extractPayload(result.data);
    if (page === 0) {
      const explicitTotal = totalUsdFromPayload(payload);
      if (explicitTotal != null) return explicitTotal;
    }

    const list = extractHolderList(result.data);
    const pageSum = sumTokenRowsUsd(list);
    if (pageSum != null) {
      total += pageSum;
      found = true;
    }

    const next = nextHoldingsCursor(payload);
    if (!next || list.length < HOLDINGS_PAGE_LIMIT) break;
    cursor = next;
    page += 1;
  }

  return found ? total : null;
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T) => Promise<void>} fn
 */
async function forEachWithConcurrency(items, concurrency, fn) {
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx;
      idx += 1;
      await fn(items[i]);
    }
  });
  await Promise.all(workers);
}

/**
 * @param {string[]} wallets
 * @returns {Promise<Map<string, { netWorthUsd: number }>>}
 */
async function fetchWalletNetWorthBatch(wallets) {
  /** @type {Map<string, { netWorthUsd: number }>} */
  const map = new Map();
  await forEachWithConcurrency(wallets, WALLET_NETWORTH_CONCURRENCY, async (wallet) => {
    const netWorthUsd = await fetchWalletHoldingsNetWorth(wallet);
    if (netWorthUsd != null) map.set(wallet, { netWorthUsd });
  });
  return map;
}

/**
 * @param {unknown} gmgnData
 */
function parseGmgnHolderMaps(gmgnData) {
  /** @type {Map<string, ReturnType<typeof profitFromRow>>} */
  const profitMap = new Map();
  /** @type {Map<string, ReturnType<typeof lastTradeFromRow>>} */
  const tradeMap = new Map();
  /** @type {Map<string, ReturnType<typeof walletMetaFromRow>>} */
  const walletMetaMap = new Map();

  for (const item of extractHolderList(gmgnData)) {
    if (!item || typeof item !== 'object') continue;
    const row = /** @type {Record<string, unknown>} */ (item);
    const wallet = walletFromRow(row);
    if (!wallet) continue;
    profitMap.set(wallet, profitFromRow(row));
    tradeMap.set(wallet, lastTradeFromRow(row));
    walletMetaMap.set(wallet, walletMetaFromRow(row));
  }

  return { profitMap, tradeMap, walletMetaMap };
}

/**
 * @param {{ mint: string; wallets?: string[] }} input
 */
export async function buildHolderInsights(input) {
  const mint = typeof input.mint === 'string' ? input.mint.trim() : '';
  if (!mint) {
    return { ok: false, error: 'Provide a valid mint address', status: 400 };
  }

  /** @type {string[]} */
  const wallets = Array.isArray(input.wallets)
    ? [...new Set(input.wallets.map((w) => (typeof w === 'string' ? w.trim() : '')).filter(Boolean))]
    : [];

  const key = cacheKey(mint, wallets);
  const cached = readCache(key);
  if (cached) {
    return { ok: true, data: cached };
  }

  const gmgnPromise = runGmgnAgentTool('gmgn-token-holders', {
    chain: 'sol',
    address: mint,
    limit: GMGN_HOLDER_LIMIT,
  });

  const portfolioPromise =
    wallets.length > 0
      ? fetchWalletNetWorthBatch(wallets.slice(0, GMGN_HOLDER_LIMIT))
      : Promise.resolve(new Map());

  const [gmgnResult, portfolioNetWorthMap] = await Promise.all([gmgnPromise, portfolioPromise]);

  if (!gmgnResult.ok) {
    return {
      ok: false,
      error: gmgnResult.error || 'Holder insights unavailable',
      status: gmgnResult.status ?? 502,
    };
  }

  const { profitMap, tradeMap, walletMetaMap } = parseGmgnHolderMaps(gmgnResult.data);

  /** @type {string[]} */
  const targetWallets =
    wallets.length > 0 ? wallets.slice(0, GMGN_HOLDER_LIMIT) : [...profitMap.keys()].slice(0, GMGN_HOLDER_LIMIT);

  const holders = targetWallets.map((wallet, idx) => {
    const profit = profitMap.get(wallet) ?? {
      inProfit: null,
      profitUsd: null,
      profitPct: null,
      costUsd: null,
    };
    const lastTrade = tradeMap.get(wallet) ?? {
      side: null,
      at: null,
      amountToken: null,
      amountUsd: null,
    };
    const walletMeta = walletMetaMap.get(wallet) ?? {
      nativeBalanceSol: null,
      nativeBalanceUsd: null,
      tokenPositionUsd: null,
    };
    const portfolioNetWorth = portfolioNetWorthMap.get(wallet);
    const netWorth = {
      netWorthUsd: portfolioNetWorth?.netWorthUsd ?? null,
      nativeBalanceSol: walletMeta.nativeBalanceSol,
      nativeBalanceUsd: walletMeta.nativeBalanceUsd,
      tokenPositionUsd: walletMeta.tokenPositionUsd,
    };
    return {
      rank: idx + 1,
      wallet,
      ...profit,
      lastTrade,
      netWorth,
    };
  });

  const knownNetWorth = holders.filter((h) => h.netWorth.netWorthUsd != null);
  const totalNetWorthUsd = knownNetWorth.reduce((sum, h) => sum + (h.netWorth.netWorthUsd ?? 0), 0);

  const data = {
    mint,
    source: 'gmgn',
    holders,
    summary: {
      total: holders.length,
      inProfit: holders.filter((h) => h.inProfit === true).length,
      atLoss: holders.filter((h) => h.inProfit === false).length,
      unknown: holders.filter((h) => h.inProfit == null).length,
      lastBuy: holders.filter((h) => h.lastTrade.side === 'buy').length,
      lastSell: holders.filter((h) => h.lastTrade.side === 'sell').length,
      lastTradeUnknown: holders.filter((h) => h.lastTrade.side == null && h.lastTrade.at != null).length,
      withNetWorth: knownNetWorth.length,
      totalNetWorthUsd: knownNetWorth.length > 0 ? totalNetWorthUsd : null,
    },
    fetchedAt: new Date().toISOString(),
  };

  writeCache(key, data);

  return { ok: true, data };
}

/** @deprecated Use buildHolderInsights */
export async function buildHolderProfitStatus(input) {
  return buildHolderInsights(input);
}
