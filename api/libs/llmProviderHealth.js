/**
 * Periodic health probes for active LLM Exchange providers.
 * Updates callability / latency scores and auto-pauses after consecutive failures.
 */
import LlmProvider from '../models/LlmProvider.js';
import { isMongooseConnected } from '../config/mongoose.js';
import { testLlmProviderConnection } from './llmService.js';
import { recordProviderCallHealth } from './llmRouter.js';

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000; // 15m
const BATCH_SIZE = 20;

let timer = null;
let running = false;

/**
 * Probe up to BATCH_SIZE active providers (oldest lastProbeAt first).
 */
export async function runLlmProviderHealthTick() {
  if (!isMongooseConnected()) {
    return { ok: false, reason: 'db_unavailable' };
  }
  if (running) {
    return { ok: false, reason: 'already_running' };
  }
  running = true;
  try {
    const docs = await LlmProvider.find({
      status: 'active',
      isSystemFallback: { $ne: true },
    })
      .sort({ 'health.lastProbeAt': 1, updatedAt: 1 })
      .limit(BATCH_SIZE)
      .lean();

    let probed = 0;
    let failed = 0;
    for (const doc of docs) {
      const result = await testLlmProviderConnection(doc, {
        modelId: doc.models?.[0]?.id,
        timeoutMs: 12_000,
      });
      await recordProviderCallHealth(doc._id, {
        ok: result.ok,
        latencyMs: result.latencyMs,
        error: result.error,
      });
      probed += 1;
      if (!result.ok) failed += 1;
    }

    return { ok: true, probed, failed };
  } finally {
    running = false;
  }
}

/**
 * Start the health cron (no-op if disabled or already started).
 * @param {{ intervalMs?: number }} [opts]
 */
export function startLlmProviderHealthCron(opts = {}) {
  if (String(process.env.LLM_EXCHANGE_HEALTH_CRON || '1') === '0') {
    return { started: false, reason: 'disabled' };
  }
  if (timer) return { started: false, reason: 'already_started' };

  const intervalMs = Math.max(
    60_000,
    Number(opts.intervalMs) ||
      Number.parseInt(process.env.LLM_EXCHANGE_HEALTH_INTERVAL_MS || '', 10) ||
      DEFAULT_INTERVAL_MS,
  );

  // Stagger first run.
  setTimeout(() => {
    runLlmProviderHealthTick().catch(() => {});
  }, 45_000);

  timer = setInterval(() => {
    runLlmProviderHealthTick().catch(() => {});
  }, intervalMs);

  if (typeof timer.unref === 'function') timer.unref();

  return { started: true, intervalMs };
}

export function stopLlmProviderHealthCron() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
