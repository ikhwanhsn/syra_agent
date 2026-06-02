/**
 * Bitget Vibe Trader — NL strategy compile + autonomous loop (perceive → decide → execute → risk → exit).
 */
import mongoose from "mongoose";
import crypto from "node:crypto";
import BitgetVibeSession from "../models/BitgetVibeSession.js";
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import { EXPERIMENT_SUITE_BITGET_VIBE } from "../config/tradingExperimentStrategies.js";
import {
  TRADING_EXPERIMENT_STARTING_USD,
  TRADING_EXPERIMENT_MIN_TRADE_NOTIONAL_USD,
  roundUsd,
  computeAgentEquityFromRealizedPnl,
  computeAgentReturnPct,
} from "../config/tradingExperimentSim.js";
import { callOpenRouter } from "./openrouter.js";
import { parseJsonObjectFromLlm } from "./llmJsonObjectParse.js";
import { perceiveBitgetMarket, fetchBitgetSpotTicker } from "./integrations/bitget/bitgetAgentHubClient.js";
import {
  executeBitgetSpotBuy,
  evaluateBitgetLiveExecutionPolicy,
  normalizeExecutionMode,
  resolveDefaultExecutionMode,
} from "./integrations/bitget/bitgetExecutionAdapter.js";
import { extractSignalFields } from "./experimentSignalExtract.js";

const BAR_RE =
  /^(1m|3m|5m|15m|30m|1h|2h|3d|4h|6h|8h|12h|1d|1w|1M|1mo)$/i;

const MAX_LOOP_STEPS_STORED = 24;

/**
 * @param {unknown} raw
 * @returns {Record<string, unknown>}
 */
function validateStrategySpec(raw) {
  if (!raw || typeof raw !== "object") throw new Error("Strategy spec must be an object");
  const o = /** @type {Record<string, unknown>} */ (raw);
  const name = String(o.name || "Vibe strategy").trim().slice(0, 80);
  const token = String(o.token || "BTC").trim().toUpperCase().slice(0, 20);
  const bar = String(o.bar || "1h").trim();
  if (!BAR_RE.test(bar)) throw new Error("Invalid bar interval");
  const limit = Math.floor(Number(o.limit));
  if (!Number.isFinite(limit) || limit < 50 || limit > 500) {
    throw new Error("limit must be between 50 and 500");
  }
  const lookAheadBars = Math.floor(Number(o.lookAheadBars ?? 48));
  if (!Number.isFinite(lookAheadBars) || lookAheadBars < 1 || lookAheadBars > 720) {
    throw new Error("lookAheadBars must be between 1 and 720");
  }
  const entryCondition = String(o.entryCondition || "").trim().slice(0, 500);
  const minRsi = o.minRsi != null ? Number(o.minRsi) : null;
  const maxRsi = o.maxRsi != null ? Number(o.maxRsi) : null;
  const takeProfitPct = o.takeProfitPct != null ? Number(o.takeProfitPct) : null;
  const stopLossPct = o.stopLossPct != null ? Number(o.stopLossPct) : null;
  const maxNotionalUsd = o.maxNotionalUsd != null ? Number(o.maxNotionalUsd) : null;

  return {
    name,
    token,
    bar,
    limit,
    lookAheadBars,
    entryCondition,
    minRsi: Number.isFinite(minRsi) ? minRsi : null,
    maxRsi: Number.isFinite(maxRsi) ? maxRsi : null,
    takeProfitPct: Number.isFinite(takeProfitPct) ? takeProfitPct : null,
    stopLossPct: Number.isFinite(stopLossPct) ? stopLossPct : null,
    maxNotionalUsd: Number.isFinite(maxNotionalUsd) ? maxNotionalUsd : null,
  };
}

/**
 * @param {string} prompt
 * @returns {Promise<Record<string, unknown>>}
 */
export async function compileVibeStrategy(prompt) {
  const text = String(prompt || "").trim();
  if (!text || text.length < 8) throw new Error("Prompt must be at least 8 characters");
  if (text.length > 2000) throw new Error("Prompt must be at most 2000 characters");

  const system = `You convert natural-language crypto trading strategies into JSON for a Bitget spot-long vibe trader.
Return ONLY a JSON object with keys:
name, token (e.g. BTC), bar (1m|5m|15m|30m|1h|4h|1d), limit (50-500), lookAheadBars (1-720),
entryCondition (short string), minRsi (number|null), maxRsi (number|null),
takeProfitPct (number|null, e.g. 2 for 2%), stopLossPct (number|null, e.g. 1 for 1%), maxNotionalUsd (number|null).
Default token BTC, bar 1h, limit 200, lookAheadBars 48 if unspecified.`;

  const { response } = await callOpenRouter(
    [
      { role: "system", content: system },
      { role: "user", content: text },
    ],
    { temperature: 0.2, max_tokens: 800 },
  );

  const parsed = parseJsonObjectFromLlm(response);
  return validateStrategySpec(parsed);
}

/**
 * @param {Record<string, unknown>} spec
 * @param {ReturnType<typeof extractSignalFields>} signal
 */
function passesStrategyGates(spec, signal) {
  if (signal.clearSignal === "HOLD") {
    return { ok: false, reason: "signal_hold" };
  }
  if (signal.clearSignal !== "BUY") {
    return { ok: false, reason: "spot_long_buy_only" };
  }
  if (spec.minRsi != null && (signal.rsi == null || signal.rsi < spec.minRsi)) {
    return { ok: false, reason: `rsi_below_min_${spec.minRsi}` };
  }
  if (spec.maxRsi != null && (signal.rsi == null || signal.rsi > spec.maxRsi)) {
    return { ok: false, reason: `rsi_above_max_${spec.maxRsi}` };
  }
  return { ok: true, reason: null };
}

/**
 * @param {Record<string, unknown>} spec
 * @param {ReturnType<typeof extractSignalFields>} signal
 * @param {number} price
 */
function resolveTradeLevels(spec, signal, price) {
  let entry = Number(signal.entry);
  let stopLoss = Number(signal.stopLoss);
  let firstTarget = Number(signal.firstTarget);
  const px = Number.isFinite(price) && price > 0 ? price : Number(signal.priceAtSignal);

  if (!(entry > 0)) entry = px;
  if (spec.stopLossPct != null && entry > 0) {
    stopLoss = entry * (1 - spec.stopLossPct / 100);
  }
  if (spec.takeProfitPct != null && entry > 0) {
    firstTarget = entry * (1 + spec.takeProfitPct / 100);
  }

  const valid =
    entry > 0 &&
    stopLoss > 0 &&
    firstTarget > 0 &&
    firstTarget > entry &&
    stopLoss < entry;

  return { entry, stopLoss, firstTarget, valid };
}

/**
 * @param {import("mongoose").Document} session
 * @param {Array<{ phase: string; message: string; payload?: unknown }>} steps
 */
function appendLoopSteps(session, steps) {
  const prev = Array.isArray(session.lastLoopSteps) ? session.lastLoopSteps : [];
  session.lastLoopSteps = [...prev, ...steps].slice(-MAX_LOOP_STEPS_STORED);
}

/**
 * @param {string} sessionId
 */
export async function runVibeLoopTick(sessionId) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new Error("Invalid session id");
  }

  const session = await BitgetVibeSession.findById(sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status !== "active") {
    return { skipped: true, reason: "session_not_active", sessionId };
  }

  const spec = validateStrategySpec(session.strategySpec);
  const steps = [];
  session.tickCount = (session.tickCount || 0) + 1;
  session.lastTickAt = new Date();

  const resolveOut = await resolveVibeOpenRuns(session._id, spec);
  steps.push({
    phase: "manage",
    message: `Resolved ${resolveOut.resolved} open position(s)`,
    payload: resolveOut,
  });

  if (resolveOut.stillOpen > 0) {
    appendLoopSteps(session, steps);
    session.lastPerception = session.lastPerception;
    await session.save();
    return {
      sessionId: String(session._id),
      action: "holding",
      resolveOut,
      steps: session.lastLoopSteps,
    };
  }

  const perception = await perceiveBitgetMarket({
    token: spec.token,
    bar: spec.bar,
    limit: spec.limit,
  });
  session.lastPerception = perception;
  steps.push({
    phase: "perceive",
    message: `Bitget ${perception.symbol} @ ${perception.price}`,
    payload: {
      skills: Object.keys(perception.skills || {}),
      signal: perception.signalSummary,
    },
  });

  const signal = perception.signal;
  const gate = passesStrategyGates(spec, signal);
  if (!gate.ok) {
    steps.push({ phase: "decide", message: `Skip: ${gate.reason}`, payload: { signal: signal.clearSignal } });
    appendLoopSteps(session, steps);
    await session.save();
    return { sessionId: String(session._id), action: "skipped", reason: gate.reason, steps: session.lastLoopSteps };
  }

  const levels = resolveTradeLevels(spec, signal, perception.price);
  steps.push({
    phase: "decide",
    message: `BUY setup entry=${levels.entry} tp=${levels.firstTarget} sl=${levels.stopLoss}`,
    payload: levels,
  });

  if (!levels.valid) {
    await TradingExperimentRun.create({
      suite: EXPERIMENT_SUITE_BITGET_VIBE,
      agentId: 0,
      agentName: spec.name,
      bitgetVibeSessionId: session._id,
      token: spec.token,
      bar: spec.bar,
      limit: spec.limit,
      symbol: perception.symbol,
      cexSource: "bitget",
      anchorCloseMs: perception.anchorCloseMs,
      clearSignal: signal.clearSignal,
      entry: levels.entry,
      stopLoss: levels.stopLoss,
      firstTarget: levels.firstTarget,
      priceAtSignal: perception.price,
      confidence: signal.confidence,
      status: "skipped_invalid_levels",
      summary: { vibe: true, perception: perception.signalSummary },
    });
    steps.push({ phase: "risk", message: "Invalid TP/SL levels — recorded skip" });
    appendLoopSteps(session, steps);
    await session.save();
    return { sessionId: String(session._id), action: "skipped_invalid_levels", steps: session.lastLoopSteps };
  }

  const cash = roundUsd(session.cashUsd ?? TRADING_EXPERIMENT_STARTING_USD);
  let notional = cash;
  if (spec.maxNotionalUsd != null && spec.maxNotionalUsd > 0) {
    notional = Math.min(notional, spec.maxNotionalUsd);
  }
  notional = roundUsd(notional);
  if (notional < TRADING_EXPERIMENT_MIN_TRADE_NOTIONAL_USD) {
    steps.push({ phase: "risk", message: "Insufficient cash for trade" });
    appendLoopSteps(session, steps);
    await session.save();
    return { sessionId: String(session._id), action: "insufficient_cash", steps: session.lastLoopSteps };
  }

  const mode = normalizeExecutionMode(session.mode || resolveDefaultExecutionMode());
  const policy = evaluateBitgetLiveExecutionPolicy({ notionalUsd: notional, mode });
  steps.push({
    phase: "risk",
    message: `Policy ${policy.outcome}; notional $${notional} (${mode})`,
    payload: policy,
  });
  if (policy.outcome === "deny") {
    appendLoopSteps(session, steps);
    await session.save();
    return { sessionId: String(session._id), action: "policy_denied", policy, steps: session.lastLoopSteps };
  }

  const fill = await executeBitgetSpotBuy({
    mode,
    symbol: perception.symbol,
    side: "buy",
    notionalUsd: notional,
    entryPrice: levels.entry,
  });
  steps.push({
    phase: "execute",
    message: `${fill.mode} fill @ ${fill.fillPrice}`,
    payload: fill,
  });

  session.cashUsd = roundUsd(cash - notional);
  await TradingExperimentRun.create({
    suite: EXPERIMENT_SUITE_BITGET_VIBE,
    agentId: 0,
    agentName: spec.name,
    bitgetVibeSessionId: session._id,
    token: spec.token,
    bar: spec.bar,
    limit: spec.limit,
    symbol: perception.symbol,
    cexSource: "bitget",
    anchorCloseMs: perception.anchorCloseMs,
    clearSignal: signal.clearSignal,
    entry: levels.entry,
    stopLoss: levels.stopLoss,
    firstTarget: levels.firstTarget,
    priceAtSignal: fill.fillPrice,
    confidence: signal.confidence,
    status: "open",
    notionalUsd: notional,
    summary: {
      vibe: true,
      mode: fill.mode,
      orderId: fill.orderId,
      skills: perception.agentHub?.skillHub,
      entryCondition: spec.entryCondition,
    },
  });

  appendLoopSteps(session, steps);
  await session.save();
  return {
    sessionId: String(session._id),
    action: "opened",
    fill,
    notionalUsd: notional,
    steps: session.lastLoopSteps,
  };
}

/**
 * @param {import("mongoose").Types.ObjectId} sessionOid
 * @param {Record<string, unknown>} spec
 */
async function resolveVibeOpenRuns(sessionOid, spec) {
  let resolved = 0;
  const openRuns = await TradingExperimentRun.find({
    suite: EXPERIMENT_SUITE_BITGET_VIBE,
    bitgetVibeSessionId: sessionOid,
    status: "open",
  }).lean();

  const session = await BitgetVibeSession.findById(sessionOid);
  if (!session) return { resolved: 0, stillOpen: 0 };

  for (const run of openRuns) {
    try {
      const ticker = await fetchBitgetSpotTicker(run.symbol);
      const px = ticker.last;
      const sl = Number(run.stopLoss);
      const tp = Number(run.firstTarget);
      const entry = Number(run.entry);
      const notional = Number(run.notionalUsd) || TRADING_EXPERIMENT_MIN_TRADE_NOTIONAL_USD;

      let status = null;
      let exitPx = px;
      if (px >= tp) {
        status = "win";
        exitPx = tp;
      } else if (px <= sl) {
        status = "loss";
        exitPx = sl;
      } else if (run.anchorCloseMs != null) {
        const maxHoldMs = spec.lookAheadBars * barMs(spec.bar);
        if (Date.now() > run.anchorCloseMs + maxHoldMs) {
          status = "expired";
          exitPx = px;
        }
      }

      if (!status) continue;

      const simPnlUsd = entry > 0 && exitPx > 0 ? notional * (exitPx / entry - 1) : 0;
      const u = await TradingExperimentRun.updateOne(
        { _id: run._id, status: "open" },
        {
          $set: {
            status,
            simExitPrice: exitPx,
            simPnlUsd,
            resolvedAt: new Date(),
            resolution: status === "expired" ? "max_hold" : status,
          },
        },
      );
      if (u.modifiedCount > 0) {
        session.cashUsd = roundUsd((session.cashUsd || 0) + notional + simPnlUsd);
        session.realizedPnlUsd = roundUsd((session.realizedPnlUsd || 0) + simPnlUsd);
        resolved += 1;
        session.lastLoopSteps = [
          ...(session.lastLoopSteps || []),
          {
            phase: "exit",
            message: `${status.toUpperCase()} ${run.symbol} P/L $${roundUsd(simPnlUsd)}`,
            payload: { runId: String(run._id), exitPx, status },
            at: new Date(),
          },
        ].slice(-MAX_LOOP_STEPS_STORED);
      }
    } catch {
      /* continue other runs */
    }
  }

  await session.save();
  const stillOpen = await TradingExperimentRun.countDocuments({
    suite: EXPERIMENT_SUITE_BITGET_VIBE,
    bitgetVibeSessionId: sessionOid,
    status: "open",
  });
  return { resolved, stillOpen };
}

/** @param {string} bar */
function barMs(bar) {
  const b = String(bar || "1h").toLowerCase();
  const map = {
    "1m": 60_000,
    "5m": 300_000,
    "15m": 900_000,
    "30m": 1_800_000,
    "1h": 3_600_000,
    "4h": 14_400_000,
    "1d": 86_400_000,
  };
  return map[b] || 3_600_000;
}

/**
 * @param {import("mongoose").LeanDocument<any>} session
 */
async function buildSessionMetrics(session) {
  const settled = await TradingExperimentRun.find({
    bitgetVibeSessionId: session._id,
    status: { $in: ["win", "loss"] },
  }).lean();
  const wins = settled.filter((r) => r.status === "win").length;
  const losses = settled.filter((r) => r.status === "loss").length;
  const decided = wins + losses;
  const winRate = decided > 0 ? wins / decided : null;
  const realized = roundUsd(session.realizedPnlUsd || 0);
  const equity = computeAgentEquityFromRealizedPnl(realized);
  const openPositions = await TradingExperimentRun.countDocuments({
    bitgetVibeSessionId: session._id,
    status: "open",
  });

  const recentRuns = await TradingExperimentRun.find({
    bitgetVibeSessionId: session._id,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return {
    wins,
    losses,
    decided,
    winRate,
    winRatePct: winRate != null ? Math.round(winRate * 1000) / 10 : null,
    realizedPnlUsd: realized,
    equityUsd: equity,
    returnPct: computeAgentReturnPct(equity, session.startingUsd || TRADING_EXPERIMENT_STARTING_USD),
    openPositions,
    totalRuns: await TradingExperimentRun.countDocuments({ bitgetVibeSessionId: session._id }),
    recentRuns,
    equityCurve: buildEquityCurve(recentRuns, session.startingUsd || TRADING_EXPERIMENT_STARTING_USD),
  };
}

/**
 * @param {object[]} runs newest-first
 * @param {number} startingUsd
 */
function buildEquityCurve(runs, startingUsd) {
  const closed = runs
    .filter((r) => ["win", "loss", "expired"].includes(r.status))
    .slice()
    .reverse();
  let equity = startingUsd;
  const points = [{ t: Date.now(), equity: roundUsd(equity) }];
  for (const r of closed) {
    equity += Number(r.simPnlUsd) || 0;
    points.push({
      t: r.resolvedAt ? new Date(r.resolvedAt).getTime() : Date.now(),
      equity: roundUsd(equity),
    });
  }
  return points;
}

/**
 * @param {string} sessionId
 */
export async function getVibeSession(sessionId) {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) throw new Error("Invalid session id");
  const session = await BitgetVibeSession.findById(sessionId).lean();
  if (!session) throw new Error("Session not found");
  const metrics = await buildSessionMetrics(session);
  return {
    session: {
      id: String(session._id),
      name: session.name,
      prompt: session.prompt,
      strategySpec: session.strategySpec,
      mode: session.mode,
      status: session.status,
      cashUsd: session.cashUsd,
      startingUsd: session.startingUsd,
      tickCount: session.tickCount,
      lastTickAt: session.lastTickAt,
      lastPerception: session.lastPerception,
      lastLoopSteps: session.lastLoopSteps,
      shareSlug: session.shareSlug,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    metrics,
    liveCapable: resolveDefaultExecutionMode() === "live" || normalizeExecutionMode("live") === "live",
  };
}

/**
 * @param {{ prompt: string; name?: string; mode?: string; walletAddress?: string; runFirstTick?: boolean }} body
 */
export async function createVibeSession(body) {
  const prompt = String(body.prompt || "").trim();
  if (!prompt) throw new Error("prompt is required");
  const strategySpec = await compileVibeStrategy(prompt);
  const name = String(body.name || strategySpec.name || "Vibe session").trim().slice(0, 80);
  const mode = normalizeExecutionMode(body.mode || resolveDefaultExecutionMode());
  const walletAddress =
    body.walletAddress != null ? String(body.walletAddress).trim() : null;

  const shareSlug = `vibe-${crypto.randomBytes(4).toString("hex")}`;
  const session = await BitgetVibeSession.create({
    name,
    prompt,
    strategySpec,
    mode,
    walletAddress: walletAddress || null,
    startingUsd: TRADING_EXPERIMENT_STARTING_USD,
    cashUsd: TRADING_EXPERIMENT_STARTING_USD,
    shareSlug,
  });

  let tickResult = null;
  if (body.runFirstTick !== false) {
    tickResult = await runVibeLoopTick(String(session._id));
  }

  return { ...(await getVibeSession(String(session._id))), tickResult };
}

/**
 * @param {{ limit?: number }} [opts]
 */
export async function listVibeSessions(opts = {}) {
  const limit = Math.min(50, Math.max(1, Number(opts.limit) || 20));
  const sessions = await BitgetVibeSession.find({}).sort({ updatedAt: -1 }).limit(limit).lean();
  const rows = await Promise.all(
    sessions.map(async (s) => {
      const m = await buildSessionMetrics(s);
      return {
        id: String(s._id),
        name: s.name,
        mode: s.mode,
        status: s.status,
        shareSlug: s.shareSlug,
        winRatePct: m.winRatePct,
        returnPct: m.returnPct,
        openPositions: m.openPositions,
        updatedAt: s.updatedAt,
      };
    }),
  );
  return { sessions: rows };
}

/**
 * Cron: tick all active sessions.
 */
export async function runAllVibeLoopTicks() {
  const errors = [];
  let ticked = 0;
  const active = await BitgetVibeSession.find({ status: "active" }).select("_id").lean();
  for (const s of active) {
    try {
      await runVibeLoopTick(String(s._id));
      ticked += 1;
    } catch (e) {
      errors.push(`${s._id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { ticked, errors };
}

/**
 * @param {string} slug
 */
export async function getVibeSessionByShareSlug(slug) {
  const s = String(slug || "").trim();
  if (!s) throw new Error("slug required");
  const session = await BitgetVibeSession.findOne({ shareSlug: s }).lean();
  if (!session) throw new Error("Session not found");
  return getVibeSession(String(session._id));
}
