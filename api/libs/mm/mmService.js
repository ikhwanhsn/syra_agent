/**
 * SYRA market-making service — paper trading with Jupiter-quote fills.
 */
import MmState from "../../models/MmState.js";
import MmRun from "../../models/MmRun.js";
import MmLearningState from "../../models/MmLearningState.js";
import {
  mmConfigFromEnv,
  MM_DEFAULTS,
  MM_STRATEGY_POPULATION,
  projectCreatorFeeUsd,
  resolveMmUniverse,
  resolveStrategyConfig,
} from "../../config/mmAgentConfig.js";
import {
  roundUsd,
  computeAgentEquityFromRealizedPnl,
  computeAgentReturnPct,
  computeAgentCashFromEquity,
  TRADING_EXPERIMENT_STARTING_USD,
} from "../../config/tradingExperimentSim.js";
import {
  detectVolRegime,
  fetchMmMarketSnapshot,
  syraRawToUsd,
} from "./mmPriceEngine.js";
import {
  buildStrategyQuotePlan,
  wouldBuyFill,
  wouldSellFill,
} from "./mmStrategyEngine.js";
import { quoteBuyFill, quoteSellFill } from "./mmFillEngine.js";
import {
  getEffectiveMmConfig,
  getMmLearningSnapshot,
  getPromotedStrategyId,
  isStrategyOnCooldown,
  runMmLearning,
} from "./mmLearningService.js";
import { randomUUID } from "node:crypto";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

/** @type {Promise<{ bootstrapped: true }> | null} */
let bootPromise = null;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

function mergedSimConfig(stateDoc) {
  const cfg = mmConfigFromEnv();
  const s = stateDoc?.simConfig || {};
  return {
    startingBankUsd: toNum(s.startingBankUsd, cfg.startingBankUsd),
    spreadBps: toNum(s.spreadBps, cfg.spreadBps),
    orderSizeUsd: toNum(s.orderSizeUsd, cfg.orderSizeUsd),
    gridLevels: toNum(s.gridLevels, cfg.gridLevels),
    maxInventoryUsd: toNum(s.maxInventoryUsd, cfg.maxInventoryUsd),
    minEdgeBufferPct: toNum(s.minEdgeBufferPct, cfg.minEdgeBufferPct),
    quoteSlippageBps: toNum(s.quoteSlippageBps, cfg.quoteSlippageBps),
    creatorFeeBps: cfg.creatorFeeBps,
    ...MM_DEFAULTS,
    startingBankUsd: toNum(s.startingBankUsd, cfg.startingBankUsd),
    spreadBps: toNum(s.spreadBps, cfg.spreadBps),
    maxInventoryUsd: toNum(s.maxInventoryUsd, cfg.maxInventoryUsd),
  };
}

export async function ensureMmBootstrapped() {
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    const cfg = mmConfigFromEnv();
    await MmState.findOneAndUpdate(
      { _id: "singleton" },
      {
        $setOnInsert: {
          title: "SYRA market maker",
          startedAt: new Date(),
          cashUsd: cfg.startingBankUsd,
          startingBankUsd: cfg.startingBankUsd,
          syraInventoryRaw: "0",
          syraInventoryUsd: 0,
          realizedPnlUsd: 0,
          cumulativeVolumeUsd: 0,
          roundTripsCompleted: 0,
          activeStrategyId: "adaptive",
          simConfig: { ...MM_DEFAULTS, startingBankUsd: cfg.startingBankUsd },
        },
      },
      { upsert: true, new: true },
    );
    return { bootstrapped: true };
  })().finally(() => {
    bootPromise = null;
  });

  return bootPromise;
}

/**
 * @param {import('../../models/MmState.js').default | Record<string, unknown>} state
 * @param {number} [midPriceUsd]
 */
async function computeLedger(state, midPriceUsd) {
  const cfg = mergedSimConfig(state);
  const syraRaw = String(state?.syraInventoryRaw ?? "0");
  const price = midPriceUsd ?? toNum(state?.lastMarketSnapshot?.midPriceUsd);
  const inventoryUsd = price > 0 ? syraRawToUsd(syraRaw, price) : toNum(state?.syraInventoryUsd);

  const [restingAgg, closedAgg, todayAgg] = await Promise.all([
    MmRun.aggregate([
      { $match: { status: { $in: ["resting", "filled"] } } },
      {
        $group: {
          _id: null,
          restingCount: { $sum: { $cond: [{ $eq: ["$status", "resting"] }, 1, 0] } },
          filledCount: { $sum: { $cond: [{ $eq: ["$status", "filled"] }, 1, 0] } },
          deployedUsd: { $sum: { $ifNull: ["$notionalUsd", 0] } },
        },
      },
    ]),
    MmRun.aggregate([
      { $match: { status: "closed", resolution: "round_trip_complete" } },
      {
        $group: {
          _id: null,
          realizedPnlUsd: { $sum: { $ifNull: ["$simPnlUsd", 0] } },
          cumulativeVolumeUsd: { $sum: { $ifNull: ["$volumeUsd", 0] } },
          roundTrips: { $sum: 1 },
          profitable: { $sum: { $cond: [{ $gte: ["$simPnlUsd", 0] }, 1, 0] } },
          losing: { $sum: { $cond: [{ $lt: ["$simPnlUsd", 0] }, 1, 0] } },
        },
      },
    ]),
    MmRun.aggregate([
      {
        $match: {
          status: "closed",
          resolvedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      },
      {
        $group: {
          _id: null,
          volumeUsd: { $sum: { $ifNull: ["$volumeUsd", 0] } },
          pnlUsd: { $sum: { $ifNull: ["$simPnlUsd", 0] } },
          roundTrips: { $sum: 1 },
        },
      },
    ]),
  ]);

  const resting = restingAgg[0] ?? { restingCount: 0, filledCount: 0, deployedUsd: 0 };
  const closed = closedAgg[0] ?? {
    realizedPnlUsd: 0,
    cumulativeVolumeUsd: 0,
    roundTrips: 0,
    profitable: 0,
    losing: 0,
  };
  const today = todayAgg[0] ?? { volumeUsd: 0, pnlUsd: 0, roundTrips: 0 };

  const realizedPnlUsd = roundUsd(closed.realizedPnlUsd);
  const equityUsd = computeAgentEquityFromRealizedPnl(realizedPnlUsd);
  const deployedUsd = roundUsd(resting.deployedUsd + inventoryUsd);
  const cashUsd = computeAgentCashFromEquity(equityUsd, deployedUsd);
  const returnPct = computeAgentReturnPct(equityUsd, cfg.startingBankUsd);
  const cumulativeVolumeUsd = roundUsd(closed.cumulativeVolumeUsd);
  const projectedCreatorFeeUsd = projectCreatorFeeUsd(cumulativeVolumeUsd, cfg.creatorFeeBps);
  const todayProjectedFeeUsd = projectCreatorFeeUsd(today.volumeUsd, cfg.creatorFeeBps);
  const volumePerDollarBank =
    cfg.startingBankUsd > 0 ? roundUsd(cumulativeVolumeUsd / cfg.startingBankUsd) : 0;

  const inventoryDriftPct =
    cfg.maxInventoryUsd > 0 ? roundUsd((inventoryUsd / cfg.maxInventoryUsd) * 100) : 0;

  return {
    startingBankUsd: cfg.startingBankUsd,
    cashUsd,
    equityUsd,
    deployedUsd,
    inventoryUsd,
    inventoryDriftPct,
    syraInventoryRaw: syraRaw,
    realizedPnlUsd,
    returnPct,
    cumulativeVolumeUsd,
    projectedCreatorFeeUsd,
    volumePerDollarBank,
    roundTripsCompleted: closed.roundTrips,
    profitableRoundTrips: closed.profitable,
    losingRoundTrips: closed.losing,
    restingOrders: resting.restingCount,
    openInventoryLegs: resting.filledCount,
    today: {
      volumeUsd: roundUsd(today.volumeUsd),
      pnlUsd: roundUsd(today.pnlUsd),
      roundTrips: today.roundTrips,
      projectedCreatorFeeUsd: todayProjectedFeeUsd,
    },
  };
}

function serializeRun(r, midPriceUsd) {
  return {
    id: String(r._id),
    strategyId: r.strategyId,
    roundTripId: r.roundTripId,
    side: r.side,
    orderType: r.orderType,
    limitPriceUsd: r.limitPriceUsd,
    fillPriceUsd: r.fillPriceUsd,
    notionalUsd: r.notionalUsd,
    volumeUsd: r.volumeUsd,
    syraAmountRaw: r.syraAmountRaw,
    impactBps: r.impactBps,
    reservationPriceUsd: r.reservationPriceUsd,
    spreadBps: r.spreadBps,
    gridLevel: r.gridLevel,
    inventoryUsdAfter: r.inventoryUsdAfter,
    midPriceUsd: r.midPriceUsd,
    volRegime: r.volRegime,
    status: r.status,
    resolution: r.resolution,
    simPnlUsd: r.simPnlUsd,
    simPnlPct: r.simPnlPct,
    pairedRunId: r.pairedRunId ? String(r.pairedRunId) : null,
    quotedAt: r.quotedAt?.toISOString?.() ?? null,
    filledAt: r.filledAt?.toISOString?.() ?? null,
    resolvedAt: r.resolvedAt?.toISOString?.() ?? null,
    expiresAt: r.expiresAt?.toISOString?.() ?? null,
    currentMidUsd: midPriceUsd ?? null,
    createdAt: r.createdAt?.toISOString?.() ?? null,
  };
}

export async function getMmOverview() {
  await ensureMmBootstrapped();
  const state = await MmState.findById("singleton").lean();
  const baseCfg = mergedSimConfig(state);
  const cfg = await getEffectiveMmConfig(baseCfg);
  const promotedId = await getPromotedStrategyId();

  let market = state?.lastMarketSnapshot ?? null;
  try {
    market = await fetchMmMarketSnapshot(12);
  } catch {
    market = state?.lastMarketSnapshot ?? null;
  }

  const midPrice = market?.midPriceUsd ?? null;
  const ledger = await computeLedger(state, midPrice);

  const [restingRuns, recentClosed, quoteBook] = await Promise.all([
    MmRun.find({ status: { $in: ["resting", "filled"] } })
      .sort({ quotedAt: -1 })
      .limit(30)
      .lean(),
    MmRun.find({ status: "closed" }).sort({ resolvedAt: -1 }).limit(25).lean(),
    Promise.resolve(state?.lastQuoteBook ?? null),
  ]);

  const universe = resolveMmUniverse();
  const priceHistory = Array.isArray(state?.priceHistory) ? state.priceHistory : [];
  const vol = detectVolRegime(priceHistory, cfg);

  return {
    title: state?.title ?? "SYRA market maker",
    startedAt: state?.startedAt?.toISOString?.() ?? null,
    mode: "paper",
    simConfig: cfg,
    promotedStrategyId: promotedId,
    activeStrategyId: state?.activeStrategyId ?? promotedId,
    ledger,
    market: market
      ? {
          ...market,
          volRegime: vol.regime,
          volPct: vol.volPct,
        }
      : null,
    universe: {
      symbol: universe.symbol,
      mint: universe.mint,
      quoteMint: universe.quoteMint,
      priceUsd: midPrice,
    },
    quoteBook,
    restingRuns: restingRuns.map((r) => serializeRun(r, midPrice)),
    recentClosed: recentClosed.map((r) => serializeRun(r, midPrice)),
    strategyPopulation: MM_STRATEGY_POPULATION.map((s) => ({
      id: s.id,
      name: s.name,
      spreadBps: s.spreadBps,
      orderSizeUsd: s.orderSizeUsd,
      gridLevels: s.gridLevels,
    })),
    dataSources: {
      prices: "Jupiter Swap v1 paired probe quotes",
      fills: "Jupiter Swap v1 quotes",
      venue: "Solana onchain (paper)",
      token: "SYRA pump.fun",
    },
    lastQuoteAt: state?.lastQuoteAt?.toISOString?.() ?? null,
    lastResolveAt: state?.lastResolveAt?.toISOString?.() ?? null,
  };
}

export async function listMmRuns({ limit = 50, offset = 0, status } = {}) {
  await ensureMmBootstrapped();
  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);
  /** @type {Record<string, unknown>} */
  const filter = {};
  if (status) filter.status = status;

  const state = await MmState.findById("singleton").lean();
  const midPrice = state?.lastMarketSnapshot?.midPriceUsd ?? null;

  const [runs, total] = await Promise.all([
    MmRun.find(filter).sort({ createdAt: -1 }).skip(off).limit(lim).lean(),
    MmRun.countDocuments(filter),
  ]);

  return {
    runs: runs.map((r) => serializeRun(r, midPrice)),
    total,
  };
}

export async function getMmEquityHistory() {
  await ensureMmBootstrapped();
  const cfg = mergedSimConfig(await MmState.findById("singleton").lean());
  const runs = await MmRun.find({
    status: "closed",
    resolution: "round_trip_complete",
    resolvedAt: { $ne: null },
  })
    .sort({ resolvedAt: 1 })
    .select("resolvedAt simPnlUsd")
    .lean();

  /** @type {Array<{ ts: string; equityUsd: number; pnlUsd: number }>} */
  const points = [];
  let cumPnl = 0;
  for (const run of runs) {
    cumPnl += toNum(run.simPnlUsd, 0);
    points.push({
      ts: run.resolvedAt.toISOString(),
      equityUsd: roundUsd(cfg.startingBankUsd + cumPnl),
      pnlUsd: roundUsd(cumPnl),
    });
  }

  return { points, startingBankUsd: cfg.startingBankUsd };
}

export async function getMmVolumeHistory() {
  await ensureMmBootstrapped();
  const runs = await MmRun.find({
    status: "closed",
    resolution: "round_trip_complete",
    resolvedAt: { $ne: null },
  })
    .sort({ resolvedAt: 1 })
    .select("resolvedAt volumeUsd simPnlUsd")
    .lean();

  const cfg = mergedSimConfig(await MmState.findById("singleton").lean());

  /** @type {Array<{ ts: string; volumeUsd: number; cumulativeVolumeUsd: number; projectedFeeUsd: number }>} */
  const points = [];
  let cumVol = 0;
  for (const run of runs) {
    cumVol += toNum(run.volumeUsd, 0);
    points.push({
      ts: run.resolvedAt.toISOString(),
      volumeUsd: roundUsd(run.volumeUsd),
      cumulativeVolumeUsd: roundUsd(cumVol),
      projectedFeeUsd: projectCreatorFeeUsd(cumVol, cfg.creatorFeeBps),
    });
  }

  return { points, creatorFeeBps: cfg.creatorFeeBps };
}

export async function getMmLearning() {
  await ensureMmBootstrapped();
  const state = await MmState.findById("singleton").lean();
  const baseCfg = mergedSimConfig(state);
  return getMmLearningSnapshot(baseCfg);
}

export { runMmLearning };

export async function runMmQuoteCycle() {
  await ensureMmBootstrapped();
  const state = await MmState.findById("singleton");
  if (!state) return { skipped: true, reason: "no_state" };

  const baseCfg = mergedSimConfig(state);
  const effectiveCfg = await getEffectiveMmConfig(baseCfg);
  const promotedId = await getPromotedStrategyId();

  let market;
  try {
    market = await fetchMmMarketSnapshot(12);
  } catch (e) {
    return { skipped: true, reason: "price_probe_failed", error: e instanceof Error ? e.message : String(e) };
  }

  const priceHistory = [...(state.priceHistory ?? []), market.midPriceUsd].slice(-30);
  const vol = detectVolRegime(priceHistory, effectiveCfg);
  const inventoryUsd = syraRawToUsd(state.syraInventoryRaw ?? "0", market.midPriceUsd);
  const ledger = await computeLedger(state, market.midPriceUsd);
  const freeCash = ledger.cashUsd;

  const now = Date.now();
  await MmRun.updateMany(
    {
      status: "resting",
      expiresAt: { $lte: new Date(now) },
    },
    {
      $set: { status: "cancelled", resolution: "expired", resolvedAt: new Date() },
    },
  );

  const restingCount = await MmRun.countDocuments({ status: "resting" });
  const maxResting = effectiveCfg.maxRestingPerStrategy * MM_STRATEGY_POPULATION.length;
  if (restingCount >= maxResting) {
    return { skipped: true, reason: "max_resting_orders", restingCount };
  }

  /** @type {Array<{ strategyId: string; orders: number }>} */
  const quoted = [];
  /** @type {Array<{ strategyId: string; reason: string }>} */
  const skipped = [];
  const errors = [];

  /** @type {Array<{ strategyId: string; side: string; level: number; priceUsd: number; notionalUsd: number }>} */
  const quoteBookItems = [];

  for (const strategy of MM_STRATEGY_POPULATION) {
    if (await isStrategyOnCooldown(strategy.id)) {
      skipped.push({ strategyId: strategy.id, reason: "strategy_cooldown" });
      continue;
    }

    const strategyCfg = resolveStrategyConfig(
      {
        ...strategy,
        spreadBps: strategy.id === promotedId ? effectiveCfg.spreadBps : strategy.spreadBps,
        orderSizeUsd:
          strategy.id === promotedId ? effectiveCfg.orderSizeUsd : strategy.orderSizeUsd,
        gridLevels: strategy.id === promotedId ? effectiveCfg.gridLevels : strategy.gridLevels,
      },
      {
        maxInventoryUsd: effectiveCfg.maxInventoryUsd,
        minEdgeBufferPct: effectiveCfg.minEdgeBufferPct,
        deploySlicePct: effectiveCfg.deploySlicePct,
      },
    );

    const plan = buildStrategyQuotePlan({
      cfg: strategyCfg,
      market,
      inventoryUsd,
      volRegime: vol.regime,
      freeCashUsd: freeCash,
    });

    if (plan.skipped) {
      skipped.push({ strategyId: strategy.id, reason: plan.reason ?? "skipped" });
      continue;
    }

    const existingResting = await MmRun.countDocuments({
      status: "resting",
      strategyId: strategy.id,
    });
    if (existingResting >= strategyCfg.maxRestingPerStrategy) {
      skipped.push({ strategyId: strategy.id, reason: "strategy_resting_cap" });
      continue;
    }

    let placed = 0;
    for (const order of plan.orders ?? []) {
      if (placed >= strategyCfg.maxRestingPerStrategy - existingResting) break;

      try {
        const expiresAt = new Date(now + strategyCfg.restingOrderTtlMs);
        await MmRun.create({
          strategyId: strategy.id,
          side: order.side,
          orderType: "resting",
          limitPriceUsd: order.priceUsd,
          notionalUsd: order.notionalUsd,
          reservationPriceUsd: plan.reservationPriceUsd,
          spreadBps: plan.halfSpreadBps,
          gridLevel: order.level,
          midPriceUsd: market.midPriceUsd,
          volRegime: plan.volRegime,
          inventoryUsdAfter: inventoryUsd,
          status: "resting",
          quotedAt: new Date(),
          expiresAt,
        });
        quoteBookItems.push({
          strategyId: strategy.id,
          side: order.side,
          level: order.level,
          priceUsd: order.priceUsd,
          notionalUsd: order.notionalUsd,
        });
        placed += 1;
      } catch (e) {
        errors.push(`${strategy.id}:${order.side}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (placed > 0) quoted.push({ strategyId: strategy.id, orders: placed });
  }

  await MmState.updateOne(
    { _id: "singleton" },
    {
      $set: {
        lastQuoteAt: new Date(),
        lastMarketSnapshot: { ...market, volRegime: vol.regime, volPct: vol.volPct },
        priceHistory,
        activeStrategyId: promotedId,
        lastQuoteBook: {
          quotedAt: new Date().toISOString(),
          midPriceUsd: market.midPriceUsd,
          halfSpreadBps: market.halfSpreadBps,
          volRegime: vol.regime,
          orders: quoteBookItems,
          quotedCount: quoteBookItems.length,
        },
        syraInventoryUsd: inventoryUsd,
      },
    },
  );

  return { quoted, skipped, errors, midPriceUsd: market.midPriceUsd };
}

export async function resolveOpenMmOrders() {
  await ensureMmBootstrapped();
  const state = await MmState.findById("singleton").lean();
  if (!state) return { resolved: 0, stillOpen: 0, errors: [] };

  let market;
  try {
    market = await fetchMmMarketSnapshot(10);
  } catch {
    market = state.lastMarketSnapshot;
  }
  if (!market?.midPriceUsd) {
    return { resolved: 0, stillOpen: 0, errors: ["no_market_price"] };
  }

  const midPrice = market.midPriceUsd;
  let syraInventoryRaw = String(state.syraInventoryRaw ?? "0");
  let inventoryUsd = syraRawToUsd(syraInventoryRaw, midPrice);

  const restingRuns = await MmRun.find({ status: "resting" }).sort({ quotedAt: 1 }).lean();
  const filledBuys = await MmRun.find({ status: "filled", side: "buy" }).lean();

  const errors = [];
  let resolved = 0;

  for (const run of restingRuns) {
    const shouldFill =
      run.side === "buy"
        ? wouldBuyFill(run.limitPriceUsd, midPrice)
        : wouldSellFill(run.limitPriceUsd, midPrice);

    if (!shouldFill) continue;

    try {
      if (run.side === "buy") {
        const fill = await quoteBuyFill({
          notionalUsd: run.notionalUsd,
          limitPriceUsd: run.limitPriceUsd,
          midPriceUsd: midPrice,
        });
        if (!fill.filled) continue;

        const roundTripId = randomUUID();
        syraInventoryRaw = String(BigInt(syraInventoryRaw) + BigInt(fill.syraAmountRaw));
        inventoryUsd = syraRawToUsd(syraInventoryRaw, midPrice);

        await MmRun.updateOne(
          { _id: run._id, status: "resting" },
          {
            $set: {
              status: "filled",
              resolution: "buy_filled",
              fillPriceUsd: fill.fillPriceUsd,
              syraAmountRaw: fill.syraAmountRaw,
              volumeUsd: fill.volumeUsd,
              impactBps: fill.impactBps,
              filledAt: new Date(),
              roundTripId,
              inventoryUsdAfter: inventoryUsd,
            },
          },
        );

        const sellLimit = run.limitPriceUsd * (1 + (run.spreadBps ?? 35) * 2 / 10_000);
        await MmRun.create({
          strategyId: run.strategyId,
          roundTripId,
          side: "sell",
          orderType: "paired",
          limitPriceUsd: sellLimit,
          notionalUsd: run.notionalUsd,
          syraAmountRaw: fill.syraAmountRaw,
          reservationPriceUsd: run.reservationPriceUsd,
          spreadBps: run.spreadBps,
          midPriceUsd: midPrice,
          volRegime: run.volRegime,
          inventoryUsdAfter: inventoryUsd,
          status: "resting",
          pairedRunId: run._id,
          quotedAt: new Date(),
          expiresAt: new Date(Date.now() + MM_DEFAULTS.restingOrderTtlMs * 2),
        });
        resolved += 1;
      } else if (run.side === "sell") {
        let syraToSell = run.syraAmountRaw;
        if (!syraToSell || syraToSell === "0") {
          if (!canSellFromInventory(syraInventoryRaw, run.notionalUsd, midPrice)) continue;
          syraToSell = usdToSyraRawForSell(run.notionalUsd, midPrice, syraInventoryRaw);
        }

        const entryNotional = run.notionalUsd;
        const fill = await quoteSellFill({
          syraAmountRaw: syraToSell,
          limitPriceUsd: run.limitPriceUsd,
          midPriceUsd: midPrice,
          entryNotionalUsd: entryNotional,
        });
        if (!fill.filled) continue;

        syraInventoryRaw = String(BigInt(syraInventoryRaw) - BigInt(syraToSell));
        if (BigInt(syraInventoryRaw) < 0n) syraInventoryRaw = "0";
        inventoryUsd = syraRawToUsd(syraInventoryRaw, midPrice);

        const simPnlUsd = roundUsd(fill.pnlUsd ?? 0);
        const simPnlPct =
          entryNotional > 0 ? roundUsd((simPnlUsd / entryNotional) * 100) : null;
        const roundTripVolume = roundUsd(entryNotional + (fill.volumeUsd ?? entryNotional));

        await MmRun.updateOne(
          { _id: run._id, status: "resting" },
          {
            $set: {
              status: "closed",
              resolution: "round_trip_complete",
              fillPriceUsd: fill.fillPriceUsd,
              syraAmountRaw: syraToSell,
              volumeUsd: roundTripVolume,
              impactBps: fill.impactBps,
              simPnlUsd,
              simPnlPct,
              filledAt: new Date(),
              resolvedAt: new Date(),
              inventoryUsdAfter: inventoryUsd,
            },
          },
        );

        if (run.pairedRunId) {
          await MmRun.updateOne(
            { _id: run.pairedRunId, status: "filled" },
            { $set: { status: "closed", resolution: "round_trip_complete", resolvedAt: new Date() } },
          );
        }

        await MmState.updateOne(
          { _id: "singleton" },
          {
            $inc: {
              roundTripsCompleted: 1,
              cumulativeVolumeUsd: roundTripVolume,
              realizedPnlUsd: simPnlUsd,
            },
          },
        );

        resolved += 1;
      }
    } catch (e) {
      errors.push(`${run.strategyId}:${run.side}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  await MmState.updateOne(
    { _id: "singleton" },
    {
      $set: {
        lastResolveAt: new Date(),
        syraInventoryRaw,
        syraInventoryUsd: inventoryUsd,
        lastMarketSnapshot: market,
      },
    },
  );

  if (resolved > 0) {
    runMmLearning().catch((err) => {
      console.warn("[MM] post-resolve learning failed:", err?.message || err);
    });
  }

  const stillOpen =
    (await MmRun.countDocuments({ status: "resting" })) +
    (await MmRun.countDocuments({ status: "filled" }));

  return { resolved, stillOpen, errors, filledBuysPending: filledBuys.length };
}

function canSellFromInventory(syraRaw, notionalUsd, priceUsd) {
  const invUsd = syraRawToUsd(syraRaw, priceUsd);
  return invUsd >= notionalUsd * 0.9;
}

function usdToSyraRawForSell(notionalUsd, priceUsd, syraInventoryRaw) {
  const needed = Math.floor((notionalUsd / priceUsd) * 10 ** 9);
  const available = BigInt(syraInventoryRaw || "0");
  const neededBn = BigInt(needed);
  return String(available < neededBn ? available : neededBn);
}

export async function resetMmFromScratch(opts = {}) {
  const [runsDeleted] = await Promise.all([
    MmRun.deleteMany({}),
    MmLearningState.deleteMany({}),
  ]);

  const cfg = mmConfigFromEnv();
  const title =
    typeof opts.title === "string" && opts.title.trim()
      ? opts.title.trim()
      : "SYRA market maker";

  await MmState.findOneAndUpdate(
    { _id: "singleton" },
    {
      $set: {
        title,
        startedAt: new Date(),
        cashUsd: cfg.startingBankUsd,
        startingBankUsd: cfg.startingBankUsd,
        syraInventoryRaw: "0",
        syraInventoryUsd: 0,
        realizedPnlUsd: 0,
        cumulativeVolumeUsd: 0,
        roundTripsCompleted: 0,
        activeStrategyId: "adaptive",
        lastQuoteAt: null,
        lastResolveAt: null,
        lastMarketSnapshot: null,
        lastQuoteBook: null,
        priceHistory: [],
        simConfig: { ...MM_DEFAULTS, startingBankUsd: cfg.startingBankUsd },
      },
    },
    { upsert: true, new: true },
  );

  return {
    runsDeleted: runsDeleted.deletedCount ?? 0,
    startingBankUsd: cfg.startingBankUsd,
    title,
  };
}
