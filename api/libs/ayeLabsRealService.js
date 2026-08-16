/**
 * AyeLabs real layer — capped live gate without an external engine child.
 * Enable stores config + hard caps; cron signal/resolve are intentional no-ops until
 * LP-exec wiring is graduated. Contends with LP real on the same earn wallet.
 */
import AyeLabsRealConfig from "../models/AyeLabsRealConfig.js";
import AyeLabsRealPosition from "../models/AyeLabsRealPosition.js";
import AyeLabsState from "../models/AyeLabsState.js";
import { AYE_LABS_CRON } from "../config/onchainEarnExperiments.js";
import { AYE_LABS_REAL_MIRROR_STRATEGY_ID } from "../config/ayeLabsStrategies.js";
import { ensureAyeLabsBootstrapped, getAyeLabsStats } from "./ayeLabsService.js";
import { selectAyeLabsBanditLeader } from "./ayeLabsEvolution.js";
import { lpAgentAnonymousIdFrom } from "./agentWalletPurpose.js";
import { findOrEnsurePurposeWallet } from "./agentWalletProvision.js";
import { clamp } from "./earnExperimentKit.js";
import { assertNoLpRealContention } from "./meridianEngineSupervisor.js";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

const CAPS = AYE_LABS_CRON.caps || {};
const MAX_POSITION_SOL_CAP = CAPS.maxDeployAmount || 0.5;
const DEFAULT_MAX_POSITION_SOL = CAPS.deployAmountSol || 0.3;
const MAX_CONCURRENT_CAP = CAPS.maxPositions || 2;
const DEFAULT_MAX_CONCURRENT = CAPS.maxPositions || 2;
const DEFAULT_DAILY_MAX_LOSS_SOL = CAPS.dailyMaxLossSol || 0.5;
const CAP_SOL = CAPS.capSol || 1;

const PAPER_GRAD_MIN_DECIDED = 20;
const PAPER_GRAD_MIN_WIN_RATE = 0.45;
const LEADER_MIN_DECIDED = 3;

const OPEN_STATUSES = Object.freeze(["opening", "open", "closing"]);
const CLOSED_STATUSES = Object.freeze(["closed_win", "closed_loss", "expired"]);

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

export function isAyeLabsRealCronEnabled() {
  return Boolean(AYE_LABS_CRON.realEnabled);
}

async function resolveAyeLabsWallet(anonymousId) {
  const aid = lpAgentAnonymousIdFrom(anonymousId);
  if (!aid) throw new Error("Invalid anonymous id");
  const wallet = await findOrEnsurePurposeWallet(anonymousId, "earn");
  if (!wallet?.agentAddress) throw new Error("Earn wallet not provisioned for this user");
  return wallet;
}

export async function ensureAyeLabsRealBootstrapped() {
  await ensureAyeLabsBootstrapped();
  return AyeLabsState.findById("singleton").lean();
}

export async function getOrCreateConfig(wallet) {
  const state = await ensureAyeLabsRealBootstrapped();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) throw new Error("AyeLabs experiment cohort not initialized");
  let cfg = await AyeLabsRealConfig.findById(wallet.agentAddress);
  if (!cfg) {
    cfg = await AyeLabsRealConfig.create({
      _id: wallet.agentAddress,
      agentAddress: wallet.agentAddress,
      anonymousId: wallet.anonymousId,
      experimentId,
      enabled: false,
      maxPositionSol: DEFAULT_MAX_POSITION_SOL,
      maxConcurrentPositions: DEFAULT_MAX_CONCURRENT,
      dailyMaxLossSol: DEFAULT_DAILY_MAX_LOSS_SOL,
    });
  } else if (cfg.experimentId !== experimentId) {
    cfg.experimentId = experimentId;
    await cfg.save();
  }
  return cfg;
}

/**
 * Pure graduation check over getAyeLabsStats() rows. Mirror (id 98) is excluded.
 * Hard floor: enough decided trades, positive aggregate AND average net, min win rate.
 */
export function evaluateAyeLabsPaperGraduation(stats) {
  const agents = (stats?.agents || []).filter(
    (a) => Number(a?.strategyId) !== AYE_LABS_REAL_MIRROR_STRATEGY_ID,
  );
  const totals = agents.reduce(
    (acc, a) => ({
      decided: acc.decided + toNum(a.decided),
      wins: acc.wins + toNum(a.wins),
      sumNetPnlSol: acc.sumNetPnlSol + toNum(a.sumNetPnlSol),
    }),
    { decided: 0, wins: 0, sumNetPnlSol: 0 },
  );
  const winRate = totals.decided > 0 ? totals.wins / totals.decided : 0;
  const avgNetPnlSol = totals.decided > 0 ? totals.sumNetPnlSol / totals.decided : 0;
  const pass =
    totals.decided >= PAPER_GRAD_MIN_DECIDED &&
    totals.sumNetPnlSol > 0 &&
    avgNetPnlSol > 0 &&
    winRate >= PAPER_GRAD_MIN_WIN_RATE;
  let reason = null;
  if (!pass) {
    if (totals.decided < PAPER_GRAD_MIN_DECIDED) {
      reason = `need_${PAPER_GRAD_MIN_DECIDED}_decided_positive_net_pnl`;
    } else if (!(totals.sumNetPnlSol > 0) || !(avgNetPnlSol > 0)) {
      reason = "need_positive_avg_net_pnl";
    } else {
      reason = `need_win_rate_${Math.round(PAPER_GRAD_MIN_WIN_RATE * 100)}pct`;
    }
  }
  return {
    pass,
    decided: totals.decided,
    wins: totals.wins,
    sumNetPnlSol: totals.sumNetPnlSol,
    avgNetPnlSol,
    winRate,
    minDecided: PAPER_GRAD_MIN_DECIDED,
    minWinRate: PAPER_GRAD_MIN_WIN_RATE,
    reason,
  };
}

export async function checkAyeLabsPaperGraduation() {
  const stats = await getAyeLabsStats();
  return evaluateAyeLabsPaperGraduation(stats);
}

export async function getAyeLabsRealState({ viewerAnonymousId } = {}) {
  let config = null;
  let canEnable = false;
  const graduation = await checkAyeLabsPaperGraduation();

  if (viewerAnonymousId) {
    try {
      const wallet = await resolveAyeLabsWallet(viewerAnonymousId);
      config = await getOrCreateConfig(wallet);
      canEnable = true;
    } catch {
      config = null;
    }
  }

  const agentFilter = config?.agentAddress ? { agentAddress: config.agentAddress } : {};
  const [openPositions, closedAgg] = await Promise.all([
    AyeLabsRealPosition.countDocuments({ ...agentFilter, status: { $in: [...OPEN_STATUSES] } }),
    AyeLabsRealPosition.aggregate([
      { $match: { ...agentFilter, status: { $in: [...CLOSED_STATUSES] } } },
      {
        $group: {
          _id: null,
          realizedNetPnlSol: { $sum: { $ifNull: ["$realNetPnlSol", 0] } },
          realizedNetPnlUsd: { $sum: { $ifNull: ["$realNetPnlUsd", 0] } },
          wins: { $sum: { $cond: [{ $eq: ["$status", "closed_win"] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ["$status", "closed_loss"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const wins = toNum(closedAgg[0]?.wins);
  const losses = toNum(closedAgg[0]?.losses);
  const decided = wins + losses;

  return {
    enabled: Boolean(config?.enabled),
    experimentId: config?.experimentId || null,
    agentAddress: config?.agentAddress || null,
    currentStrategyId: config?.currentStrategyId ?? null,
    maxPositionSol: toNum(config?.maxPositionSol, DEFAULT_MAX_POSITION_SOL),
    maxConcurrentPositions: toNum(config?.maxConcurrentPositions, DEFAULT_MAX_CONCURRENT),
    dailyMaxLossSol: toNum(config?.dailyMaxLossSol, DEFAULT_DAILY_MAX_LOSS_SOL),
    depositsPaused: Boolean(config?.depositsPaused),
    closeAllRequested: Boolean(config?.closeAllRequested),
    publicEarnListed: Boolean(config?.publicEarnListed),
    lastSignalAt: config?.lastSignalAt?.toISOString?.() ?? null,
    lastResolveAt: config?.lastResolveAt?.toISOString?.() ?? null,
    lastError: config?.lastError ?? null,
    openPositions,
    realizedNetPnlSol: toNum(closedAgg[0]?.realizedNetPnlSol),
    realizedNetPnlUsd: toNum(closedAgg[0]?.realizedNetPnlUsd),
    realizedPnlSol: toNum(closedAgg[0]?.realizedNetPnlSol),
    wins,
    losses,
    realWinRate: decided > 0 ? wins / decided : null,
    realWins: wins,
    realLosses: losses,
    canEnable,
    cronEnabled: isAyeLabsRealCronEnabled(),
    paperGraduation: {
      ...graduation,
      sumPnlSol: graduation.sumNetPnlSol,
    },
    caps: {
      maxPositionSol: MAX_POSITION_SOL_CAP,
      maxConcurrentPositions: MAX_CONCURRENT_CAP,
      capSol: CAP_SOL,
    },
    hardCaps: {
      maxPositionSol: MAX_POSITION_SOL_CAP,
      maxConcurrentPositions: MAX_CONCURRENT_CAP,
      dailyMaxLossSol: DEFAULT_DAILY_MAX_LOSS_SOL,
    },
    onchain: {
      venue: "Solana",
      protocol: "Meteora DLMM",
      denom: "SOL",
      mode: "capped_real_gate",
      walletPurpose: "earn",
      strategySource: "gmgn-vl-radar",
    },
    /** UI-compatible stub (no child engine). */
    engine: {
      running: false,
      enabled: false,
      mode: "none",
      pid: null,
      restarts: 0,
      dryRun: false,
      lastSyncAt: null,
      lastSyncError: null,
      note: "AyeLabs has no external engine; real gate is config-only in v1.",
    },
  };
}

export async function listAyeLabsRealPositions({ limit, offset, status, agentAddress } = {}) {
  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);
  const filter = {};
  if (status) filter.status = status;
  if (agentAddress) filter.agentAddress = agentAddress;
  const [positions, total] = await Promise.all([
    AyeLabsRealPosition.find(filter).sort({ openedAt: -1 }).skip(off).limit(lim).lean(),
    AyeLabsRealPosition.countDocuments(filter),
  ]);
  return { positions, total };
}

/**
 * Enable AyeLabs real gate (disabled live opens in v1; stores caps + leader).
 */
export async function enableAyeLabsReal({
  anonymousId,
  enabledBy,
  maxPositionSol,
  requireGraduation = true,
  dryRun = false,
}) {
  if (!anonymousId) throw new Error("anonymousId required");

  const graduation = await checkAyeLabsPaperGraduation();
  // Hard floor: client cannot bypass paper graduation (requireGraduation is ignored).
  void requireGraduation;
  if (!graduation.pass) {
    throw new Error(`paper_graduation_blocked:${graduation.reason}`);
  }

  const wallet = await resolveAyeLabsWallet(anonymousId);
  await assertNoLpRealContention(wallet.agentAddress);

  // Also block if Meridian real is live on the same earn wallet.
  try {
    const MeridianRealConfig = (await import("../models/MeridianRealConfig.js")).default;
    const meridianConflict = await MeridianRealConfig.findOne({
      agentAddress: wallet.agentAddress,
      enabled: true,
    })
      .select("_id")
      .lean();
    if (meridianConflict) {
      throw new Error(
        `meridian_real_contention: Meridian real is enabled on earn wallet ${wallet.agentAddress}. Disable Meridian first.`,
      );
    }
  } catch (e) {
    if (String(e?.message || e).startsWith("meridian_real_contention:")) throw e;
  }

  const earnAid = lpAgentAnonymousIdFrom(anonymousId);
  const cfg = await getOrCreateConfig(wallet);
  const stats = await getAyeLabsStats();
  const leader = selectAyeLabsBanditLeader(stats.agents, { minDecided: LEADER_MIN_DECIDED });
  if (!leader || toNum(leader.stats?.sumNetPnlSol) <= 0) {
    throw new Error("paper_graduation_blocked:no_positive_net_leader");
  }
  const leaderWinRate =
    leader.stats?.winRate != null
      ? toNum(leader.stats.winRate)
      : toNum(leader.stats?.decided) > 0
        ? toNum(leader.stats.wins) / toNum(leader.stats.decided)
        : 0;
  if (leaderWinRate < PAPER_GRAD_MIN_WIN_RATE) {
    throw new Error("paper_graduation_blocked:leader_win_rate");
  }

  cfg.enabled = true;
  cfg.startedAt = cfg.startedAt ?? new Date();
  cfg.anonymousId = earnAid;
  cfg.currentStrategyId = leader?.strategyId ?? cfg.currentStrategyId ?? 0;
  if (maxPositionSol != null && Number.isFinite(Number(maxPositionSol))) {
    cfg.maxPositionSol = clamp(Number(maxPositionSol), 0, MAX_POSITION_SOL_CAP);
  } else {
    cfg.maxPositionSol = clamp(
      toNum(cfg.maxPositionSol, DEFAULT_MAX_POSITION_SOL),
      0,
      MAX_POSITION_SOL_CAP,
    );
  }
  cfg.maxConcurrentPositions = clamp(
    toNum(cfg.maxConcurrentPositions, DEFAULT_MAX_CONCURRENT),
    1,
    MAX_CONCURRENT_CAP,
  );
  cfg.dailyMaxLossSol = toNum(cfg.dailyMaxLossSol, DEFAULT_DAILY_MAX_LOSS_SOL);
  cfg.depositsPaused = false;
  cfg.closeAllRequested = false;
  cfg.lossPausedAt = null;
  cfg.lastEnabledBy = enabledBy || anonymousId;
  cfg.lastError = dryRun ? "dry_run_gate_only" : "real_opens_pending_lp_exec_wire";
  cfg.capitalBaselineSol = cfg.capitalBaselineSol ?? CAP_SOL;
  await cfg.save();

  return getAyeLabsRealState({ viewerAnonymousId: anonymousId });
}

export async function disableAyeLabsReal({ anonymousId, closeAll = true }) {
  const wallet = await resolveAyeLabsWallet(anonymousId);
  await AyeLabsRealConfig.updateOne(
    { _id: wallet.agentAddress },
    { $set: { enabled: false, closeAllRequested: Boolean(closeAll), lastError: null } },
  );
  return getAyeLabsRealState({ viewerAnonymousId: anonymousId });
}

export async function runAyeLabsRealSignalCycle() {
  if (!isAyeLabsRealCronEnabled()) return { skipped: true, reason: "cron_disabled" };
  const enabled = await AyeLabsRealConfig.countDocuments({ enabled: true });
  if (!enabled) return { skipped: true, reason: "no_enabled_agents" };
  return {
    mode: "capped_real_gate",
    skipped: true,
    reason: "live_opens_not_wired_v1_paper_only",
    enabledAgents: enabled,
  };
}

export async function resolveAyeLabsRealPositions() {
  if (!isAyeLabsRealCronEnabled()) return { skipped: true, reason: "cron_disabled" };
  return {
    mode: "capped_real_gate",
    skipped: true,
    reason: "live_closes_not_wired_v1_paper_only",
  };
}
