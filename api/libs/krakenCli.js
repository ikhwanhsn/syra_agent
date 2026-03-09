/**
 * Kraken CLI wrapper for market data (no auth).
 * Prefers the `kraken` binary from https://github.com/krakenfx/kraken-cli on PATH.
 * Fallback: all endpoints use Kraken public REST API when CLI is missing or fails.
 */

import { spawn } from "child_process";

const KRAKEN_CLI_TIMEOUT_MS = 15_000;
const KRAKEN_REST_BASE = "https://api.kraken.com/0/public";

/**
 * Run kraken CLI with given args and return parsed JSON from stdout.
 * @param {string[]} args - CLI args (e.g. ['ticker', 'BTCUSD']; '-o json' is appended automatically)
 * @returns {Promise<object>} Parsed JSON (or error envelope from CLI)
 * @throws {Error} If CLI not found, timeout, or non-JSON stdout
 */
export function runKrakenCli(args) {
  return new Promise((resolve, reject) => {
    const fullArgs = [...args, "-o", "json"];
    const proc = spawn("kraken", fullArgs, {
      env: { ...process.env },
      shell: true,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.setEncoding("utf8");
    proc.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    proc.stderr.setEncoding("utf8");
    proc.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    const timeout = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error("Kraken CLI timeout"));
    }, KRAKEN_CLI_TIMEOUT_MS);

    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    proc.on("close", (code) => {
      clearTimeout(timeout);
      const trimmed = stdout.trim();
      if (!trimmed) {
        reject(new Error(stderr || "Kraken CLI produced no output"));
        return;
      }
      try {
        const data = JSON.parse(trimmed);
        resolve(data);
      } catch (e) {
        reject(new Error(`Kraken CLI invalid JSON: ${trimmed.slice(0, 200)}`));
      }
    });
  });
}

/**
 * Ticker for one or more pairs. No auth.
 * Uses CLI when available; falls back to Kraken REST API.
 * @param {string | string[]} pair - e.g. 'BTCUSD' or ['BTCUSD','ETHUSD']
 */
export async function getTicker(pair) {
  const pairs = Array.isArray(pair) ? pair : [pair];
  if (pairs.length === 0) throw new Error("At least one pair required");
  try {
    return await runKrakenCli(["ticker", ...pairs]);
  } catch (cliErr) {
    const pairParam = pairs.join(",");
    const res = await fetch(`${KRAKEN_REST_BASE}/Ticker?pair=${encodeURIComponent(pairParam)}`);
    const data = await res.json().catch(() => ({}));
    if (data.error && data.error.length > 0) {
      throw new Error(data.error.join(" ") || "Kraken ticker failed");
    }
    if (data.result) return data;
    throw cliErr;
  }
}

/**
 * Order book for a pair. No auth.
 * Uses CLI when available; falls back to Kraken REST API (Depth).
 * @param {string} pair - e.g. 'BTCUSD'
 * @param {number} [count=25] - depth
 */
export async function getOrderbook(pair, count = 25) {
  if (!pair) throw new Error("pair required");
  try {
    return await runKrakenCli(["orderbook", pair, "--count", String(count)]);
  } catch (cliErr) {
    const res = await fetch(
      `${KRAKEN_REST_BASE}/Depth?pair=${encodeURIComponent(pair)}&count=${Math.min(Math.max(1, count), 500)}`
    );
    const data = await res.json().catch(() => ({}));
    if (data.error && data.error.length > 0) {
      throw new Error(data.error.join(" ") || "Kraken orderbook failed");
    }
    if (data.result) return data;
    throw cliErr;
  }
}

/**
 * OHLC candles. No auth.
 * Uses CLI when available; falls back to Kraken REST API.
 * @param {string} pair - e.g. 'BTCUSD'
 * @param {number} [interval=60] - minutes (1, 5, 15, 30, 60, 240, 1440, 10080, 21600)
 */
export async function getOhlc(pair, interval = 60) {
  if (!pair) throw new Error("pair required");
  try {
    return await runKrakenCli(["ohlc", pair, "--interval", String(interval)]);
  } catch (cliErr) {
    const res = await fetch(
      `${KRAKEN_REST_BASE}/OHLC?pair=${encodeURIComponent(pair)}&interval=${Math.min(Math.max(1, interval), 21600)}`
    );
    const data = await res.json().catch(() => ({}));
    if (data.error && data.error.length > 0) {
      throw new Error(data.error.join(" ") || "Kraken OHLC failed");
    }
    if (data.result) return data;
    throw cliErr;
  }
}

/**
 * Recent trades. No auth.
 * Uses CLI when available; falls back to Kraken REST API.
 * @param {string} pair - e.g. 'BTCUSD'
 * @param {number} [count=100] - number of trades
 */
export async function getTrades(pair, count = 100) {
  if (!pair) throw new Error("pair required");
  try {
    return await runKrakenCli(["trades", pair, "--count", String(count)]);
  } catch (cliErr) {
    const limit = Math.min(Math.max(1, count), 1000);
    const res = await fetch(
      `${KRAKEN_REST_BASE}/Trades?pair=${encodeURIComponent(pair)}&count=${limit}`
    );
    const data = await res.json().catch(() => ({}));
    if (data.error && data.error.length > 0) {
      throw new Error(data.error.join(" ") || "Kraken trades failed");
    }
    if (data.result) return data;
    throw cliErr;
  }
}

/**
 * System status. No auth.
 * Uses CLI when available; falls back to Kraken REST API so the route works without the binary.
 */
export async function getStatus() {
  try {
    return await runKrakenCli(["status"]);
  } catch (cliErr) {
    const res = await fetch(`${KRAKEN_REST_BASE}/SystemStatus`);
    const data = await res.json().catch(() => ({}));
    if (data.error && data.error.length > 0) {
      throw new Error(data.error.join(" ") || "Kraken system status failed");
    }
    if (data.result) return data;
    throw cliErr;
  }
}

/**
 * Server time. No auth.
 * Uses CLI when available; falls back to Kraken REST API so the route works without the binary.
 */
export async function getServerTime() {
  try {
    return await runKrakenCli(["server-time"]);
  } catch (cliErr) {
    const res = await fetch(`${KRAKEN_REST_BASE}/Time`);
    const data = await res.json().catch(() => ({}));
    if (data.error && data.error.length > 0) {
      throw new Error(data.error.join(" ") || "Kraken server time failed");
    }
    if (data.result) return data;
    throw cliErr;
  }
}
