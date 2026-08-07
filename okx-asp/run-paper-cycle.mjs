#!/usr/bin/env node
/**
 * Mongo-free paper trading cycle for the OKX.AI hackathon prep.
 * Persists state to okx-asp/paper-state.json so you can iterate without Atlas.
 *
 * Usage:
 *   node okx-asp/run-paper-cycle.mjs
 *   node okx-asp/run-paper-cycle.mjs --watch   # every 5 min until Ctrl-C
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const statePath = join(root, "okx-asp", "paper-state.json");
const apiRoot = join(root, "api");

const { rankUniverse } = await import(join(apiRoot, "libs/okxTrading/decisionEngine.js"));
const { buildTradePlan, checkCircuitBreakers, evaluateExit } = await import(
  join(apiRoot, "libs/okxTrading/riskEngine.js")
);
const { simulateFill } = await import(join(apiRoot, "libs/okxTrading/onchainOsExecutor.js"));
const { getTradingConfig } = await import(join(apiRoot, "libs/okxTrading/tradingConfig.js"));

function loadState(cfg) {
  if (existsSync(statePath)) return JSON.parse(readFileSync(statePath, "utf8"));
  return {
    mode: "paper",
    startEquityUsd: cfg.paperStartUsd,
    cashUsd: cfg.paperStartUsd,
    dayStartEquityUsd: cfg.paperStartUsd,
    dayStartAt: new Date().toISOString(),
    positions: [],
    trades: [],
    snapshots: [],
    cycles: 0,
  };
}

function saveState(state) {
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function markToMarket(positions, priceByToken) {
  return positions.reduce((sum, p) => {
    const px = priceByToken.get(p.token) ?? p.entryPriceUsd;
    return sum + (Number(p.qty) || 0) * (Number(px) || 0);
  }, 0);
}

async function runOnce() {
  const cfg = getTradingConfig();
  const state = loadState(cfg);
  const today = new Date().toISOString().slice(0, 10);
  if ((state.dayStartAt || "").slice(0, 10) !== today) {
    const equity =
      state.cashUsd +
      markToMarket(state.positions, new Map(state.positions.map((p) => [p.token, p.peakPriceUsd])));
    state.dayStartAt = new Date().toISOString();
    state.dayStartEquityUsd = equity;
  }

  const universe = Array.from(new Set([...cfg.universe, ...state.positions.map((p) => p.token)]));
  const candidates = await rankUniverse({
    universe,
    source: cfg.signalSource,
    bars: cfg.bars,
  });
  const priceByToken = new Map(
    candidates.filter((c) => Number.isFinite(c.priceUsd) && c.priceUsd > 0).map((c) => [c.token, c.priceUsd]),
  );

  const positionsUsd = markToMarket(state.positions, priceByToken);
  let equityUsd = state.cashUsd + positionsUsd;
  const breaker = checkCircuitBreakers({
    equityUsd,
    dayStartEquityUsd: state.dayStartEquityUsd,
    startEquityUsd: state.startEquityUsd,
    cfg,
  });

  const plan = buildTradePlan({
    candidates,
    positions: state.positions,
    equityUsd,
    cashUsd: state.cashUsd,
    breaker,
    cfg,
  });

  const executed = { sells: [], buys: [] };

  for (const sell of plan.sells) {
    const idx = state.positions.findIndex((p) => p.token === sell.token && p.status !== "closed");
    if (idx < 0) continue;
    const pos = state.positions[idx];
    const fill = simulateFill({
      side: "sell",
      priceUsd: sell.priceUsd,
      qty: pos.qty,
      cfg,
    });
    const realized =
      (fill.filledPriceUsd - pos.entryPriceUsd) * pos.qty - fill.feeUsd;
    state.cashUsd += fill.filledNotionalUsd - fill.feeUsd;
    state.positions[idx] = {
      ...pos,
      status: "closed",
      closedAt: new Date().toISOString(),
      exitPriceUsd: fill.filledPriceUsd,
      realizedPnlUsd: realized,
      exitReason: sell.reason,
    };
    state.trades.push({
      at: new Date().toISOString(),
      side: "sell",
      token: sell.token,
      ...fill,
      reason: sell.reason,
      realizedPnlUsd: realized,
    });
    executed.sells.push(sell.token);
  }

  // peak updates
  for (const pos of state.positions) {
    if (pos.status === "closed") continue;
    const px = priceByToken.get(pos.token);
    if (Number.isFinite(px) && px > (pos.peakPriceUsd || 0)) pos.peakPriceUsd = px;
  }

  state.positions = state.positions.filter((p) => p.status !== "closed");

  for (const buy of plan.buys) {
    const notional = Math.min(buy.notionalUsd, state.cashUsd - cfg.reserveUsd);
    if (notional < cfg.minTradeUsd) continue;
    const fill = simulateFill({
      side: "buy",
      priceUsd: buy.priceUsd,
      notionalUsd: notional,
      cfg,
    });
    state.cashUsd -= fill.filledNotionalUsd + fill.feeUsd;
    state.positions.push({
      token: buy.token,
      symbol: buy.instrument,
      status: "open",
      qty: fill.filledQty,
      entryPriceUsd: fill.filledPriceUsd,
      peakPriceUsd: fill.filledPriceUsd,
      notionalUsd: fill.filledNotionalUsd,
      conviction: buy.conviction,
      openedAt: new Date().toISOString(),
    });
    state.trades.push({
      at: new Date().toISOString(),
      side: "buy",
      token: buy.token,
      ...fill,
      reason: `entry score=${Number(buy.score).toFixed(3)}`,
    });
    executed.buys.push(buy.token);
  }

  const open = state.positions.filter((p) => p.status !== "closed");
  const posUsd = markToMarket(open, priceByToken);
  equityUsd = state.cashUsd + posUsd;
  const pnlUsd = equityUsd - state.startEquityUsd;
  const pnlPct = state.startEquityUsd > 0 ? (pnlUsd / state.startEquityUsd) * 100 : 0;
  state.cycles += 1;
  state.snapshots.push({
    at: new Date().toISOString(),
    equityUsd,
    cashUsd: state.cashUsd,
    positionsUsd: posUsd,
    openPositions: open.length,
    pnlUsd,
    pnlPct,
  });
  // keep last 200 snapshots / 500 trades
  if (state.snapshots.length > 200) state.snapshots = state.snapshots.slice(-200);
  if (state.trades.length > 500) state.trades = state.trades.slice(-500);
  saveState(state);

  const summary = {
    cycle: state.cycles,
    equityUsd: Number(equityUsd.toFixed(2)),
    cashUsd: Number(state.cashUsd.toFixed(2)),
    pnlUsd: Number(pnlUsd.toFixed(2)),
    pnlPct: Number(pnlPct.toFixed(2)),
    openPositions: open.map((p) => p.token),
    executed,
    topCandidates: candidates.slice(0, 5).map((c) => ({
      token: c.token,
      side: c.side,
      score: Number(Number(c.score).toFixed(3)),
      price: c.priceUsd,
    })),
    breaker,
    statePath,
  };
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

const watch = process.argv.includes("--watch");
await runOnce();
if (watch) {
  const ms = Number(process.env.OKX_TRADING_INTERVAL_MS) || 300_000;
  console.error(`Watching every ${ms}ms. Ctrl-C to stop.`);
  setInterval(() => {
    runOnce().catch((e) => console.error(e));
  }, ms);
}
