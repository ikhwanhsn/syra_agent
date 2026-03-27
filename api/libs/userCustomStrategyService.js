/**
 * Wallet-scoped custom experiment strategies (Binance OHLC + same engine as lab).
 * Max {@link MAX_USER_CUSTOM_STRATEGIES_PER_WALLET} agents per normalized wallet address.
 */
import mongoose from "mongoose";
import UserCustomStrategy from "../models/UserCustomStrategy.js";
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import { EXPERIMENT_SUITE_USER_CUSTOM } from "../config/tradingExperimentStrategies.js";
import { buildBinanceSignalReport } from "./binanceSignalAnalysis.js";
import { extractSignalFields } from "./experimentSignalExtract.js";

export const MAX_USER_CUSTOM_STRATEGIES_PER_WALLET = 5;

const BAR_RE =
  /^(1m|3m|5m|15m|30m|1h|2h|3d|4h|6h|8h|12h|1d|1w|1M|1mo)$/i;

/**
 * EVM addresses lowercased; Solana base58 unchanged.
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeUserWalletAddress(raw) {
  if (raw == null || typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";
  if (/^0x[a-fA-F0-9]{40}$/.test(s)) return s.toLowerCase();
  return s;
}

/**
 * @param {unknown} v
 * @param {string} field
 * @returns {string}
 */
function reqStr(v, field) {
  if (v == null || typeof v !== "string" || !v.trim()) {
    throw new Error(`${field} is required`);
  }
  return v.trim();
}

/**
 * @param {Record<string, unknown>} body
 * @returns {{ name: string; token: string; bar: string; limit: number; lookAheadBars: number }}
 */
export function parseAndValidateStrategyBody(body) {
  const name = reqStr(body?.name, "name");
  if (name.length > 80) throw new Error("name must be at most 80 characters");
  const token = reqStr(body?.token, "token");
  if (token.length > 40) throw new Error("token is too long");
  const bar = reqStr(body?.bar, "bar");
  if (!BAR_RE.test(bar)) throw new Error("Invalid bar interval");

  const limit = Number(body?.limit);
  if (!Number.isFinite(limit) || limit < 50 || limit > 500) {
    throw new Error("limit must be between 50 and 500");
  }

  const lookAheadBars = Number(body?.lookAheadBars);
  if (!Number.isFinite(lookAheadBars) || lookAheadBars < 1 || lookAheadBars > 720) {
    throw new Error("lookAheadBars must be between 1 and 720");
  }

  return { name, token, bar, limit: Math.floor(limit), lookAheadBars: Math.floor(lookAheadBars) };
}

/**
 * @param {string} walletRaw
 * @param {Record<string, unknown>} body
 */
export async function createUserCustomStrategy(walletRaw, body) {
  const walletAddress = normalizeUserWalletAddress(walletRaw);
  if (!walletAddress) throw new Error("walletAddress is required");

  const n = await UserCustomStrategy.countDocuments({ walletAddress });
  if (n >= MAX_USER_CUSTOM_STRATEGIES_PER_WALLET) {
    throw new Error(
      `Maximum ${MAX_USER_CUSTOM_STRATEGIES_PER_WALLET} custom strategy agents per wallet`,
    );
  }

  const fields = parseAndValidateStrategyBody(body);
  const doc = await UserCustomStrategy.create({
    walletAddress,
    ...fields,
  });
  return doc.toObject();
}

/**
 * @param {string} walletRaw
 */
export async function listUserCustomStrategies(walletRaw) {
  const walletAddress = normalizeUserWalletAddress(walletRaw);
  if (!walletAddress) throw new Error("walletAddress is required");
  const strategies = await UserCustomStrategy.find({ walletAddress })
    .sort({ createdAt: -1 })
    .lean();
  return {
    strategies,
    count: strategies.length,
    maxAgents: MAX_USER_CUSTOM_STRATEGIES_PER_WALLET,
  };
}

/**
 * @param {string} walletRaw
 * @param {string} strategyId
 */
export async function deleteUserCustomStrategy(walletRaw, strategyId) {
  const walletAddress = normalizeUserWalletAddress(walletRaw);
  if (!walletAddress) throw new Error("walletAddress is required");
  if (!mongoose.Types.ObjectId.isValid(strategyId)) {
    throw new Error("Invalid strategy id");
  }

  const open = await TradingExperimentRun.countDocuments({
    userStrategyId: strategyId,
    status: "open",
  });
  if (open > 0) {
    throw new Error("Cannot delete strategy while a run is still open");
  }

  const r = await UserCustomStrategy.deleteOne({ _id: strategyId, walletAddress });
  if (r.deletedCount === 0) {
    throw new Error("Strategy not found");
  }
  return { deleted: true };
}

/**
 * @param {string} walletRaw
 */
export async function getUserCustomStrategyStats(walletRaw) {
  const walletAddress = normalizeUserWalletAddress(walletRaw);
  if (!walletAddress) throw new Error("walletAddress is required");

  const strategies = await UserCustomStrategy.find({ walletAddress }).lean();
  /** @type {object[]} */
  const agents = [];

  for (const s of strategies) {
    const settled = await TradingExperimentRun.find({
      userStrategyId: s._id,
      status: { $in: ["win", "loss"] },
    }).lean();
    const wins = settled.filter((r) => r.status === "win").length;
    const losses = settled.filter((r) => r.status === "loss").length;
    const decided = wins + losses;
    const winRate = decided > 0 ? wins / decided : null;

    const openPositions = await TradingExperimentRun.countDocuments({
      userStrategyId: s._id,
      status: "open",
    });

    agents.push({
      strategyId: String(s._id),
      name: s.name,
      token: s.token,
      bar: s.bar,
      limit: s.limit,
      lookAheadBars: s.lookAheadBars,
      wins,
      losses,
      decided,
      winRate,
      winRatePct: winRate != null ? Math.round(winRate * 1000) / 10 : null,
      openPositions,
    });
  }

  return {
    wallet: walletAddress,
    maxAgents: MAX_USER_CUSTOM_STRATEGIES_PER_WALLET,
    agents,
  };
}

/**
 * @param {{
 *   walletRaw: string;
 *   strategyId?: string;
 *   limit?: number;
 *   offset?: number;
 *   status?: string;
 * }} opts
 */
export async function listUserCustomRuns(opts) {
  const walletAddress = normalizeUserWalletAddress(opts.walletRaw);
  if (!walletAddress) throw new Error("walletAddress is required");

  const limit = Math.min(200, Math.max(1, Number(opts.limit) || 50));
  const offset = Math.max(0, Number(opts.offset) || 0);

  /** @type {Record<string, unknown>} */
  const filter = {
    suite: EXPERIMENT_SUITE_USER_CUSTOM,
    userWalletAddress: walletAddress,
  };

  if (opts.strategyId && mongoose.Types.ObjectId.isValid(opts.strategyId)) {
    filter.userStrategyId = opts.strategyId;
  }

  const st = typeof opts.status === "string" ? opts.status.trim() : "";
  if (
    st &&
    [
      "open",
      "win",
      "loss",
      "expired",
      "skipped_non_buy",
      "skipped_invalid_levels",
      "error",
    ].includes(st)
  ) {
    filter.status = st;
  }

  const [runs, total] = await Promise.all([
    TradingExperimentRun.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    TradingExperimentRun.countDocuments(filter),
  ]);

  return { runs, total };
}

/**
 * Sample signals for all user custom strategies (hourly cron). Skips HOLD (no row).
 * @returns {Promise<{ created: number; errors: string[] }>}
 */
export async function runUserCustomSignalCycle() {
  const errors = [];
  let created = 0;

  const strategies = await UserCustomStrategy.find({}).lean();

  for (const s of strategies) {
    try {
      const hasOpen =
        (await TradingExperimentRun.countDocuments({
          suite: EXPERIMENT_SUITE_USER_CUSTOM,
          userStrategyId: s._id,
          status: "open",
        })) > 0;
      if (hasOpen) {
        continue;
      }

      const bin = await buildBinanceSignalReport({
        token: s.token,
        bar: s.bar,
        limit: s.limit,
      });

      const ex = extractSignalFields(bin.report);
      const summary = {
        signal: ex.clearSignal,
        reasoning: bin.report?.tradingRecommendation?.reasoning,
        action: bin.report?.tradingRecommendation?.action,
      };

      if (ex.clearSignal === "HOLD") {
        continue;
      }

      const baseRow = {
        suite: EXPERIMENT_SUITE_USER_CUSTOM,
        agentId: 0,
        agentName: s.name,
        userStrategyId: s._id,
        userWalletAddress: s.walletAddress,
        token: s.token,
        bar: s.bar,
        limit: s.limit,
        symbol: bin.symbol,
        anchorCloseMs: bin.anchorCloseMs,
        clearSignal: ex.clearSignal,
        entry: ex.entry,
        stopLoss: ex.stopLoss,
        firstTarget: ex.firstTarget,
        priceAtSignal: ex.priceAtSignal,
        confidence: ex.confidence,
        summary,
      };

      if (ex.clearSignal !== "BUY") {
        await TradingExperimentRun.create({
          ...baseRow,
          status: "skipped_non_buy",
        });
        created += 1;
        continue;
      }

      if (
        ex.entry == null ||
        ex.stopLoss == null ||
        ex.firstTarget == null ||
        !(ex.firstTarget > ex.entry && ex.stopLoss < ex.entry)
      ) {
        await TradingExperimentRun.create({
          ...baseRow,
          status: "skipped_invalid_levels",
        });
        created += 1;
        continue;
      }

      await TradingExperimentRun.create({
        ...baseRow,
        status: "open",
      });
      created += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`[user_custom] strategy ${s._id}: ${msg}`);
    }
  }

  return { created, errors };
}
