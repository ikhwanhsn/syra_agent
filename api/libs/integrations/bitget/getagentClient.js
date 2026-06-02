/**
 * Bitget GetAgent Playbook control-plane client.
 * @see api/node_modules/@bitget-ai/getagent-skill/skills/getagent/references/api/
 *
 * Auth: PLAYBOOK_API_KEY or BITGET_PLAYBOOK_API_KEY → ACCESS-KEY header.
 * Base: https://api.bitget.com
 */
const BITGET_API_BASE = (
  process.env.BITGET_PLAYBOOK_API_BASE ||
  process.env.BITGET_API_BASE_URL ||
  "https://api.bitget.com"
).replace(/\/$/, "");

const RUN_POLL_MS = Number(process.env.PLAYBOOK_RUN_POLL_MS || 4000);
const RUN_POLL_MAX = Number(process.env.PLAYBOOK_RUN_POLL_MAX || 45);

/**
 * @returns {boolean}
 */
export function hasPlaybookCredentials() {
  const key = getPlaybookApiKey();
  return Boolean(key);
}

/**
 * @returns {string}
 */
export function getPlaybookApiKey() {
  return (
    process.env.PLAYBOOK_API_KEY ||
    process.env.BITGET_PLAYBOOK_API_KEY ||
    process.env.BITGET_API_KEY ||
    ""
  ).trim();
}

/**
 * @param {string} path
 * @param {RequestInit & { json?: unknown }} [opts]
 */
async function playbookFetch(path, opts = {}) {
  const key = getPlaybookApiKey();
  if (!key) {
    throw new Error("PLAYBOOK_API_KEY not configured");
  }
  const url = `${BITGET_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "ACCESS-KEY": key,
    Accept: "application/json",
    ...(opts.headers || {}),
  };
  let body = opts.body;
  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body,
  });
  const text = await res.text().catch(() => "");
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const msg =
      data?.detail?.errors?.join?.("; ") ||
      data?.detail ||
      data?.msg ||
      data?.message ||
      text ||
      res.statusText;
    const err = new Error(`Playbook API ${res.status}: ${msg}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * @param {Buffer} tarGzBuffer
 * @param {string} [filename]
 * @returns {Promise<{ strategy_id: string; draft_id: string; name: string; status: string; suggested_version?: string }>}
 */
export async function uploadPlaybookPackage(tarGzBuffer, filename = "playbook.tar.gz") {
  const key = getPlaybookApiKey();
  if (!key) throw new Error("PLAYBOOK_API_KEY not configured");

  const form = new FormData();
  form.append(
    "package",
    new Blob([tarGzBuffer], { type: "application/gzip" }),
    filename,
  );

  const url = `${BITGET_API_BASE}/api/v1/playbook/upload`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "ACCESS-KEY": key },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.detail?.errors?.join?.("; ") ||
      JSON.stringify(data?.detail) ||
      data?.msg ||
      res.statusText;
    throw new Error(`Playbook upload ${res.status}: ${msg}`);
  }
  return data;
}

/**
 * @param {string} versionId draft or version id
 * @returns {Promise<{ run_id: string; status: string; version_id: string; strategy_id?: string }>}
 */
export async function dispatchPlaybookRun(versionId) {
  return playbookFetch("/api/v1/playbook/run", {
    method: "POST",
    json: { version_id: versionId },
  });
}

/**
 * @param {string} runId
 */
export async function getPlaybookRun(runId) {
  const q = new URLSearchParams({ run_id: runId });
  return playbookFetch(`/api/v1/playbook/run?${q}`);
}

/**
 * Poll until completed or failed.
 * @param {string} runId
 * @returns {Promise<Record<string, unknown>>}
 */
export async function pollPlaybookRunUntilDone(runId) {
  for (let i = 0; i < RUN_POLL_MAX; i += 1) {
    const row = await getPlaybookRun(runId);
    const status = String(row?.status || "").toLowerCase();
    if (status === "completed" || status === "failed") {
      return row;
    }
    await new Promise((r) => setTimeout(r, RUN_POLL_MS));
  }
  throw new Error(`Playbook run ${runId} timed out after ${RUN_POLL_MAX} polls`);
}

/**
 * @param {string} versionId
 * @returns {Promise<Record<string, unknown>>}
 */
export async function runPlaybookBacktest(versionId) {
  const dispatched = await dispatchPlaybookRun(versionId);
  const runId = dispatched?.run_id;
  if (!runId) throw new Error("Playbook run: missing run_id");
  return pollPlaybookRunUntilDone(String(runId));
}

/**
 * @param {string} draftId
 * @param {"patch"|"minor"|"major"} [bumpType]
 */
export async function publishPlaybookDraft(draftId, bumpType = "patch") {
  return playbookFetch("/api/v1/playbook/publish", {
    method: "POST",
    json: { draft_id: draftId, bump_type: bumpType },
  });
}

/**
 * @param {string} versionId
 * @param {{ chatId?: string; channel?: string; scheduleTimezone?: string }} [opts]
 */
export async function enablePlaybookSubscription(versionId, opts = {}) {
  return playbookFetch("/api/v1/playbook/enable", {
    method: "POST",
    json: {
      version_id: versionId,
      chat_id: opts.chatId || process.env.PLAYBOOK_DEFAULT_CHAT_ID || "0",
      channel: opts.channel || "telegram",
      schedule_timezone: opts.scheduleTimezone || "UTC",
    },
  });
}

/**
 * @param {string} instanceId
 */
export async function disablePlaybookSubscription(instanceId) {
  return playbookFetch("/api/v1/playbook/disable", {
    method: "POST",
    json: { instance_id: instanceId },
  });
}

/**
 * @param {{ status?: string }} [opts]
 */
export async function listPlaybooks(opts = {}) {
  const status = opts.status || "published";
  const key = getPlaybookApiKey();
  const q = new URLSearchParams({ status });
  const url = `${BITGET_API_BASE}/api/v1/playbook/list?${q}`;
  const headers = { Accept: "application/json" };
  if (key) headers["ACCESS-KEY"] = key;
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(`Playbook list ${res.status}: ${JSON.stringify(data)}`);
  }
  return Array.isArray(data) ? data : data?.data || [];
}

/**
 * Extract normalized backtest metrics from a completed run record.
 * @param {Record<string, unknown>} runRow
 */
export function extractBacktestMetrics(runRow) {
  const metrics =
    runRow?.metrics_output && typeof runRow.metrics_output === "object"
      ? runRow.metrics_output
      : null;
  const signal0 = Array.isArray(runRow?.signal_output) ? runRow.signal_output[0] : null;
  const signalMetrics =
    signal0 && typeof signal0 === "object" && signal0.metrics ? signal0.metrics : {};

  const pick = (k) => {
    const v = metrics?.[k] ?? signalMetrics?.[k];
    return v != null && Number.isFinite(Number(v)) ? Number(v) : null;
  };

  return {
    status: String(runRow?.status || "unknown"),
    failureReason: runRow?.failure_reason ? String(runRow.failure_reason) : null,
    totalReturnPct: pick("total_return_pct"),
    sharpeRatio: pick("sharpe_ratio"),
    maxDrawdownPct: pick("max_drawdown_pct"),
    winRate: pick("win_rate"),
    totalTrades: pick("total_trades") ?? (metrics?.total_trades != null ? Number(metrics.total_trades) : null),
    periodStart: runRow?.backtest_report?.period_start ?? null,
    periodEnd: runRow?.backtest_report?.period_end ?? null,
    raw: runRow,
  };
}
