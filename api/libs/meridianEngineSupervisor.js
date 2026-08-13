/**
 * Supervises the live yunus-0x/meridian engine as a Syra-managed child process.
 * Signs from the custodied earn-pillar wallet (legacy custody only).
 * Secrets are injected via spawn env only — never written to disk.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MERIDIAN_ENGINE } from "../config/onchainEarnExperiments.js";
import { optionalSecret } from "../config/secrets.js";
import { getSolanaRpcUrlCandidates } from "./solanaServerRpc.js";
import { findOrEnsurePurposeWallet } from "./agentWalletProvision.js";
import { siblingAnonymousId, lpAgentAnonymousIdFrom } from "./agentWalletPurpose.js";
import { decryptAgentSecretFromStorage } from "./agentWalletSecretCrypto.js";
import { resolveUltraReferralParams } from "./jupiterReferral.js";
import AgentWallet from "../models/agent/AgentWallet.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYRA_ROOT = path.resolve(__dirname, "../..");

/** @type {import('node:child_process').ChildProcess | null} */
let child = null;
/** @type {{
 *   running: boolean,
 *   pid: number | null,
 *   agentAddress: string | null,
 *   anonymousId: string | null,
 *   restarts: number,
 *   lastExitCode: number | null,
 *   lastStderr: string,
 *   startedAt: string | null,
 *   dryRun: boolean,
 *   wantRunning: boolean,
 * } } */
const health = {
  running: false,
  pid: null,
  agentAddress: null,
  anonymousId: null,
  restarts: 0,
  lastExitCode: null,
  lastStderr: "",
  startedAt: null,
  dryRun: false,
  wantRunning: false,
};

let restartTimer = null;
let stderrBuf = "";

export function getMeridianEngineRoot() {
  return path.resolve(SYRA_ROOT, MERIDIAN_ENGINE.repoRelPath || "reference/meridian");
}

export function isMeridianEngineModeEnabled() {
  return Boolean(MERIDIAN_ENGINE.enabled);
}

export function getEngineHealth() {
  return {
    running: Boolean(child && !child.killed && child.exitCode == null),
    pid: child?.pid ?? health.pid,
    agentAddress: health.agentAddress,
    anonymousId: health.anonymousId,
    restarts: health.restarts,
    lastExitCode: health.lastExitCode,
    lastStderr: health.lastStderr.slice(-2000),
    startedAt: health.startedAt,
    dryRun: health.dryRun,
    wantRunning: health.wantRunning,
    mode: "live_engine",
    repo: getMeridianEngineRoot(),
  };
}

/**
 * Extract Helius API key from HELIUS_RPC_URL query string if present.
 * @param {string} rpcUrl
 */
function extractHeliusKeyFromRpc(rpcUrl) {
  try {
    const u = new URL(rpcUrl);
    return u.searchParams.get("api-key") || u.searchParams.get("apiKey") || "";
  } catch {
    return "";
  }
}

/**
 * Resolve earn-pillar wallet + base58 secret for the Meridian engine.
 * Prefers decrypted earn wallet; falls back to MERIDIAN_ENGINE_WALLET_PRIVATE_KEY env.
 */
export async function resolveEngineWallet(anonymousId) {
  const override = optionalSecret("MERIDIAN_ENGINE_WALLET_PRIVATE_KEY");
  if (override) {
    return {
      agentAddress: null,
      anonymousId: siblingAnonymousId(anonymousId, "earn") || anonymousId,
      privateKeyBase58: override,
      custody: "env_override",
      source: "MERIDIAN_ENGINE_WALLET_PRIVATE_KEY",
    };
  }

  if (!anonymousId) throw new Error("anonymousId required to resolve earn wallet");
  const earnAid = lpAgentAnonymousIdFrom(anonymousId);
  if (!earnAid) throw new Error("Invalid anonymous id for earn wallet");

  const wallet = await findOrEnsurePurposeWallet(anonymousId, "earn");
  if (!wallet?.agentAddress) throw new Error("Earn wallet not provisioned for this user");

  const doc = await AgentWallet.findOne({
    $or: [{ anonymousId: earnAid }, { agentAddress: wallet.agentAddress }],
  })
    .select("+agentSecretKey custody status chain agentAddress anonymousId")
    .lean();

  if (!doc?.agentSecretKey) {
    throw new Error("Earn wallet secret missing; cannot export key for Meridian engine");
  }
  if (doc.custody && doc.custody !== "legacy") {
    throw new Error(
      `Earn wallet custody=${doc.custody} cannot export a signing key for Meridian engine (legacy custody required)`,
    );
  }

  const privateKeyBase58 = decryptAgentSecretFromStorage(doc.agentSecretKey);
  if (!privateKeyBase58 || typeof privateKeyBase58 !== "string") {
    throw new Error("Failed to decrypt earn wallet secret");
  }

  return {
    agentAddress: doc.agentAddress || wallet.agentAddress,
    anonymousId: doc.anonymousId || earnAid,
    privateKeyBase58,
    custody: "legacy",
    source: "earn_pillar",
  };
}

/**
 * Refuse to start if LP real is enabled on the same earn wallet (contention).
 */
export async function assertNoLpRealContention(agentAddress) {
  if (!agentAddress) return;
  try {
    const LpRealConfig = (await import("../models/LpRealConfig.js")).default;
    const conflict = await LpRealConfig.findOne({
      agentAddress: String(agentAddress),
      enabled: true,
    })
      .select("_id agentAddress enabled")
      .lean();
    if (conflict) {
      throw new Error(
        `lp_real_contention: LP real is enabled on earn wallet ${agentAddress}. Disable LP real before starting Meridian engine.`,
      );
    }
  } catch (e) {
    if (String(e?.message || e).startsWith("lp_real_contention:")) throw e;
    // Model missing / unrelated import failure should not block — log soft.
    console.warn("[MeridianEngine] LP real contention check skipped:", e?.message || e);
  }
}

/**
 * Build child env. Never log WALLET_PRIVATE_KEY.
 * @param {{ privateKeyBase58: string, dryRun?: boolean }} opts
 */
export function buildChildEnv({ privateKeyBase58, dryRun = false }) {
  const rpcCandidates = getSolanaRpcUrlCandidates();
  const rpcUrl = rpcCandidates[0] || optionalSecret("SOLANA_RPC_URL") || "";
  const heliusFromEnv = optionalSecret("HELIUS_API_KEY");
  const heliusFromRpc = extractHeliusKeyFromRpc(rpcUrl);
  const openrouter = optionalSecret("OPENROUTER_API_KEY");

  /** @type {Record<string, string>} */
  const env = {
    ...process.env,
    WALLET_PRIVATE_KEY: privateKeyBase58,
    DRY_RUN: dryRun ? "true" : "false",
  };
  if (rpcUrl) {
    env.RPC_URL = rpcUrl;
    env.PNL_RPC_URL = rpcUrl;
  }
  if (openrouter) {
    env.OPENROUTER_API_KEY = openrouter;
    env.LLM_API_KEY = openrouter;
    // Some openai SDK builds still probe OPENAI_API_KEY when constructing the client.
    env.OPENAI_API_KEY = openrouter;
  }
  const llmKey = optionalSecret("LLM_API_KEY");
  if (llmKey && !env.LLM_API_KEY) {
    env.LLM_API_KEY = llmKey;
    env.OPENAI_API_KEY = llmKey;
  }
  const llmBase = optionalSecret("LLM_BASE_URL");
  if (llmBase) env.LLM_BASE_URL = llmBase;
  if (heliusFromEnv || heliusFromRpc) {
    env.HELIUS_API_KEY = heliusFromEnv || heliusFromRpc;
  }

  // Use Syra's Jupiter referral on Meridian Ultra swaps (same as Syra swap path).
  // Overrides Meridian's built-in referral account when present.
  const jupApiKey = optionalSecret("JUPITER_API_KEY");
  if (jupApiKey) env.JUPITER_API_KEY = jupApiKey;
  const ultra = resolveUltraReferralParams();
  if (ultra.referralAccount && ultra.referralFeeBps > 0) {
    env.JUPITER_REFERRAL_ACCOUNT = ultra.referralAccount;
    env.JUPITER_REFERRAL_FEE_BPS = String(ultra.referralFeeBps);
  } else {
    // Explicitly clear so Meridian does not fall back to its upstream default account.
    env.JUPITER_REFERRAL_ACCOUNT = "";
    env.JUPITER_REFERRAL_FEE_BPS = "0";
  }

  return env;
}

function clearRestartTimer() {
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }
}

function scheduleRestart(ctx) {
  clearRestartTimer();
  if (!health.wantRunning) return;
  if (health.restarts >= (MERIDIAN_ENGINE.maxRestarts || 20)) {
    console.error("[MeridianEngine] max restarts reached; giving up");
    health.wantRunning = false;
    return;
  }
  const delay = MERIDIAN_ENGINE.restartBackoffMs || 5_000;
  restartTimer = setTimeout(() => {
    restartTimer = null;
    if (!health.wantRunning) return;
    health.restarts += 1;
    startEngineInternal(ctx).catch((err) => {
      console.error("[MeridianEngine] restart failed:", err?.message || err);
    });
  }, delay);
}

/**
 * @param {{
 *   anonymousId: string,
 *   agentAddress?: string | null,
 *   privateKeyBase58: string,
 *   dryRun?: boolean,
 * }} ctx
 */
async function startEngineInternal(ctx) {
  if (child && child.exitCode == null && !child.killed) {
    return getEngineHealth();
  }

  const cwd = getMeridianEngineRoot();
  const entry = MERIDIAN_ENGINE.entry || "index.js";
  const env = buildChildEnv({
    privateKeyBase58: ctx.privateKeyBase58,
    dryRun: Boolean(ctx.dryRun),
  });

  stderrBuf = "";
  child = spawn(process.execPath, [entry], {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });

  health.running = true;
  health.pid = child.pid ?? null;
  health.agentAddress = ctx.agentAddress || null;
  health.anonymousId = ctx.anonymousId || null;
  health.startedAt = new Date().toISOString();
  health.dryRun = Boolean(ctx.dryRun);
  health.lastExitCode = null;

  child.stdout?.on("data", (buf) => {
    const line = String(buf).trim();
    if (line) console.log(`[MeridianEngine:${child?.pid}] ${line.slice(0, 500)}`);
  });
  child.stderr?.on("data", (buf) => {
    const line = String(buf);
    stderrBuf = (stderrBuf + line).slice(-4000);
    health.lastStderr = stderrBuf;
    console.warn(`[MeridianEngine:${child?.pid}:err] ${line.trim().slice(0, 500)}`);
  });
  child.on("exit", (code, signal) => {
    health.running = false;
    health.lastExitCode = code;
    health.pid = null;
    child = null;
    console.warn(
      `[MeridianEngine] exited code=${code} signal=${signal} wantRunning=${health.wantRunning}`,
    );
    if (health.wantRunning) {
      scheduleRestart(ctx);
    }
  });

  return getEngineHealth();
}

/**
 * Start the Meridian engine for a user (earn wallet). Live by default.
 * @param {{ anonymousId: string, dryRun?: boolean }} opts
 */
export async function startEngine({ anonymousId, dryRun = false } = {}) {
  if (!isMeridianEngineModeEnabled()) {
    throw new Error("MERIDIAN_ENGINE.enabled is false");
  }
  if (!anonymousId) throw new Error("anonymousId required");

  const wallet = await resolveEngineWallet(anonymousId);
  if (wallet.agentAddress) {
    await assertNoLpRealContention(wallet.agentAddress);
  }

  if (!optionalSecret("OPENROUTER_API_KEY") && !optionalSecret("LLM_API_KEY")) {
    throw new Error("OPENROUTER_API_KEY (or LLM_API_KEY) required to run Meridian engine");
  }
  const rpc = getSolanaRpcUrlCandidates()[0];
  if (!rpc) {
    throw new Error("No Solana RPC URL configured (SOLANA_RPC_URL / HELIUS_RPC_URL)");
  }

  health.wantRunning = true;
  clearRestartTimer();

  return startEngineInternal({
    anonymousId: wallet.anonymousId,
    agentAddress: wallet.agentAddress,
    privateKeyBase58: wallet.privateKeyBase58,
    dryRun,
  });
}

/**
 * Stop the engine (SIGTERM). Clears wantRunning so it does not auto-restart.
 */
export async function stopEngine({ timeoutMs = 10_000 } = {}) {
  health.wantRunning = false;
  clearRestartTimer();
  const proc = child;
  if (!proc || proc.killed || proc.exitCode != null) {
    health.running = false;
    health.pid = null;
    child = null;
    return getEngineHealth();
  }

  await new Promise((resolve) => {
    const t = setTimeout(() => {
      try {
        proc.kill("SIGKILL");
      } catch {
        /* ignore */
      }
      resolve();
    }, timeoutMs);

    proc.once("exit", () => {
      clearTimeout(t);
      resolve();
    });
    try {
      proc.kill("SIGTERM");
    } catch {
      clearTimeout(t);
      resolve();
    }
  });

  health.running = false;
  health.pid = null;
  child = null;
  return getEngineHealth();
}

/**
 * Ensure engine is running for every enabled MeridianRealConfig (called on interval).
 */
export async function tickMeridianEngineSupervisor() {
  if (!isMeridianEngineModeEnabled()) return { skipped: true, reason: "engine_disabled" };
  try {
    const MeridianRealConfig = (await import("../models/MeridianRealConfig.js")).default;
    const enabled = await MeridianRealConfig.find({ enabled: true })
      .select("agentAddress anonymousId")
      .lean();
    if (!enabled.length) {
      if (health.wantRunning) await stopEngine();
      return { running: false, enabledAgents: 0 };
    }
    // Single-engine supervisor: run for the first enabled agent (ops desk).
    const row = enabled[0];
    const aid = row.anonymousId;
    if (!aid) return { skipped: true, reason: "missing_anonymousId" };
    if (!health.wantRunning || !getEngineHealth().running) {
      await startEngine({ anonymousId: aid, dryRun: false });
    }
    return { ...getEngineHealth(), enabledAgents: enabled.length };
  } catch (e) {
    console.warn("[MeridianEngine] tick failed:", e?.message || e);
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** Kill engine on API process shutdown. */
export function registerMeridianEngineShutdownHook() {
  const stop = () => {
    try {
      health.wantRunning = false;
      if (child && !child.killed) child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}
