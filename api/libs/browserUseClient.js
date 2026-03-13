/**
 * Browser Use Cloud API v3 client: run a natural-language browser task and return output.
 * Uses BROWSER_USE_API_KEY (or X-Browser-Use-API-Key). Base URL: https://api.browser-use.com/api/v3
 */
const BROWSER_USE_BASE = "https://api.browser-use.com/api/v3";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 300000; // 5 min

const TERMINAL_STATUSES = new Set(["idle", "stopped", "timed_out", "error"]);

/**
 * Run a browser task: create session with task, poll until done, return result.
 * @param {string} apiKey - BROWSER_USE_API_KEY
 * @param {{ task: string; start_url?: string; model?: string; maxCostUsd?: number }} options
 * @returns {Promise<{ output: string | object | null; id: string; status: string; liveUrl?: string; totalCostUsd?: string; error?: string }>}
 */
export async function runBrowserTask(apiKey, options = {}) {
  const { task, start_url, model = "bu-mini", maxCostUsd } = options;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error("Browser Use API key is not configured (BROWSER_USE_API_KEY)");
  }
  if (!task || typeof task !== "string" || !task.trim()) {
    throw new Error("task is required");
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Browser-Use-API-Key": apiKey.trim(),
  };

  // POST /sessions – create session and dispatch task (start_url not in BU schema; omit for now)
  const body = { task: task.trim(), model };
  if (maxCostUsd != null && Number.isFinite(Number(maxCostUsd))) {
    body.maxCostUsd = Number(maxCostUsd);
  }

  const createRes = await fetch(`${BROWSER_USE_BASE}/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    let errMsg = `Browser Use API error: ${createRes.status}`;
    try {
      const j = JSON.parse(text);
      if (j.detail) errMsg += " " + (Array.isArray(j.detail) ? j.detail.map((d) => d.msg).join("; ") : String(j.detail));
      else if (j.message) errMsg += " " + j.message;
    } catch {
      if (text) errMsg += " " + text.slice(0, 200);
    }
    throw new Error(errMsg);
  }

  const session = await createRes.json();
  const id = session.id;
  if (!id) {
    throw new Error("Browser Use API did not return session id");
  }

  let status = session.status;
  let output = session.output ?? null;
  const liveUrl = session.liveUrl ?? undefined;
  const totalCostUsd = session.totalCostUsd ?? undefined;

  if (TERMINAL_STATUSES.has(status)) {
    return {
      output: output != null ? output : (status === "error" ? null : ""),
      id,
      status,
      liveUrl,
      totalCostUsd,
      ...(status === "error" && { error: session.error ?? "Task ended with error" }),
    };
  }

  // Poll GET /sessions/:id until terminal
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const getRes = await fetch(`${BROWSER_USE_BASE}/sessions/${id}`, { headers });
    if (!getRes.ok) {
      throw new Error(`Browser Use API poll error: ${getRes.status} ${await getRes.text()}`);
    }
    const next = await getRes.json();
    status = next.status;
    output = next.output ?? output;
    if (TERMINAL_STATUSES.has(status)) {
      return {
        output: output != null ? output : (status === "error" ? null : ""),
        id,
        status,
        liveUrl: next.liveUrl ?? liveUrl,
        totalCostUsd: next.totalCostUsd ?? totalCostUsd,
        ...(status === "error" && { error: next.error ?? "Task ended with error" }),
      };
    }
  }

  throw new Error("Browser Use task timed out (5 min)");
}
