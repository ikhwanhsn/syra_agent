/**
 * Orchestrator for the OKX.AI Trading Hackathon agent.
 *
 * One cycle = gather Syra intelligence -> mark the book to market -> check
 * circuit breakers -> plan exits + entries under risk limits -> execute via
 * Onchain OS (or paper) -> persist positions/trades/equity snapshot.
 *
 * Lifecycle: enable/disable start/stop the loop; `kill` is a hard stop that
 * flattens on the next tick and blocks all further entries until `resume`.
 */
import { getTradingConfig } from "./tradingConfig.js";
import { rankUniverse } from "./decisionEngine.js";
import { buildTradePlan, checkCircuitBreakers } from "./riskEngine.js";
import { executeIntent } from "./onchainOsExecutor.js";
import {
  okxTradingConfigRepo,
  okxTradingPositionRepo,
  okxTradingTradeRepo,
  okxTradingSnapshotRepo,
} from "../../repositories/okxTrading/index.js";

export { isOkxTradingCronEnabled } from "./tradingConfig.js";

let sentimentFnPromise = null;
/** Lazy, optional sentiment loader — degrades to null if unavailable. */
async function getSentimentFn() {
  if (sentimentFnPromise) return sentimentFnPromise;
  sentimentFnPromise = import("../internalNewsAgent.js")
    .then((m) => (typeof m.fetchSentimentTicker === "function" ? m.fetchSentimentTicker : null))
    .catch(() => null);
  return sentimentFnPromise;
}

function utcDayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function markToMarket(positions, priceByToken) {
  let value = 0;
  for (const p of positions) {
    const price = priceByToken.get(p.token) ?? p.entryPriceUsd;
    value += (Number(p.qty) || 0) * (Number(price) || 0);
  }
  return value;
}

/**
 * Enable the loop (paper unless `live` is passed and env permits).
 */
export async function enableOkxTrading({ agentWalletAddress, live } = {}) {
  const cfg = getTradingConfig();
  const patch = {
    enabled: true,
    killed: false,
    startedAt: new Date(),
    lastHaltReason: null,
  };
  if (agentWalletAddress) patch.agentWalletAddress = agentWalletAddress;
  if (typeof live === "boolean") patch.live = live && cfg.live;
  const current = await okxTradingConfigRepo.get();
  if (current.paperCashUsd == null && !current.live) {
    patch.paperCashUsd = cfg.paperStartUsd;
    patch.startEquityUsd = cfg.paperStartUsd;
    patch.dayStartEquityUsd = cfg.paperStartUsd;
    patch.dayStartAt = new Date();
  }
  return okxTradingConfigRepo.patch(patch);
}

export async function disableOkxTrading() {
  return okxTradingConfigRepo.patch({ enabled: false });
}

/** Hard stop: block entries and flatten on the next tick. */
export async function killOkxTrading(reason = "manual_kill") {
  return okxTradingConfigRepo.patch({ killed: true, lastHaltReason: reason });
}

export async function resumeOkxTrading() {
  return okxTradingConfigRepo.patch({ killed: false, lastHaltReason: null });
}

export async function getOkxTradingState() {
  const config = await okxTradingConfigRepo.get();
  const [positions, latestSnap, tradeCount] = await Promise.all([
    okxTradingPositionRepo.listOpen(),
    okxTradingSnapshotRepo.getLatest(),
    okxTradingTradeRepo.count(),
  ]);
  return {
    config: {
      enabled: config.enabled,
      killed: config.killed,
      live: config.live,
      agentWalletAddress: config.agentWalletAddress,
      startedAt: config.startedAt,
      startEquityUsd: config.startEquityUsd,
      dayStartEquityUsd: config.dayStartEquityUsd,
      lastRunAt: config.lastRunAt,
      lastError: config.lastError,
      lastHaltReason: config.lastHaltReason,
    },
    openPositions: positions,
    latestSnapshot: latestSnap,
    validTradeCount: tradeCount,
  };
}

/**
 * Run one trading cycle. Safe to call on a timer; single-flighted via the
 * `processing` flag. Never throws — returns a summary or `{ error }`.
 */
export async function runOkxTradingCycle({ force = false } = {}) {
  const cfg = getTradingConfig();
  const config = await okxTradingConfigRepo.get();

  if (config.killed && !force) {
    // Even when killed, flatten open positions once so we stop the bleeding.
    return flattenAll({ config, cfg, reason: config.lastHaltReason || "killed" });
  }
  if (!config.enabled && !force) return { skipped: "disabled" };
  if (config.processing && !force) return { skipped: "processing" };

  await okxTradingConfigRepo.patch({ processing: true });
  try {
    const sentimentFn = await getSentimentFn();
    const positions = await okxTradingPositionRepo.listOpen();

    // Ensure held tokens are always priced even if dropped from the universe.
    const universe = Array.from(new Set([...cfg.universe, ...positions.map((p) => p.token)]));
    const candidates = await rankUniverse({
      universe,
      source: cfg.signalSource,
      bars: cfg.bars,
      sentimentFn: sentimentFn || undefined,
    });
    const priceByToken = new Map(
      candidates.filter((c) => Number.isFinite(c.priceUsd) && c.priceUsd > 0).map((c) => [c.token, c.priceUsd]),
    );

    // Baselines
    let cashUsd = config.paperCashUsd != null ? config.paperCashUsd : cfg.paperStartUsd;
    const positionsUsd = markToMarket(positions, priceByToken);
    let equityUsd = cashUsd + positionsUsd;

    const patch = {};
    if (config.startEquityUsd == null) patch.startEquityUsd = equityUsd;
    if (config.dayStartAt == null || utcDayKey(new Date(config.dayStartAt)) !== utcDayKey()) {
      patch.dayStartAt = new Date();
      patch.dayStartEquityUsd = equityUsd;
    }
    const startEquityUsd = patch.startEquityUsd ?? config.startEquityUsd ?? equityUsd;
    const dayStartEquityUsd = patch.dayStartEquityUsd ?? config.dayStartEquityUsd ?? equityUsd;

    const breaker = checkCircuitBreakers({
      equityUsd,
      dayStartEquityUsd,
      startEquityUsd,
      cfg,
    });
    if (breaker.kill) {
      await okxTradingConfigRepo.patch({ ...patch, killed: true, lastHaltReason: breaker.reason });
      return flattenAll({ config, cfg, reason: breaker.reason, priceByToken, positions });
    }

    const plan = buildTradePlan({ candidates, positions, equityUsd, cashUsd, breaker, cfg });

    const executed = { sells: [], buys: [] };

    // 1. Exits first (free up cash).
    for (const sell of plan.sells) {
      const pos = await okxTradingPositionRepo.findOpenByToken(sell.token);
      if (!pos) continue;
      const fill = executeIntent(
        { side: "sell", token: sell.token, instrument: sell.instrument, priceUsd: sell.priceUsd, qty: pos.qty },
        cfg,
      );
      const trade = await recordSell({ pos, fill, reason: sell.reason });
      if (fill.status === "filled") {
        cashUsd += fill.filledNotionalUsd - fill.feeUsd;
      }
      executed.sells.push(trade);
    }

    // Peak updates for positions we are holding through.
    const sellTokens = new Set(plan.sells.map((s) => s.token));
    for (const pos of positions) {
      if (sellTokens.has(pos.token)) continue;
      const price = priceByToken.get(pos.token);
      if (Number.isFinite(price) && price > (Number(pos.peakPriceUsd) || 0)) {
        const doc = await okxTradingPositionRepo.findOpenByToken(pos.token);
        if (doc) {
          doc.peakPriceUsd = price;
          await okxTradingPositionRepo.save(doc);
        }
      }
    }

    // 2. Entries.
    for (const buy of plan.buys) {
      if (cashUsd < cfg.minTradeUsd) break;
      const notional = Math.min(buy.notionalUsd, cashUsd - cfg.reserveUsd);
      if (notional < cfg.minTradeUsd) continue;
      const fill = executeIntent(
        { side: "buy", token: buy.token, instrument: buy.instrument, priceUsd: buy.priceUsd, notionalUsd: notional },
        cfg,
      );
      const trade = await recordBuy({ buy, fill });
      if (fill.status === "filled") {
        cashUsd -= fill.filledNotionalUsd + fill.feeUsd;
      }
      executed.buys.push(trade);
    }

    // Recompute + snapshot.
    const openNow = await okxTradingPositionRepo.listOpen();
    const positionsUsdNow = markToMarket(openNow, priceByToken);
    equityUsd = cashUsd + positionsUsdNow;
    const pnlUsd = equityUsd - startEquityUsd;
    const pnlPct = startEquityUsd > 0 ? (pnlUsd / startEquityUsd) * 100 : 0;

    await okxTradingSnapshotRepo.create({
      equityUsd,
      cashUsd,
      positionsUsd: positionsUsdNow,
      openPositions: openNow.length,
      startEquityUsd,
      pnlUsd,
      pnlPct,
      source: config.live ? "live" : "paper",
    });

    await okxTradingConfigRepo.patch({
      ...patch,
      paperCashUsd: config.live ? config.paperCashUsd : cashUsd,
      lastRunAt: new Date(),
      lastError: null,
      lastHaltReason: breaker.haltEntries ? breaker.reason : null,
      processing: false,
    });

    return {
      ok: true,
      equityUsd,
      cashUsd,
      pnlUsd,
      pnlPct,
      openPositions: openNow.length,
      breaker,
      executed: {
        sells: executed.sells.length,
        buys: executed.buys.length,
      },
      topCandidates: candidates.slice(0, 5).map((c) => ({
        token: c.token,
        score: Number(c.score?.toFixed?.(3) ?? c.score),
        side: c.side,
        priceUsd: c.priceUsd,
      })),
    };
  } catch (err) {
    await okxTradingConfigRepo.patch({
      processing: false,
      lastError: err instanceof Error ? err.message : String(err),
    });
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function flattenAll({ config, cfg, reason, priceByToken, positions }) {
  const open = positions || (await okxTradingPositionRepo.listOpen());
  if (!open.length) {
    await okxTradingConfigRepo.patch({ processing: false, lastRunAt: new Date() });
    return { ok: true, flattened: 0, reason };
  }
  let cashUsd = config.paperCashUsd != null ? config.paperCashUsd : cfg.paperStartUsd;
  let flattened = 0;
  for (const pos of open) {
    const price = priceByToken?.get(pos.token) ?? pos.peakPriceUsd ?? pos.entryPriceUsd;
    const doc = await okxTradingPositionRepo.findOpenByToken(pos.token);
    if (!doc) continue;
    const fill = executeIntent(
      { side: "sell", token: pos.token, instrument: pos.symbol, priceUsd: Number(price), qty: doc.qty },
      cfg,
    );
    await recordSell({ pos: doc, fill, reason: `flatten:${reason}` });
    if (fill.status === "filled") cashUsd += fill.filledNotionalUsd - fill.feeUsd;
    flattened += 1;
  }
  await okxTradingConfigRepo.patch({
    processing: false,
    lastRunAt: new Date(),
    paperCashUsd: config.live ? config.paperCashUsd : cashUsd,
  });
  return { ok: true, flattened, reason };
}

async function recordSell({ pos, fill, reason }) {
  const realizedPnlUsd =
    fill.status === "filled"
      ? (fill.filledPriceUsd - (Number(pos.entryPriceUsd) || 0)) * (Number(pos.qty) || 0) - (fill.feeUsd || 0)
      : null;
  if (fill.status === "filled") {
    pos.status = "closed";
    pos.closedAt = new Date();
    pos.exitPriceUsd = fill.filledPriceUsd;
    pos.realizedPnlUsd = realizedPnlUsd;
    pos.exitReason = reason;
    await okxTradingPositionRepo.save(pos);
  }
  return okxTradingTradeRepo.create({
    token: pos.token,
    symbol: pos.symbol,
    side: "sell",
    mode: fill.mode,
    status: fill.status,
    requestedNotionalUsd: (Number(pos.qty) || 0) * (fill.filledPriceUsd || pos.entryPriceUsd || 0),
    filledPriceUsd: fill.filledPriceUsd || 0,
    filledQty: fill.filledQty || 0,
    filledNotionalUsd: fill.filledNotionalUsd || 0,
    feeUsd: fill.feeUsd || 0,
    slippageBps: fill.slippageBps || 0,
    realizedPnlUsd,
    conviction: pos.conviction,
    reason,
    txHash: fill.txHash || null,
    error: fill.error || null,
  });
}

async function recordBuy({ buy, fill }) {
  if (fill.status === "filled" && fill.filledQty > 0) {
    await okxTradingPositionRepo.create({
      token: buy.token,
      symbol: buy.instrument || null,
      status: "open",
      side: "long",
      qty: fill.filledQty,
      entryPriceUsd: fill.filledPriceUsd,
      peakPriceUsd: fill.filledPriceUsd,
      notionalUsd: fill.filledNotionalUsd,
      conviction: buy.conviction,
      openedAt: new Date(),
    });
  }
  return okxTradingTradeRepo.create({
    token: buy.token,
    symbol: buy.instrument || null,
    side: "buy",
    mode: fill.mode,
    status: fill.status,
    requestedNotionalUsd: buy.notionalUsd,
    filledPriceUsd: fill.filledPriceUsd || 0,
    filledQty: fill.filledQty || 0,
    filledNotionalUsd: fill.filledNotionalUsd || 0,
    feeUsd: fill.feeUsd || 0,
    slippageBps: fill.slippageBps || 0,
    conviction: buy.conviction,
    reason: `entry score=${Number(buy.score?.toFixed?.(3) ?? buy.score)}`,
    txHash: fill.txHash || null,
    error: fill.error || null,
  });
}
