/**
 * Kraken CLI wrapper for market data (no auth).
 * Requires the `kraken` binary from https://github.com/krakenfx/kraken-cli on PATH.
 * Market commands: ticker, orderbook, ohlc, trades, status, server-time, assets, pairs.
 */

import { spawn } from "child_process";

const KRAKEN_CLI_TIMEOUT_MS = 15_000;

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
 * @param {string | string[]} pair - e.g. 'BTCUSD' or ['BTCUSD','ETHUSD']
 */
export async function getTicker(pair) {
  const pairs = Array.isArray(pair) ? pair : [pair];
  if (pairs.length === 0) throw new Error("At least one pair required");
  return runKrakenCli(["ticker", ...pairs]);
}

/**
 * Order book for a pair. No auth.
 * @param {string} pair - e.g. 'BTCUSD'
 * @param {number} [count=25] - depth
 */
export async function getOrderbook(pair, count = 25) {
  if (!pair) throw new Error("pair required");
  return runKrakenCli(["orderbook", pair, "--count", String(count)]);
}

/**
 * OHLC candles. No auth.
 * @param {string} pair - e.g. 'BTCUSD'
 * @param {number} [interval=60] - minutes (1, 5, 15, 30, 60, 240, 1440, 10080, 21600)
 */
export async function getOhlc(pair, interval = 60) {
  if (!pair) throw new Error("pair required");
  return runKrakenCli(["ohlc", pair, "--interval", String(interval)]);
}

/**
 * Recent trades. No auth.
 * @param {string} pair - e.g. 'BTCUSD'
 * @param {number} [count=100] - number of trades
 */
export async function getTrades(pair, count = 100) {
  if (!pair) throw new Error("pair required");
  return runKrakenCli(["trades", pair, "--count", String(count)]);
}

/**
 * System status. No auth.
 */
export async function getStatus() {
  return runKrakenCli(["status"]);
}

/**
 * Server time. No auth.
 */
export async function getServerTime() {
  return runKrakenCli(["server-time"]);
}
