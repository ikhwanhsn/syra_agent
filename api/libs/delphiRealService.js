/**
 * Delphi gated-live executor — Jupiter spot on the invest wallet.
 * Ships disabled (`DELPHI_CRON.realEnabled = false`). Longs only; shorts stay paper.
 */
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import DelphiRealConfig from "../models/DelphiRealConfig.js";
import DelphiRealPosition from "../models/DelphiRealPosition.js";
import { DELPHI_ASSET_UNIVERSE, getDelphiAsset } from "../config/delphiStrategies.js";
import { DELPHI_CRON } from "../config/onchainEarnExperiments.js";
import { getDelphiStats, pickBestDelphiStrategy, evaluateDelphiOpenGate } from "./delphiService.js";
import { resolveDelphiStrategyById } from "./delphiStrategyResolve.js";
import { fetchPolymarketTraderSignals } from "./polymarketTraderSignals.js";
import {
  executeJupiterBrokerSwap,
  EARN_MINTS,
  fetchJupiterQuoteRaw,
} from "./jupiterBrokerSwap.js";

const USDC_DECIMALS = 6;
const PAPER_GRAD_MIN_DECIDED = 20;
const PAPER_GRAD_MIN_WIN_RATE = 0.5;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function isDelphiRealCronEnabled() {
  return Boolean(DELPHI_CRON.realEnabled);
}

export function delphiRealCaps() {
  return {
    maxPositionSol: toNum(DELPHI_CRON.caps?.maxPositionSol, 0.3),
    maxConcurrentPositions: toNum(DELPHI_CRON.caps?.maxConcurrentPositions, 2),
    maxPositionUsd: toNum(DELPHI_CRON.caps?.maxPositionUsd, 50),
  };
}

/** Paper graduation: ≥20 decided, positive sum PnL, win rate ≥50%. */
export async function checkDelphiPaperGraduation() {
  const stats = await getDelphiStats();
  const totals = (stats.agents || []).reduce(
    (acc, a) => ({
      decided: acc.decided + toNum(a.decided),
      wins: acc.wins + toNum(a.wins),
      sumPnlUsd: acc.sumPnlUsd + toNum(a.sumPnlUsd),
    }),
    { decided: 0, wins: 0, sumPnlUsd: 0 },
  );
  const winRate = totals.decided > 0 ? totals.wins / totals.decided : 0;
  const pass =
    totals.decided >= PAPER_GRAD_MIN_DECIDED &&
    totals.sumPnlUsd > 0 &&
    winRate >= PAPER_GRAD_MIN_WIN_RATE;
  return {
    pass,
    decided: totals.decided,
    sumPnlUsd: totals.sumPnlUsd,
    winRate,
    reason: pass ? null : "need_20_decided_positive_pnl_50pct_win",
  };
}

async function fetchMintPriceUsd(mint, symbol) {
  if (mint === EARN_MINTS.SOL || symbol === "SOL") {
    const q = await fetchJupiterQuoteRaw({
      inputMint: EARN_MINTS.SOL,
      outputMint: EARN_MINTS.USDC,
      amountRaw: String(Math.floor(0.1 * LAMPORTS_PER_SOL)),
      slippageBps: 50,
    });
    const outUsdc = toNum(q?.outAmount, 0) / 1e6;
    return outUsdc / 0.1;
  }
  const asset = getDelphiAsset(symbol);
  const decimals = toNum(asset?.decimals, 8);
  const raw = String(10 ** Math.min(decimals, 8));
  const units = toNum(raw, 1) / 10 ** decimals;
  const q = await fetchJupiterQuoteRaw({
    inputMint: mint,
    outputMint: EARN_MINTS.USDC,
    amountRaw: raw,
    slippageBps: 50,
  });
  const outUsdc = toNum(q?.outAmount, 0) / 1e6;
  return units > 0 ? outUsdc / units : 0;
}

async function runSignalForConfig(cfg) {
  if (!cfg.enabled || cfg.depositsPaused) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: "disabled_or_paused" };
  }
  const caps = delphiRealCaps();
  const maxConcurrent = toNum(cfg.maxConcurrentPositions, caps.maxConcurrentPositions);
  const openCount = await DelphiRealPosition.countDocuments({
    agentAddress: cfg.agentAddress,
    status: { $in: ["open", "opening", "closing"] },
  });
  if (openCount >= maxConcurrent) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: "max_concurrent" };
  }

  const graduation = await checkDelphiPaperGraduation();
  if (!graduation.pass) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: graduation.reason };
  }

  const best = await pickBestDelphiStrategy();
  if (!best) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: "no_qualified_leader" };
  }
  const strategy = await resolveDelphiStrategyById(best.strategyId);
  if (!strategy) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: "invalid_strategy" };
  }

  const payload = await fetchPolymarketTraderSignals({
    allowedAssets: DELPHI_ASSET_UNIVERSE.map((a) => a.symbol),
  });
  const allowed = strategy.universeFilter?.symbols || DELPHI_ASSET_UNIVERSE.map((a) => a.symbol);
  const longs = (payload.assets || [])
    .filter((row) => allowed.includes(row.symbol) && row.side === "long")
    .map((row) => ({ row, gate: evaluateDelphiOpenGate({ signal: row, strategy }) }))
    .filter((x) => x.gate.pass)
    .sort((a, b) => Math.abs(toNum(b.row.bias)) - Math.abs(toNum(a.row.bias)));
  const pick = longs[0]?.row;
  if (!pick) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: "no_long_candidate" };
  }
  const asset = getDelphiAsset(pick.symbol);
  if (!asset) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: "unknown_asset" };
  }

  const dup = await DelphiRealPosition.findOne({
    agentAddress: cfg.agentAddress,
    mint: asset.mint,
    status: { $in: ["open", "opening", "closing"] },
  }).lean();
  if (dup) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: "already_open_mint" };
  }

  const notionalUsd = Math.min(
    toNum(cfg.maxPositionUsd, caps.maxPositionUsd),
    caps.maxPositionUsd,
  );
  const usdcRaw = BigInt(Math.max(0, Math.floor(notionalUsd * 10 ** USDC_DECIMALS)));
  if (usdcRaw <= 0n) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: "zero_notional" };
  }

  let priceUsd = 0;
  try {
    priceUsd = await fetchMintPriceUsd(asset.mint, asset.symbol);
  } catch {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: "no_price" };
  }

  const position = await DelphiRealPosition.create({
    experimentId: cfg.experimentId,
    agentAddress: cfg.agentAddress,
    anonymousId: cfg.anonymousId,
    strategyId: strategy.id,
    strategyName: strategy.name,
    symbol: asset.symbol,
    mint: asset.mint,
    side: "long",
    entryPriceUsd: priceUsd,
    notionalUsd,
    signalSnapshot: pick,
    status: "opening",
    openedAt: new Date(),
  });

  try {
    const swap = await executeJupiterBrokerSwap({
      anonymousId: cfg.anonymousId,
      agentAddress: cfg.agentAddress,
      inputMint: EARN_MINTS.USDC,
      outputMint: asset.mint,
      amountRaw: usdcRaw.toString(),
      estimatedUsd: notionalUsd,
      summary: `Delphi real: USDC→${asset.symbol} (${strategy.name})`,
      slippageBps: 50,
    });
    if (swap.skipped) {
      await DelphiRealPosition.updateOne(
        { _id: position._id },
        { $set: { status: "error", errorMessage: "swap_skipped", resolvedAt: new Date() } },
      );
      return { agentAddress: cfg.agentAddress, skipped: true, reason: "swap_skipped" };
    }
    await DelphiRealPosition.updateOne(
      { _id: position._id },
      {
        $set: {
          status: "open",
          openTxSig: swap.signature,
          signalSnapshot: { ...pick, tokenAmountRaw: swap.outAmount },
        },
      },
    );
    await DelphiRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { lastSignalAt: new Date(), lastError: null, currentStrategyId: strategy.id } },
    );
    return {
      agentAddress: cfg.agentAddress,
      opened: true,
      positionId: String(position._id),
      txSig: swap.signature,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await DelphiRealPosition.updateOne(
      { _id: position._id },
      { $set: { status: "error", errorMessage: msg, resolvedAt: new Date() } },
    );
    await DelphiRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { lastSignalAt: new Date(), lastError: msg } },
    );
    return { agentAddress: cfg.agentAddress, error: msg };
  }
}

export async function runDelphiRealSignalCycle() {
  if (!isDelphiRealCronEnabled()) return { skipped: true, reason: "cron_disabled" };
  const configs = await DelphiRealConfig.find({
    enabled: true,
    depositsPaused: { $ne: true },
  }).lean();
  const results = [];
  for (const cfg of configs) {
    results.push(await runSignalForConfig(cfg));
  }
  return { processed: configs.length, results };
}

async function resolvePositionsForConfig(cfg) {
  const openPositions = await DelphiRealPosition.find({
    agentAddress: cfg.agentAddress,
    status: "open",
    processing: { $ne: true },
  }).lean();
  let resolved = 0;
  const errors = [];

  for (const pos of openPositions) {
    const strategy = await resolveDelphiStrategyById(pos.strategyId);
    const exit = strategy?.exit || { stopLossPct: -5, takeProfitPct: 8 };
    let px = 0;
    try {
      px = await fetchMintPriceUsd(pos.mint, pos.symbol);
    } catch {
      errors.push({ positionId: String(pos._id), error: "no_price" });
      continue;
    }
    if (!(px > 0)) continue;

    const entry = toNum(pos.entryPriceUsd);
    const pnlPct = entry > 0 ? ((px - entry) / entry) * 100 : 0;
    const holdH = (Date.now() - new Date(pos.openedAt).getTime()) / 3_600_000;
    let shouldClose = false;
    let finalStatus = "closed_loss";
    if (pnlPct <= toNum(exit.stopLossPct, -5)) {
      shouldClose = true;
      finalStatus = "closed_loss";
    } else if (pnlPct >= toNum(exit.takeProfitPct, 8)) {
      shouldClose = true;
      finalStatus = "closed_win";
    } else if (holdH >= toNum(strategy?.maxHoldHours, 36)) {
      shouldClose = true;
      finalStatus = pnlPct >= 0 ? "closed_win" : "closed_loss";
    } else if (cfg.closeAllRequested) {
      shouldClose = true;
      finalStatus = pnlPct >= 0 ? "closed_win" : "closed_loss";
    }
    if (!shouldClose) continue;

    const locked = await DelphiRealPosition.updateOne(
      { _id: pos._id, status: "open", processing: { $ne: true } },
      { $set: { processing: true, status: "closing" } },
    );
    if (locked.modifiedCount === 0) continue;

    try {
      const tokenRaw = pos.signalSnapshot?.tokenAmountRaw || "0";
      const swap = await executeJupiterBrokerSwap({
        anonymousId: cfg.anonymousId,
        agentAddress: cfg.agentAddress,
        inputMint: pos.mint,
        outputMint: EARN_MINTS.USDC,
        amountRaw: tokenRaw,
        estimatedUsd: toNum(pos.notionalUsd),
        summary: `Delphi real: ${pos.symbol}→USDC close (${pos.strategyName})`,
        slippageBps: 50,
      });
      const pnlUsd =
        entry > 0 && px > 0
          ? Math.round((toNum(pos.notionalUsd) * (px / entry - 1)) * 100) / 100
          : 0;
      await DelphiRealPosition.updateOne(
        { _id: pos._id },
        {
          $set: {
            status: finalStatus,
            resolution: finalStatus === "closed_win" ? "take_profit" : "stop_or_time",
            closeTxSig: swap.signature,
            realExitPriceUsd: px,
            realNetPnlUsd: pnlUsd,
            resolvedAt: new Date(),
            processing: false,
          },
        },
      );
      resolved += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await DelphiRealPosition.updateOne(
        { _id: pos._id },
        { $set: { status: "error", errorMessage: msg, processing: false, resolvedAt: new Date() } },
      );
      errors.push({ positionId: String(pos._id), error: msg });
    }
  }

  await DelphiRealConfig.updateOne(
    { _id: cfg._id },
    {
      $set: {
        lastResolveAt: new Date(),
        lastError: errors[0]?.error || null,
        closeAllRequested: cfg.closeAllRequested && resolved === 0 ? cfg.closeAllRequested : false,
      },
    },
  );
  return { agentAddress: cfg.agentAddress, resolved, errors };
}

export async function resolveDelphiRealPositions() {
  if (!isDelphiRealCronEnabled()) return { skipped: true, reason: "cron_disabled" };
  const configs = await DelphiRealConfig.find({ enabled: true }).lean();
  const results = [];
  for (const cfg of configs) {
    results.push(await resolvePositionsForConfig(cfg));
  }
  return { processed: configs.length, results };
}
