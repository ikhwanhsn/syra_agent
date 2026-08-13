/**
 * Meridian real layer — live yunus-0x/meridian engine as source of truth.
 *
 * When MERIDIAN_ENGINE.enabled (default), enable starts the supervised engine which
 * signs from the earn-pillar wallet and deploys/closes real Meteora positions.
 * Syra mirrors engine state.json into MeridianRealPosition for the /meridian UI.
 *
 * Shadow signal/resolve helpers are retained only as a fallback when the engine
 * gate is off (dev / emergency). Live opens never use the shadow path when the
 * engine is running.
 */
import MeridianRealConfig from "../models/MeridianRealConfig.js";
import MeridianRealPosition from "../models/MeridianRealPosition.js";
import MeridianState from "../models/MeridianState.js";
import { MERIDIAN_CRON, MERIDIAN_ENGINE } from "../config/onchainEarnExperiments.js";
import { ensureMeridianBootstrapped, getMeridianStats } from "./meridianService.js";
import { selectMeridianBanditLeader } from "./meridianEvolution.js";
import { lpAgentAnonymousIdFrom } from "./agentWalletPurpose.js";
import { findOrEnsurePurposeWallet } from "./agentWalletProvision.js";
import { clamp } from "./earnExperimentKit.js";
import {
  getEngineHealth,
  isMeridianEngineModeEnabled,
  startEngine,
  stopEngine,
  assertNoLpRealContention,
} from "./meridianEngineSupervisor.js";
import {
  syncMeridianEngineState,
  getMeridianSyncMeta,
  closeAllEnginePositions,
} from "./meridianEngineSync.js";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

/** Hard caps — enforced regardless of stored config values. */
const MAX_POSITION_SOL_CAP = MERIDIAN_ENGINE.maxDeployAmount || 0.5;
const DEFAULT_MAX_POSITION_SOL = MERIDIAN_ENGINE.deployAmountSol || 0.3;
const MAX_CONCURRENT_CAP = MERIDIAN_ENGINE.maxPositions || 2;
const DEFAULT_MAX_CONCURRENT = MERIDIAN_ENGINE.maxPositions || 2;
const DEFAULT_DAILY_MAX_LOSS_SOL = 0.5;

const PAPER_GRAD_MIN_DECIDED = 20;
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

export function isMeridianRealCronEnabled() {
  return Boolean(MERIDIAN_CRON.realEnabled);
}

/** Resolve the earn-pillar wallet that signs Meridian live trades (same as LP real). */
async function resolveMeridianWallet(anonymousId) {
  const aid = lpAgentAnonymousIdFrom(anonymousId);
  if (!aid) throw new Error("Invalid anonymous id");
  const wallet = await findOrEnsurePurposeWallet(anonymousId, "earn");
  if (!wallet?.agentAddress) throw new Error("Earn wallet not provisioned for this user");
  return wallet;
}

export async function ensureMeridianRealBootstrapped() {
  await ensureMeridianBootstrapped();
  return MeridianState.findById("singleton").lean();
}

export async function getOrCreateConfig(wallet) {
  const state = await ensureMeridianRealBootstrapped();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) throw new Error("Meridian experiment cohort not initialized");
  let cfg = await MeridianRealConfig.findById(wallet.agentAddress);
  if (!cfg) {
    cfg = await MeridianRealConfig.create({
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

export async function checkMeridianPaperGraduation() {
  const stats = await getMeridianStats();
  const totals = (stats.agents || []).reduce(
    (acc, a) => ({
      decided: acc.decided + toNum(a.decided),
      sumNetPnlSol: acc.sumNetPnlSol + toNum(a.sumNetPnlSol),
    }),
    { decided: 0, sumNetPnlSol: 0 },
  );
  const pass = totals.decided >= PAPER_GRAD_MIN_DECIDED && totals.sumNetPnlSol > 0;
  return {
    pass,
    decided: totals.decided,
    sumNetPnlSol: totals.sumNetPnlSol,
    minDecided: PAPER_GRAD_MIN_DECIDED,
    reason: pass ? null : `need_${PAPER_GRAD_MIN_DECIDED}_decided_positive_net_pnl`,
  };
}

export async function getMeridianRealState({ viewerAnonymousId } = {}) {
  let config = null;
  let canEnable = false;
  const graduation = await checkMeridianPaperGraduation();
  const syncMeta = getMeridianSyncMeta();
  const engine = getEngineHealth();

  if (viewerAnonymousId) {
    try {
      const wallet = await resolveMeridianWallet(viewerAnonymousId);
      config = await getOrCreateConfig(wallet);
      canEnable = true;
    } catch {
      config = null;
    }
  }

  const agentFilter = config?.agentAddress ? { agentAddress: config.agentAddress } : {};
  const [openPositions, closedAgg] = await Promise.all([
    MeridianRealPosition.countDocuments({ ...agentFilter, status: { $in: [...OPEN_STATUSES] } }),
    MeridianRealPosition.aggregate([
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
  const mode = isMeridianEngineModeEnabled() ? "live_engine" : "paper_leader_shadow";

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
    /** Aliases for older frontend field names. */
    realizedPnlSol: toNum(closedAgg[0]?.realizedNetPnlSol),
    wins,
    losses,
    realWinRate: decided > 0 ? wins / decided : null,
    realWins: wins,
    realLosses: losses,
    canEnable,
    cronEnabled: isMeridianRealCronEnabled(),
    paperGraduation: {
      ...graduation,
      sumPnlSol: graduation.sumNetPnlSol,
    },
    caps: {
      maxPositionSol: MAX_POSITION_SOL_CAP,
      maxConcurrentPositions: MAX_CONCURRENT_CAP,
      capSol: MERIDIAN_ENGINE.capSol,
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
      mode,
      walletPurpose: "earn",
    },
    engine: {
      ...engine,
      lastSyncAt: syncMeta.lastSyncAt,
      lastSyncError: syncMeta.lastSyncError,
    },
  };
}

export async function listMeridianRealPositions({ limit, offset, status, agentAddress } = {}) {
  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);
  const filter = {};
  if (status) filter.status = status;
  if (agentAddress) filter.agentAddress = agentAddress;
  const [positions, total] = await Promise.all([
    MeridianRealPosition.find(filter).sort({ openedAt: -1 }).skip(off).limit(lim).lean(),
    MeridianRealPosition.countDocuments(filter),
  ]);
  return { positions, total };
}

/**
 * Enable Meridian live engine. Starts the supervised child process (DRY_RUN=false).
 * Graduation can be skipped with requireGraduation:false for immediate live ops.
 */
export async function enableMeridianReal({
  anonymousId,
  enabledBy,
  maxPositionSol,
  requireGraduation = true,
  dryRun = false,
}) {
  if (!anonymousId) throw new Error("anonymousId required");
  if (!isMeridianEngineModeEnabled()) {
    throw new Error("MERIDIAN_ENGINE.enabled is false — cannot start live engine");
  }

  const graduation = await checkMeridianPaperGraduation();
  if (requireGraduation && !graduation.pass) {
    throw new Error(`paper_graduation_blocked:${graduation.reason}`);
  }

  const wallet = await resolveMeridianWallet(anonymousId);
  await assertNoLpRealContention(wallet.agentAddress);

  const earnAid = lpAgentAnonymousIdFrom(anonymousId);
  const cfg = await getOrCreateConfig(wallet);
  const stats = await getMeridianStats();
  const leader = selectMeridianBanditLeader(stats.agents, { minDecided: LEADER_MIN_DECIDED });

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
  cfg.lastError = graduation.pass ? null : `soft_warn:${graduation.reason}`;
  cfg.capitalBaselineSol = cfg.capitalBaselineSol ?? MERIDIAN_ENGINE.capSol;
  await cfg.save();

  const engineHealth = await startEngine({ anonymousId, dryRun: Boolean(dryRun) });
  await syncMeridianEngineState({ agentAddress: wallet.agentAddress }).catch(() => null);

  const state = await getMeridianRealState({ viewerAnonymousId: anonymousId });
  return { ...state, engineStart: engineHealth };
}

export async function disableMeridianReal({ anonymousId, closeAll = true }) {
  const wallet = await resolveMeridianWallet(anonymousId);
  await MeridianRealConfig.updateOne(
    { _id: wallet.agentAddress },
    { $set: { enabled: false, closeAllRequested: Boolean(closeAll) } },
  );

  let closeResult = null;
  if (closeAll) {
    closeResult = await closeAllEnginePositions({ agentAddress: wallet.agentAddress }).catch(
      (e) => ({ error: e instanceof Error ? e.message : String(e) }),
    );
  }

  const engineStop = await stopEngine();
  await syncMeridianEngineState({ agentAddress: wallet.agentAddress }).catch(() => null);

  const state = await getMeridianRealState({ viewerAnonymousId: anonymousId });
  return { ...state, engineStop, closeResult };
}

/**
 * When engine mode is on: sync only (engine owns opens).
 * Shadow signal cycle is intentionally skipped.
 */
export async function runMeridianRealSignalCycle() {
  if (!isMeridianRealCronEnabled()) return { skipped: true, reason: "cron_disabled" };
  if (isMeridianEngineModeEnabled()) {
    return {
      mode: "live_engine",
      skipped: true,
      reason: "engine_owns_trading",
      sync: await syncMeridianEngineState(),
    };
  }
  return { skipped: true, reason: "shadow_disabled_use_engine" };
}

/**
 * When engine mode is on: sync engine state (closes are owned by the engine).
 */
export async function resolveMeridianRealPositions(opts = {}) {
  if (isMeridianEngineModeEnabled()) {
    if (opts.forceCloseAll && opts.agentAddress) {
      await closeAllEnginePositions({ agentAddress: opts.agentAddress });
    }
    return {
      mode: "live_engine",
      sync: await syncMeridianEngineState({ agentAddress: opts.agentAddress }),
    };
  }
  return { skipped: true, reason: "shadow_disabled_use_engine" };
}

/** Cron tick: keep engine alive for enabled configs + sync state. */
export async function runMeridianEngineTick() {
  const { tickMeridianEngineSupervisor } = await import("./meridianEngineSupervisor.js");
  const tick = await tickMeridianEngineSupervisor();
  const sync = await syncMeridianEngineState();
  return { tick, sync };
}
