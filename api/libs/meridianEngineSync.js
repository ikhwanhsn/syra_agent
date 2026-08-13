/**
 * Sync live Meridian engine filesystem state into MeridianRealPosition / MeridianRealConfig.
 * Engine owns trading; Syra is a mirror for the /meridian UI.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import MeridianRealConfig from "../models/MeridianRealConfig.js";
import MeridianRealPosition from "../models/MeridianRealPosition.js";
import MeridianState from "../models/MeridianState.js";
import { getMeridianEngineRoot, getEngineHealth } from "./meridianEngineSupervisor.js";

const LIVE_MODE = "live_engine";
/** Non-secret placeholder — engine owns the position keypair on disk / in-process. */
const LIVE_POSITION_SECRET = "live_engine:v1:external-key";

let lastSyncAt = null;
let lastSyncError = null;

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function readJsonSafe(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Optional: shell `node cli.js positions` for live on-chain PnL (JSON stdout).
 * Best-effort; returns null on failure.
 */
async function fetchCliPositions({ timeoutMs = 20_000 } = {}) {
  const cwd = getMeridianEngineRoot();
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, ["cli.js", "positions"], {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const t = setTimeout(() => {
      try {
        proc.kill("SIGKILL");
      } catch {
        /* ignore */
      }
      resolve(null);
    }, timeoutMs);
    proc.stdout.on("data", (b) => {
      stdout += String(b);
    });
    proc.stderr.on("data", (b) => {
      stderr += String(b);
    });
    proc.on("exit", (code) => {
      clearTimeout(t);
      if (code !== 0) {
        if (stderr) console.warn("[MeridianSync] cli positions stderr:", stderr.slice(0, 300));
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve(null);
      }
    });
  });
}

function mapLpShape(strategy) {
  const s = String(strategy || "bid_ask").toLowerCase();
  if (s === "spot" || s === "curve" || s === "mixed" || s === "bid_ask") return s;
  return "bid_ask";
}

function mapClosedStatus(pnlSol, pnlPct) {
  const n = toNum(pnlSol, toNum(pnlPct));
  if (n > 0) return "closed_win";
  if (n < 0) return "closed_loss";
  return "expired";
}

/**
 * Upsert open positions from state.json (+ optional CLI PnL overlay).
 */
async function upsertOpenFromState({
  experimentId,
  agentAddress,
  state,
  cliByPosition,
}) {
  const positions = state?.positions && typeof state.positions === "object" ? state.positions : {};
  const openKeys = new Set();
  let upserted = 0;

  for (const [key, pos] of Object.entries(positions)) {
    if (!pos || pos.closed) continue;
    const positionPubkey = String(pos.position || key);
    if (!positionPubkey) continue;
    openKeys.add(positionPubkey);

    const cli = cliByPosition?.get?.(positionPubkey) || null;
    const depositSol = toNum(pos.amount_sol, toNum(cli?.deposit_sol, 0.3));
    const binsBelow = toNum(pos.bin_range?.bins_below, 69);
    const binsAbove = toNum(pos.bin_range?.bins_above, 0);
    const pnlSol =
      cli?.pnl_sol != null
        ? toNum(cli.pnl_sol)
        : cli?.unrealized_pnl_sol != null
          ? toNum(cli.unrealized_pnl_sol)
          : null;
    const pnlUsd =
      cli?.pnl_usd != null
        ? toNum(cli.pnl_usd)
        : cli?.unrealized_pnl_usd != null
          ? toNum(cli.unrealized_pnl_usd)
          : null;

    await MeridianRealPosition.findOneAndUpdate(
      { agentAddress, positionPubkey },
      {
        $set: {
          experimentId,
          agentAddress,
          strategyId: 0,
          strategyName: String(pos.strategy || "bid_ask"),
          lpShape: mapLpShape(pos.strategy),
          poolAddress: String(pos.pool || pos.pool_address || "unknown"),
          poolName: pos.pool_name || null,
          binStep: pos.bin_step ?? null,
          binsBelow,
          binsAbove,
          activeBinAtOpen: pos.active_bin_at_deploy ?? null,
          entryPriceUsd: pos.initial_value_usd != null ? toNum(pos.initial_value_usd) : null,
          positionSecretEnc: LIVE_POSITION_SECRET,
          depositSol,
          depositUsd: toNum(pos.initial_value_usd, depositSol * 150),
          exitRules: null,
          signalSnapshot: pos.signal_snapshot || null,
          screeningSnapshot: {
            mode: LIVE_MODE,
            fee_tvl_ratio: pos.fee_tvl_ratio,
            organic_score: pos.organic_score,
            volatility: pos.volatility,
          },
          status: "open",
          depositLocked: true,
          peakPnlPct: toNum(pos.peak_pnl_pct),
          realNetPnlSol: pnlSol,
          realNetPnlUsd: pnlUsd,
          openedAt: pos.deployed_at ? new Date(pos.deployed_at) : new Date(),
          lastEvaluatedAt: new Date(),
          resolvedAt: null,
          errorMessage: null,
        },
        $setOnInsert: {
          processing: false,
        },
      },
      { upsert: true },
    );
    upserted += 1;
  }

  // Mark previously-open live_engine rows that vanished from state as closed (unknown pnl).
  const stale = await MeridianRealPosition.find({
    agentAddress,
    status: { $in: ["opening", "open", "closing"] },
    "screeningSnapshot.mode": LIVE_MODE,
    positionPubkey: { $nin: [...openKeys] },
  })
    .select("_id positionPubkey")
    .lean();

  for (const row of stale) {
    await MeridianRealPosition.updateOne(
      { _id: row._id },
      {
        $set: {
          status: "expired",
          resolution: "engine_state_missing",
          resolvedAt: new Date(),
          lastEvaluatedAt: new Date(),
        },
      },
    );
  }

  return { upserted, openKeys: openKeys.size, staleClosed: stale.length };
}

/**
 * Ingest closed performance rows from lessons.json.
 */
async function ingestClosedPerformance({ experimentId, agentAddress, lessons }) {
  const perf = Array.isArray(lessons?.performance) ? lessons.performance : [];
  let closed = 0;
  for (const row of perf.slice(-100)) {
    const positionPubkey = String(row.position || "");
    if (!positionPubkey) continue;
    const pnlSol = toNum(row.pnl_sol, toNum(row.pnl_usd) / 150);
    const pnlPct = toNum(row.pnl_pct);
    const status = mapClosedStatus(pnlSol, pnlPct);
    const existing = await MeridianRealPosition.findOne({ agentAddress, positionPubkey }).lean();
    if (existing && ["closed_win", "closed_loss", "expired"].includes(existing.status)) {
      continue;
    }
    await MeridianRealPosition.findOneAndUpdate(
      { agentAddress, positionPubkey },
      {
        $set: {
          experimentId,
          agentAddress,
          strategyId: 0,
          strategyName: String(row.strategy || "bid_ask"),
          lpShape: mapLpShape(row.strategy),
          poolAddress: String(row.pool || "unknown"),
          poolName: row.pool_name || null,
          binsBelow: toNum(row.bins_below, 69),
          binsAbove: toNum(row.bins_above, 0),
          positionSecretEnc: LIVE_POSITION_SECRET,
          depositSol: toNum(row.amount_sol, 0.3),
          depositUsd: toNum(row.deposit_usd, toNum(row.amount_sol, 0.3) * 150),
          screeningSnapshot: { mode: LIVE_MODE, close_reason: row.close_reason || null },
          status,
          resolution: row.close_reason || "engine_close",
          depositLocked: true,
          realNetPnlSol: pnlSol,
          realNetPnlUsd: toNum(row.pnl_usd),
          resolvedAt: row.recorded_at ? new Date(row.recorded_at) : new Date(),
          lastEvaluatedAt: new Date(),
          openedAt: row.deployed_at ? new Date(row.deployed_at) : new Date(),
        },
      },
      { upsert: true },
    );
    closed += 1;
  }
  return { closed };
}

/**
 * Sync engine state into Mongo for one agent (or the currently supervised agent).
 */
export async function syncMeridianEngineState({ agentAddress } = {}) {
  const root = getMeridianEngineRoot();
  const health = getEngineHealth();
  const addr = agentAddress || health.agentAddress;
  if (!addr) {
    return { skipped: true, reason: "no_agent_address", engine: health };
  }

  try {
    const stateDoc = await MeridianState.findById("singleton").lean();
    const experimentId = stateDoc?.activeExperimentId || `meridian-live-${addr.slice(0, 8)}`;

    const [state, lessons, cli] = await Promise.all([
      readJsonSafe(path.join(root, "state.json")),
      readJsonSafe(path.join(root, "lessons.json")),
      fetchCliPositions().catch(() => null),
    ]);

    /** @type {Map<string, any>} */
    const cliByPosition = new Map();
    const cliList = Array.isArray(cli?.positions) ? cli.positions : [];
    for (const p of cliList) {
      const pk = String(p.position || p.position_address || p.pubkey || "");
      if (pk) cliByPosition.set(pk, p);
    }

    const open = await upsertOpenFromState({
      experimentId,
      agentAddress: addr,
      state: state || { positions: {} },
      cliByPosition,
    });
    const closed = await ingestClosedPerformance({
      experimentId,
      agentAddress: addr,
      lessons: lessons || {},
    });

    lastSyncAt = new Date().toISOString();
    lastSyncError = null;

    await MeridianRealConfig.updateOne(
      { agentAddress: addr },
      {
        $set: {
          lastResolveAt: new Date(),
          lastError: null,
          experimentId,
        },
      },
    );

    return {
      ok: true,
      agentAddress: addr,
      lastSyncAt,
      open,
      closed,
      engine: health,
      cliPositions: cliList.length,
    };
  } catch (e) {
    lastSyncError = e instanceof Error ? e.message : String(e);
    console.warn("[MeridianSync] failed:", lastSyncError);
    if (addr) {
      await MeridianRealConfig.updateOne(
        { agentAddress: addr },
        { $set: { lastError: `sync_failed:${lastSyncError}`.slice(0, 500) } },
      ).catch(() => {});
    }
    return { ok: false, error: lastSyncError, engine: health };
  }
}

export function getMeridianSyncMeta() {
  return { lastSyncAt, lastSyncError, engine: getEngineHealth() };
}

/**
 * Best-effort close-all via Meridian CLI for each open live position.
 */
export async function closeAllEnginePositions({ agentAddress, timeoutMs = 60_000 } = {}) {
  const filter = {
    status: { $in: ["opening", "open", "closing"] },
    "screeningSnapshot.mode": LIVE_MODE,
  };
  if (agentAddress) filter.agentAddress = agentAddress;
  const open = await MeridianRealPosition.find(filter).select("positionPubkey").lean();
  const cwd = getMeridianEngineRoot();
  const results = [];

  for (const row of open) {
    const pk = row.positionPubkey;
    if (!pk || pk.startsWith("shadow:")) continue;
    // eslint-disable-next-line no-await-in-loop
    const out = await new Promise((resolve) => {
      const proc = spawn(process.execPath, ["cli.js", "close", "--position", pk], {
        cwd,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      const t = setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {
          /* ignore */
        }
        resolve({ positionPubkey: pk, ok: false, error: "timeout" });
      }, timeoutMs);
      proc.stdout.on("data", (b) => {
        stdout += String(b);
      });
      proc.stderr.on("data", (b) => {
        stderr += String(b);
      });
      proc.on("exit", (code) => {
        clearTimeout(t);
        resolve({
          positionPubkey: pk,
          ok: code === 0,
          code,
          stdout: stdout.slice(0, 500),
          stderr: stderr.slice(0, 500),
        });
      });
    });
    results.push(out);
  }
  return { closedAttempts: results.length, results };
}
