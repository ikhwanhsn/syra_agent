/**
 * Scalper agent service — paper trading with Jupiter-quote fills and hybrid opportunity feed.
 */
import ScalperState from "../../models/ScalperState.js";
import ScalperRun from "../../models/ScalperRun.js";
import ScalperLearningState from "../../models/ScalperLearningState.js";
import {
  scalperConfigFromEnv,
  resolveScalperUniverse,
  SCALPER_DEFAULTS,
} from "../../config/scalperConfig.js";
import {
  TRADING_EXPERIMENT_STARTING_USD,
  roundUsd,
  computeAgentEquityFromRealizedPnl,
  computeAgentReturnPct,
  computeAgentCashFromEquity,
} from "../../config/tradingExperimentSim.js";
import { scanScalperOpportunities } from "./scalperOpportunityScanner.js";
import { quoteEntryFill, quoteExitFill, usdToQuoteRawAmount } from "./scalperFillEngine.js";
import { fetchPythBtcSpotUsd } from "./pythPriceFeed.js";
import { fetchJupiterPricesForMints } from "../stocksPriceFeed.js";
import {
  applySourceScoreMultiplier,
  computeConvictionNotionalSlice,
  getEffectiveScalperConfig,
  getScalperLearningSnapshot,
  isOnLearnedCooldown,
  passesCostAwareEdgeGate,
  runScalperLearning,
} from "./scalperLearningService.js";
import {
  computeDynamicTradeLevels,
  computeTrailingStop,
  passesSelectivityGate,
  priceLevelsFromPct,
  shouldCutStaleLoser,
  shouldEarlyExitMomentumFade,
} from "./scalperSignalEngine.js";

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
  const cfg = scalperConfigFromEnv();
  const s = stateDoc?.simConfig || {};
  // Prefer live env defaults over stale DB simConfig so profitability upgrades apply.
  // Explicit learning overrides still win via getEffectiveScalperConfig.
  return {
    startingBankUsd: toNum(s.startingBankUsd, cfg.startingBankUsd),
    maxConcurrentPositions: cfg.maxConcurrentPositions,
    notionalSlicePct: cfg.notionalSlicePct,
    minNotionalSlicePct: cfg.minNotionalSlicePct,
    takeProfitPct: cfg.takeProfitPct,
    stopLossPct: cfg.stopLossPct,
    maxHoldMinutes: cfg.maxHoldMinutes,
    minOpportunityScore: cfg.minOpportunityScore,
    minEdgeBufferPct: cfg.minEdgeBufferPct,
    quoteSlippageBps: cfg.quoteSlippageBps,
    trailActivatePct: cfg.trailActivatePct,
    trailDistancePct: cfg.trailDistancePct,
    breakevenActivatePct: cfg.breakevenActivatePct,
    profitLockGainPct: cfg.profitLockGainPct,
    profitLockGivebackPct: cfg.profitLockGivebackPct,
    maxEntryImpactBps: cfg.maxEntryImpactBps,
    minSoloScore: cfg.minSoloScore,
  };
}

export async function ensureScalperBootstrapped() {
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    await ScalperState.findOneAndUpdate(
      { _id: "singleton" },
      {
        $setOnInsert: {
          title: "Scalper agent",
          startedAt: new Date(),
          cashUsd: TRADING_EXPERIMENT_STARTING_USD,
          startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
          realizedPnlUsd: 0,
          simConfig: { ...SCALPER_DEFAULTS },
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
 * @returns {Promise<Record<string, number>>}
 */
async function fetchCurrentPrices() {
  const universe = resolveScalperUniverse();
  const equityMints = universe.filter((u) => u.assetClass === "equity").map((u) => u.mint);
  const [pythSpot, jupPrices] = await Promise.all([
    fetchPythBtcSpotUsd(),
    fetchJupiterPricesForMints(equityMints),
  ]);

  /** @type {Record<string, number>} */
  const out = {};
  if (pythSpot?.priceUsd > 0) out.cbBTC = pythSpot.priceUsd;
  for (const entry of universe) {
    if (entry.assetClass === "equity" && jupPrices[entry.mint] > 0) {
      out[entry.symbol] = jupPrices[entry.mint];
    }
  }
  return out;
}

/**
 * @param {import('../../models/ScalperState.js').default | Record<string, unknown>} state
 */
async function computeLedger(state) {
  const cfg = mergedSimConfig(state);
  const [openAgg, settledAgg] = await Promise.all([
    ScalperRun.aggregate([
      { $match: { status: "open" } },
      {
        $group: {
          _id: null,
          openPositions: { $sum: 1 },
          deployedUsd: { $sum: { $ifNull: ["$notionalUsd", 0] } },
        },
      },
    ]),
    ScalperRun.aggregate([
      { $match: { status: { $in: ["win", "loss", "expired"] } } },
      {
        $group: {
          _id: null,
          realizedPnlUsd: { $sum: { $ifNull: ["$simPnlUsd", 0] } },
          wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ["$status", "loss"] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } },
          totalTrades: { $sum: 1 },
        },
      },
    ]),
  ]);

  const open = openAgg[0] ?? { openPositions: 0, deployedUsd: 0 };
  const settled = settledAgg[0] ?? {
    realizedPnlUsd: 0,
    wins: 0,
    losses: 0,
    expired: 0,
    totalTrades: 0,
  };

  const realizedPnlUsd = roundUsd(settled.realizedPnlUsd);
  const equityUsd = computeAgentEquityFromRealizedPnl(realizedPnlUsd);
  const deployedUsd = roundUsd(open.deployedUsd);
  const cashUsd = computeAgentCashFromEquity(equityUsd, deployedUsd);
  const returnPct = computeAgentReturnPct(equityUsd, cfg.startingBankUsd);
  const decided = settled.wins + settled.losses;
  const winRate = decided > 0 ? settled.wins / decided : null;

  return {
    startingBankUsd: cfg.startingBankUsd,
    cashUsd,
    equityUsd,
    deployedUsd,
    realizedPnlUsd,
    returnPct,
    openPositions: open.openPositions,
    wins: settled.wins,
    losses: settled.losses,
    expired: settled.expired,
    totalTrades: settled.totalTrades,
    winRate,
    winRatePct: winRate != null ? roundUsd(winRate * 100) : null,
  };
}

function serializeRun(r, priceMap = {}) {
  const currentPrice = priceMap[r.symbol] ?? null;
  let unrealizedPnlUsd = null;
  let unrealizedPnlPct = null;
  if (r.status === "open" && currentPrice > 0 && r.entryPriceUsd > 0) {
    unrealizedPnlUsd = roundUsd(r.notionalUsd * (currentPrice / r.entryPriceUsd - 1));
    unrealizedPnlPct = roundUsd((currentPrice / r.entryPriceUsd - 1) * 100);
  }

  return {
    id: String(r._id),
    symbol: r.symbol,
    mint: r.mint,
    assetClass: r.assetClass,
    side: r.side,
    source: r.source,
    opportunityScore: r.opportunityScore,
    confluenceCount: r.confluenceCount ?? 1,
    rationale: r.rationale,
    notionalUsd: r.notionalUsd,
    entryPriceUsd: r.entryPriceUsd,
    entryFillSource: r.entryFillSource,
    entryImpactBps: r.entryImpactBps,
    takeProfitPriceUsd: r.takeProfitPriceUsd,
    stopLossPriceUsd: r.stopLossPriceUsd,
    exitPriceUsd: r.exitPriceUsd,
    exitFillSource: r.exitFillSource,
    exitImpactBps: r.exitImpactBps,
    currentPriceUsd: currentPrice,
    unrealizedPnlUsd,
    unrealizedPnlPct,
    status: r.status,
    resolution: r.resolution,
    simPnlUsd: r.simPnlUsd,
    simPnlPct: r.simPnlPct,
    openedAt: r.openedAt?.toISOString?.() ?? null,
    resolvedAt: r.resolvedAt?.toISOString?.() ?? null,
    maxHoldUntil: r.maxHoldUntil?.toISOString?.() ?? null,
    createdAt: r.createdAt?.toISOString?.() ?? null,
  };
}

export async function getScalperOverview() {
  await ensureScalperBootstrapped();
  const state = await ScalperState.findById("singleton").lean();
  const baseCfg = mergedSimConfig(state);
  const cfg = await getEffectiveScalperConfig(baseCfg);
  const ledger = await computeLedger(state);
  const priceMap = await fetchCurrentPrices();

  const [openRuns, recentClosed, todayStats] = await Promise.all([
    ScalperRun.find({ status: "open" }).sort({ openedAt: -1 }).limit(20).lean(),
    ScalperRun.find({ status: { $in: ["win", "loss", "expired"] } })
      .sort({ resolvedAt: -1 })
      .limit(20)
      .lean(),
    ScalperRun.aggregate([
      {
        $match: {
          status: { $in: ["win", "loss", "expired"] },
          resolvedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          pnlUsd: { $sum: { $ifNull: ["$simPnlUsd", 0] } },
          avgHoldMs: { $avg: { $subtract: ["$resolvedAt", "$openedAt"] } },
        },
      },
    ]),
  ]);

  const today = todayStats[0] ?? { count: 0, pnlUsd: 0, avgHoldMs: null };
  const unrealizedPnlUsd = openRuns.reduce((acc, r) => {
    const px = priceMap[r.symbol];
    if (!(px > 0) || !(r.entryPriceUsd > 0)) return acc;
    return acc + r.notionalUsd * (px / r.entryPriceUsd - 1);
  }, 0);

  const universe = resolveScalperUniverse();

  return {
    title: state?.title ?? "Scalper agent",
    startedAt: state?.startedAt?.toISOString?.() ?? null,
    simConfig: cfg,
    ledger: {
      ...ledger,
      unrealizedPnlUsd: roundUsd(unrealizedPnlUsd),
      totalPnlUsd: roundUsd(ledger.realizedPnlUsd + unrealizedPnlUsd),
    },
    today: {
      trades: today.count,
      pnlUsd: roundUsd(today.pnlUsd),
      avgHoldMinutes:
        today.avgHoldMs != null && Number.isFinite(today.avgHoldMs)
          ? roundUsd(today.avgHoldMs / 60_000)
          : null,
    },
    universe: universe.map((u) => ({
      symbol: u.symbol,
      mint: u.mint,
      assetClass: u.assetClass,
      priceUsd: priceMap[u.symbol] ?? null,
    })),
    opportunityFeed: state?.lastOpportunityScan ?? null,
    openRuns: openRuns.map((r) => serializeRun(r, priceMap)),
    recentClosed: recentClosed.map((r) => serializeRun(r, priceMap)),
    dataSources: {
      btcPrice: "Pyth Hermes + Benchmarks",
      equityPrices: "Jupiter Price API v2",
      fills: "Jupiter Swap v1 quotes",
      venue: "Solana onchain only",
    },
    lastSignalAt: state?.lastSignalAt?.toISOString?.() ?? null,
    lastResolveAt: state?.lastResolveAt?.toISOString?.() ?? null,
  };
}

export async function listScalperRuns({ limit = 50, offset = 0, status } = {}) {
  await ensureScalperBootstrapped();
  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);
  /** @type {Record<string, unknown>} */
  const filter = {};
  if (status) filter.status = status;

  const [runs, total, priceMap] = await Promise.all([
    ScalperRun.find(filter).sort({ createdAt: -1 }).skip(off).limit(lim).lean(),
    ScalperRun.countDocuments(filter),
    fetchCurrentPrices(),
  ]);

  return {
    runs: runs.map((r) => serializeRun(r, priceMap)),
    total,
  };
}

export async function getScalperLearning() {
  await ensureScalperBootstrapped();
  const state = await ScalperState.findById("singleton").lean();
  const baseCfg = mergedSimConfig(state);
  return getScalperLearningSnapshot(baseCfg);
}

export { runScalperLearning };

export async function runScalperSignalCycle() {
  await ensureScalperBootstrapped();
  const state = await ScalperState.findById("singleton");
  if (!state) return { skipped: true, reason: "no_state" };

  const baseCfg = mergedSimConfig(state);
  const cfg = await getEffectiveScalperConfig(baseCfg);
  const scan = await scanScalperOpportunities();
  const ledger = await computeLedger(state);

  const openCount = await ScalperRun.countDocuments({ status: "open" });
  const openSymbols = new Set(
    (await ScalperRun.find({ status: "open" }).select("symbol").lean()).map((r) => r.symbol),
  );

  const cooldowns = state.symbolCooldowns && typeof state.symbolCooldowns === "object"
    ? state.symbolCooldowns
    : {};

  /** @type {Array<{ symbol: string; reason: string }>} */
  const skipped = [];
  /** @type {Array<{ symbol: string; source: string; notionalUsd: number; confluenceCount: number }>} */
  const opened = [];
  const errors = [];

  const cfgEnv = scalperConfigFromEnv();
  const freeCash = ledger.cashUsd;
  let remainingCash = freeCash;

  for (const opp of scan.opportunities) {
    if (openCount + opened.length >= cfg.maxConcurrentPositions) break;
    if (opp.side !== "long") {
      skipped.push({ symbol: opp.symbol, reason: "not_long" });
      continue;
    }

    const learnedCooldown = await isOnLearnedCooldown(opp.source, opp.symbol);
    if (learnedCooldown) {
      skipped.push({ symbol: opp.symbol, reason: learnedCooldown });
      continue;
    }

    const adjustedScore = await applySourceScoreMultiplier(opp.source, opp.score);
    const confluenceCount = Number(opp.meta?.confluenceCount ?? 1);
    const confluenceBoost = confluenceCount >= 2 ? 0.05 : confluenceCount >= 3 ? 0.08 : 0;
    const effectiveScore = Math.min(0.99, adjustedScore + confluenceBoost);

    if (
      !passesSelectivityGate(
        effectiveScore,
        opp.source,
        confluenceCount,
        cfg.minOpportunityScore,
      )
    ) {
      skipped.push({ symbol: opp.symbol, reason: "selectivity_gate" });
      continue;
    }

    if (!passesCostAwareEdgeGate(cfg, effectiveScore, confluenceCount)) {
      skipped.push({ symbol: opp.symbol, reason: "insufficient_edge_vs_cost" });
      continue;
    }

    if (openSymbols.has(opp.symbol)) {
      skipped.push({ symbol: opp.symbol, reason: "already_open" });
      continue;
    }

    const cooldownUntil = cooldowns[opp.symbol];
    if (cooldownUntil && Date.now() < Number(cooldownUntil)) {
      skipped.push({ symbol: opp.symbol, reason: "cooldown" });
      continue;
    }

    const midPrice = scan.priceMap[opp.symbol];
    if (!(midPrice > 0)) {
      skipped.push({ symbol: opp.symbol, reason: "no_price" });
      continue;
    }

    // Prefer confluence: if we already opened a solo trade this cycle, skip more solos
    if (confluenceCount < 2 && opened.some((o) => o.confluenceCount < 2)) {
      skipped.push({ symbol: opp.symbol, reason: "prefer_confluence_slot" });
      continue;
    }

    const convictionSlice = await computeConvictionNotionalSlice({
      score: effectiveScore,
      minScore: cfg.minOpportunityScore,
      source: opp.source,
      notionalSlicePct: cfg.notionalSlicePct,
      minNotionalSlicePct: baseCfg.minNotionalSlicePct ?? SCALPER_DEFAULTS.minNotionalSlicePct,
      confluenceCount,
    });

    const notionalUsd = roundUsd(
      Math.min(remainingCash * convictionSlice, remainingCash),
    );
    if (notionalUsd < SCALPER_DEFAULTS.minNotionalUsd) {
      skipped.push({ symbol: opp.symbol, reason: "insufficient_cash" });
      continue;
    }

    const universeEntry = resolveScalperUniverse().find((u) => u.symbol === opp.symbol);
    if (!universeEntry) continue;

    try {
      const amountRaw = usdToQuoteRawAmount(notionalUsd, cfgEnv.quoteDecimals);
      const fill = await quoteEntryFill({
        inputMint: cfgEnv.quoteMint,
        outputMint: universeEntry.mint,
        amountRaw,
        outputDecimals: universeEntry.decimals,
        midPriceUsd: midPrice,
      });

      const maxImpact = cfg.maxEntryImpactBps ?? SCALPER_DEFAULTS.maxEntryImpactBps;
      if (fill.impactBps != null && fill.impactBps > maxImpact) {
        skipped.push({ symbol: opp.symbol, reason: "entry_impact_too_high" });
        continue;
      }

      const volPct = Number(opp.meta?.atrPct ?? opp.meta?.volatilityPct ?? 0.7);
      const dynamic = computeDynamicTradeLevels(cfg, volPct, confluenceCount);
      const levels = priceLevelsFromPct(
        fill.fillPriceUsd,
        dynamic.takeProfitPct,
        dynamic.stopLossPct,
        cfg.quoteSlippageBps,
      );
      const maxHoldUntil = new Date(Date.now() + dynamic.maxHoldMinutes * 60_000);

      await ScalperRun.create({
        symbol: opp.symbol,
        mint: universeEntry.mint,
        assetClass: universeEntry.assetClass,
        side: "long",
        source: opp.source,
        opportunityScore: effectiveScore,
        confluenceCount,
        rationale: opp.rationale,
        opportunitySnapshot: {
          ...(opp.meta ?? {}),
          regime: scan.regime ?? null,
        },
        notionalUsd,
        entryPriceUsd: fill.fillPriceUsd,
        entryTokenAmountRaw: fill.outAmountRaw,
        entryFillSource: fill.fillSource,
        entryImpactBps: fill.impactBps,
        entryMidPriceUsd: midPrice,
        takeProfitPriceUsd: levels.takeProfitPriceUsd,
        stopLossPriceUsd: levels.stopLossPriceUsd,
        peakPriceUsd: fill.fillPriceUsd,
        dynamicTakeProfitPct: dynamic.takeProfitPct,
        dynamicStopLossPct: dynamic.stopLossPct,
        maxHoldUntil,
        status: "open",
        openedAt: new Date(),
      });

      opened.push({
        symbol: opp.symbol,
        source: opp.source,
        notionalUsd,
        confluenceCount,
      });
      openSymbols.add(opp.symbol);
      remainingCash = roundUsd(remainingCash - notionalUsd);
    } catch (e) {
      errors.push(`${opp.symbol}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const takenKeys = new Set(opened.map((o) => o.symbol));
  const feedItems = scan.opportunities.map((opp) => ({
    ...opp,
    taken: takenKeys.has(opp.symbol),
    skippedReason: skipped.find((s) => s.symbol === opp.symbol)?.reason ?? null,
  }));

  await ScalperState.updateOne(
    { _id: "singleton" },
    {
      $set: {
        lastSignalAt: new Date(),
        simConfig: {
          ...SCALPER_DEFAULTS,
          maxConcurrentPositions: cfg.maxConcurrentPositions,
          minOpportunityScore: cfg.minOpportunityScore,
          takeProfitPct: cfg.takeProfitPct,
          stopLossPct: cfg.stopLossPct,
          maxHoldMinutes: cfg.maxHoldMinutes,
          notionalSlicePct: cfg.notionalSlicePct,
          minEdgeBufferPct: cfg.minEdgeBufferPct,
        },
        lastOpportunityScan: {
          scannedAt: scan.scannedAt,
          regime: scan.regime ?? null,
          opportunities: feedItems,
          openedCount: opened.length,
          skippedCount: skipped.length,
        },
      },
    },
  );

  return {
    scanned: scan.opportunities.length,
    opened,
    skipped,
    errors,
  };
}

export async function resolveOpenScalperRuns() {
  await ensureScalperBootstrapped();
  const state = await ScalperState.findById("singleton").lean();
  const baseCfg = mergedSimConfig(state);
  const cfg = await getEffectiveScalperConfig(baseCfg);
  const cfgEnv = scalperConfigFromEnv();

  const openRuns = await ScalperRun.find({ status: "open" })
    .select(
      "symbol mint assetClass notionalUsd entryPriceUsd entryTokenAmountRaw takeProfitPriceUsd stopLossPriceUsd peakPriceUsd trailingStopPriceUsd maxHoldUntil openedAt source",
    )
    .lean();

  if (openRuns.length === 0) {
    return { resolved: 0, stillOpen: 0, errors: [] };
  }

  const priceMap = await fetchCurrentPrices();
  /** @type {import('mongoose').AnyBulkWriteOperation[]} */
  const bulkOps = [];
  /** @type {import('mongoose').AnyBulkWriteOperation[]} */
  const trailOps = [];
  const errors = [];
  /** @type {Record<string, number>} */
  const cooldownUpdates = {};

  for (const run of openRuns) {
    const currentPrice = priceMap[run.symbol];
    if (!(currentPrice > 0)) {
      errors.push(`${run.symbol}: no_price`);
      continue;
    }

    const trail = computeTrailingStop({
      entryPriceUsd: run.entryPriceUsd,
      currentPriceUsd: currentPrice,
      peakPriceUsd: run.peakPriceUsd,
      stopLossPriceUsd: run.stopLossPriceUsd,
      trailActivatePct: cfg.trailActivatePct ?? SCALPER_DEFAULTS.trailActivatePct,
      trailDistancePct: cfg.trailDistancePct ?? SCALPER_DEFAULTS.trailDistancePct,
      breakevenActivatePct:
        cfg.breakevenActivatePct ?? SCALPER_DEFAULTS.breakevenActivatePct,
    });

    const effectiveStop = trail.effectiveStopUsd ?? run.stopLossPriceUsd;
    const peakChanged = trail.peakPriceUsd > (run.peakPriceUsd ?? run.entryPriceUsd);
    const trailChanged =
      trail.trailingStopPriceUsd != null &&
      trail.trailingStopPriceUsd !== run.trailingStopPriceUsd;

    if (peakChanged || trailChanged) {
      trailOps.push({
        updateOne: {
          filter: { _id: run._id, status: "open" },
          update: {
            $set: {
              peakPriceUsd: trail.peakPriceUsd,
              trailingStopPriceUsd: trail.trailingStopPriceUsd,
              lastEvaluatedAt: new Date(),
            },
          },
        },
      });
    }

    let status = "open";
    let resolution = null;
    const wasProtected =
      trail.trailingStopPriceUsd != null ||
      effectiveStop > run.stopLossPriceUsd;

    if (currentPrice >= run.takeProfitPriceUsd) {
      status = "win";
      resolution = "take_profit";
    } else if (currentPrice <= effectiveStop) {
      status = wasProtected && currentPrice >= run.entryPriceUsd * 0.998 ? "win" : "loss";
      resolution =
        trail.trailingStopPriceUsd != null && currentPrice > run.stopLossPriceUsd
          ? "trailing_stop"
          : wasProtected && currentPrice >= run.entryPriceUsd * 0.998
            ? "breakeven_stop"
            : "stop_loss";
    } else if (
      shouldEarlyExitMomentumFade(run.entryPriceUsd, currentPrice, trail.peakPriceUsd, {
        profitLockGainPct: cfg.profitLockGainPct ?? SCALPER_DEFAULTS.profitLockGainPct,
        profitLockGivebackPct:
          cfg.profitLockGivebackPct ?? SCALPER_DEFAULTS.profitLockGivebackPct,
      })
    ) {
      status = currentPrice > run.entryPriceUsd ? "win" : "expired";
      resolution = "profit_lock";
    } else if (
      shouldCutStaleLoser(
        run.entryPriceUsd,
        currentPrice,
        run.maxHoldUntil,
        run.openedAt,
      )
    ) {
      status = "loss";
      resolution = "stale_cut";
    } else if (run.maxHoldUntil && new Date(run.maxHoldUntil).getTime() <= Date.now()) {
      // Near TP at expiry — count as soft win if still green after costs buffer
      const pnlPct =
        run.entryPriceUsd > 0 ? (currentPrice / run.entryPriceUsd - 1) * 100 : 0;
      if (pnlPct >= 0.35) {
        status = "win";
        resolution = "time_exit_green";
      } else {
        status = "expired";
        resolution = "max_hold";
      }
    }

    if (status === "open") continue;

    try {
      const universeEntry = resolveScalperUniverse().find((u) => u.symbol === run.symbol);
      const assetDecimals = universeEntry?.decimals ?? 8;

      const fill = await quoteExitFill({
        inputMint: run.mint,
        outputMint: cfgEnv.quoteMint,
        amountRaw: run.entryTokenAmountRaw || "0",
        assetDecimals,
        midPriceUsd: currentPrice,
        entryPriceUsd: run.entryPriceUsd,
        notionalUsd: run.notionalUsd,
      });

      const simPnlUsd = roundUsd(fill.pnlUsd);
      const simPnlPct =
        run.notionalUsd > 0 ? roundUsd((simPnlUsd / run.notionalUsd) * 100) : null;

      bulkOps.push({
        updateOne: {
          filter: { _id: run._id, status: "open" },
          update: {
            $set: {
              status,
              resolution,
              exitPriceUsd: fill.fillPriceUsd,
              exitFillSource: fill.fillSource,
              exitImpactBps: fill.impactBps,
              simPnlUsd,
              simPnlPct,
              resolvedAt: new Date(),
            },
          },
        },
      });

      cooldownUpdates[run.symbol] = Date.now() + SCALPER_DEFAULTS.symbolCooldownMs;
    } catch (e) {
      errors.push(`${run.symbol}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (trailOps.length > 0) {
    await ScalperRun.bulkWrite(trailOps, { ordered: false });
  }

  if (bulkOps.length > 0) {
    await ScalperRun.bulkWrite(bulkOps, { ordered: false });

    const cooldownSet = Object.fromEntries(
      Object.entries(cooldownUpdates).map(([sym, until]) => [`symbolCooldowns.${sym}`, until]),
    );

    await ScalperState.updateOne(
      { _id: "singleton" },
      { $set: { lastResolveAt: new Date(), ...cooldownSet } },
    );

    runScalperLearning().catch((err) => {
      console.warn("[Scalper] post-resolve learning failed:", err?.message || err);
    });
  }

  const stillOpen = openRuns.length - bulkOps.length;
  return { resolved: bulkOps.length, stillOpen, errors };
}

export async function getScalperEquityHistory() {
  await ensureScalperBootstrapped();
  const cfg = mergedSimConfig(await ScalperState.findById("singleton").lean());
  const runs = await ScalperRun.find({
    status: { $in: ["win", "loss", "expired"] },
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

/**
 * Wipe all scalper paper data and learning state; bootstrap fresh singleton.
 * @param {{ title?: string }} [opts]
 */
export async function resetScalperFromScratch(opts = {}) {
  const [runsDeleted] = await Promise.all([
    ScalperRun.deleteMany({}),
    ScalperLearningState.deleteMany({}),
  ]);

  const title =
    typeof opts.title === "string" && opts.title.trim()
      ? opts.title.trim()
      : "Scalper agent";

  await ScalperState.findOneAndUpdate(
    { _id: "singleton" },
    {
      $set: {
        title,
        startedAt: new Date(),
        cashUsd: TRADING_EXPERIMENT_STARTING_USD,
        startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
        realizedPnlUsd: 0,
        openPositions: 0,
        deployedUsd: 0,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        expired: 0,
        lastSignalAt: null,
        lastResolveAt: null,
        lastOpportunityScan: null,
        symbolCooldowns: {},
        simConfig: { ...SCALPER_DEFAULTS },
      },
    },
    { upsert: true, new: true },
  );

  return {
    runsDeleted: runsDeleted.deletedCount ?? 0,
    startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
    title,
  };
}
