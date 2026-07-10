/**
 * SYRA MM strategy engine — reservation price, grid ladder, inventory skew, cost-aware gate.
 */
import {
  estimateMmRoundTripCostPct,
  MM_DEFAULTS,
} from "../../config/mmAgentConfig.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Avellaneda-Stoikov-lite reservation price with inventory skew.
 * @param {object} params
 * @param {number} params.midPriceUsd
 * @param {number} params.inventoryUsd — net SYRA inventory value (+ long SYRA)
 * @param {number} params.maxInventoryUsd
 * @param {number} params.targetInventoryUsd
 * @param {number} params.inventorySkewFactor
 */
export function computeReservationPrice({
  midPriceUsd,
  inventoryUsd,
  maxInventoryUsd,
  targetInventoryUsd,
  inventorySkewFactor,
}) {
  if (!(midPriceUsd > 0)) return null;
  const maxInv = Math.max(1, maxInventoryUsd);
  const inv = Number(inventoryUsd) || 0;
  const target = Number(targetInventoryUsd) || 0;
  const skew = clamp((inv - target) / maxInv, -1, 1);
  const skewBps = skew * inventorySkewFactor * 100;
  const reservation = midPriceUsd * (1 - skewBps / 10_000);
  return Math.max(reservation, midPriceUsd * 0.5);
}

/**
 * Apply vol regime multiplier to spread.
 * @param {number} baseSpreadBps — half-spread bps
 * @param {'low' | 'normal' | 'high'} regime
 * @param {object} cfg
 */
export function applyVolSpreadMultiplier(baseSpreadBps, regime, cfg) {
  const base = Number(baseSpreadBps);
  if (!Number.isFinite(base) || base <= 0) return MM_DEFAULTS.spreadBps;
  if (regime === "high") return Math.round(base * (cfg.highVolSpreadMultiplier ?? 1.45));
  if (regime === "low") return Math.round(base * (cfg.lowVolSpreadMultiplier ?? 0.85));
  return base;
}

/**
 * Whether half-spread clears estimated round-trip costs.
 * @param {number} halfSpreadBps
 * @param {object} cfg
 */
export function passesCostAwareSpreadGate(halfSpreadBps, cfg) {
  const halfSpreadPct = halfSpreadBps / 100;
  const roundTripCost = estimateMmRoundTripCostPct(cfg.quoteSlippageBps ?? MM_DEFAULTS.quoteSlippageBps);
  const buffer = Number(cfg.minEdgeBufferPct ?? MM_DEFAULTS.minEdgeBufferPct);
  const minHalf = Number(cfg.minHalfSpreadBps ?? MM_DEFAULTS.minHalfSpreadBps) / 100;
  return halfSpreadPct >= Math.max(minHalf, roundTripCost / 2 + buffer);
}

/**
 * Build symmetric grid of bid/ask limit prices around reservation price.
 * @param {object} params
 * @param {number} params.reservationPriceUsd
 * @param {number} params.halfSpreadBps
 * @param {number} params.gridLevels
 * @param {number} params.gridStepMultiplier
 * @returns {{ bids: Array<{ level: number; priceUsd: number }>; asks: Array<{ level: number; priceUsd: number }> }}
 */
export function buildQuoteGrid({
  reservationPriceUsd,
  halfSpreadBps,
  gridLevels,
  gridStepMultiplier,
}) {
  if (!(reservationPriceUsd > 0)) return { bids: [], asks: [] };

  const levels = Math.max(1, Math.floor(gridLevels));
  const stepBps = halfSpreadBps * (gridStepMultiplier ?? 1);
  const bids = [];
  const asks = [];

  for (let i = 1; i <= levels; i += 1) {
    const offsetBps = stepBps * i;
    const bidPrice = reservationPriceUsd * (1 - offsetBps / 10_000);
    const askPrice = reservationPriceUsd * (1 + offsetBps / 10_000);
    if (bidPrice > 0) bids.push({ level: i, priceUsd: bidPrice });
    if (askPrice > 0) asks.push({ level: i, priceUsd: askPrice });
  }

  return { bids, asks };
}

/**
 * Whether inventory allows placing a new buy order.
 * @param {number} inventoryUsd
 * @param {number} orderUsd
 * @param {object} cfg
 */
export function canPlaceBuy(inventoryUsd, orderUsd, cfg) {
  const maxInv = cfg.maxInventoryUsd ?? MM_DEFAULTS.maxInventoryUsd;
  return inventoryUsd + orderUsd <= maxInv * 1.05;
}

/**
 * Whether inventory allows placing a sell (must have SYRA or paired from buy).
 * @param {number} inventoryUsd
 * @param {number} orderUsd
 */
export function canPlaceSell(inventoryUsd, orderUsd) {
  return inventoryUsd >= orderUsd * 0.9;
}

/**
 * Full quote plan for one strategy.
 * @param {object} params
 * @param {object} params.cfg — resolved strategy config
 * @param {object} params.market — market snapshot
 * @param {number} params.inventoryUsd
 * @param {'low' | 'normal' | 'high'} params.volRegime
 * @param {number} params.freeCashUsd
 */
export function buildStrategyQuotePlan({ cfg, market, inventoryUsd, volRegime, freeCashUsd }) {
  const baseHalfSpread = cfg.volAdaptive
    ? applyVolSpreadMultiplier(cfg.spreadBps, volRegime, cfg)
    : cfg.spreadBps;

  if (!passesCostAwareSpreadGate(baseHalfSpread, cfg)) {
    return { skipped: true, reason: "spread_below_cost_floor", halfSpreadBps: baseHalfSpread };
  }

  const reservation = computeReservationPrice({
    midPriceUsd: market.midPriceUsd,
    inventoryUsd,
    maxInventoryUsd: cfg.maxInventoryUsd,
    targetInventoryUsd: cfg.targetInventoryUsd,
    inventorySkewFactor: cfg.inventorySkewFactor,
  });

  if (!(reservation > 0)) {
    return { skipped: true, reason: "invalid_reservation" };
  }

  const grid = buildQuoteGrid({
    reservationPriceUsd: reservation,
    halfSpreadBps: baseHalfSpread,
    gridLevels: cfg.gridLevels,
    gridStepMultiplier: cfg.gridStepMultiplier,
  });

  const deployBudget = freeCashUsd * (cfg.deploySlicePct ?? MM_DEFAULTS.deploySlicePct);
  const orderSize = Math.min(cfg.orderSizeUsd, deployBudget / Math.max(1, grid.bids.length));

  if (orderSize < (cfg.minNotionalUsd ?? MM_DEFAULTS.minNotionalUsd)) {
    return { skipped: true, reason: "insufficient_cash" };
  }

  /** @type {Array<{ side: 'buy' | 'sell'; level: number; priceUsd: number; notionalUsd: number }>} */
  const orders = [];

  for (const bid of grid.bids) {
    if (!canPlaceBuy(inventoryUsd, orderSize, cfg)) break;
    orders.push({ side: "buy", level: bid.level, priceUsd: bid.priceUsd, notionalUsd: orderSize });
  }

  for (const ask of grid.asks) {
    if (!canPlaceSell(inventoryUsd, orderSize)) continue;
    orders.push({ side: "sell", level: ask.level, priceUsd: ask.priceUsd, notionalUsd: orderSize });
  }

  if (inventoryUsd > cfg.maxInventoryUsd * 0.7) {
    const sellOnly = orders.filter((o) => o.side === "sell");
    if (sellOnly.length > 0) {
      return {
        skipped: false,
        reservationPriceUsd: reservation,
        halfSpreadBps: baseHalfSpread,
        volRegime,
        orders: sellOnly,
        inventorySkewed: true,
      };
    }
  }

  return {
    skipped: false,
    reservationPriceUsd: reservation,
    halfSpreadBps: baseHalfSpread,
    volRegime,
    orders,
    inventorySkewed: false,
  };
}

/**
 * Check if a resting buy would fill at current mid.
 * @param {number} limitPriceUsd
 * @param {number} midPriceUsd
 */
export function wouldBuyFill(limitPriceUsd, midPriceUsd) {
  return midPriceUsd <= limitPriceUsd * 1.001;
}

/**
 * Check if a resting sell would fill at current mid.
 * @param {number} limitPriceUsd
 * @param {number} midPriceUsd
 */
export function wouldSellFill(limitPriceUsd, midPriceUsd) {
  return midPriceUsd >= limitPriceUsd * 0.999;
}
