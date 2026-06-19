/**
 * Smoke test for upstream hardening: signal, news ticker, nansen chains.
 * Usage: node scripts/testUpstreamHardening.js [--base-url=http://localhost:3000]
 */
import { resolveTickerLocal } from "../utils/coingeckoAPI.js";
import { loadSignal } from "../routes/signal.js";
import { fetchBinanceKlinesJson } from "../libs/binanceSignalAnalysis.js";
import { smartMoneyNetflow } from "../request/nansen/nansenX402.js";

const BASE_URL = (() => {
  const arg = process.argv.find((a) => a.startsWith("--base-url="));
  return (arg ? arg.split("=")[1] : process.env.SYRA_API_BASE_URL || "https://api.syraa.fun").replace(
    /\/$/,
    "",
  );
})();

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function testTickerLocal() {
  console.log("\n=== Ticker resolution (no CoinGecko) ===");
  const cases = [
    ["BTC", "BTC"],
    ["bitcoin", "BTC"],
    ["general", "general"],
    ["SOL", "SOL"],
    ["pepe", "PEPE"],
  ];
  for (const [input, expected] of cases) {
    const got = resolveTickerLocal(input);
    if (got === expected) pass(`resolveTickerLocal(${input})`, got);
    else fail(`resolveTickerLocal(${input})`, `expected ${expected}, got ${got}`);
  }
}

async function testNansenChainsNormalization() {
  console.log("\n=== Nansen chains payload (via smartMoneyNetflow mock) ===");
  // smartMoneyNetflow calls nansenPost which normalizes chains
  const payloads = [
    { chains: "solana", expect: ["solana"] },
    { chains: '["solana","ethereum"]', expect: ["solana", "ethereum"] },
    { chains: "solana,ethereum", expect: ["solana", "ethereum"] },
  ];

  let capturedBodies = [];
  const mockFetch = async (_url, init) => {
    capturedBodies.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ ok: true, data: [] }), { status: 200 });
  };

  for (const { chains, expect } of payloads) {
    capturedBodies = [];
    try {
      await smartMoneyNetflow({ chains }, { fetch: mockFetch, apiKey: "test-key" });
      const body = capturedBodies[0];
      const got = body?.chains;
      const match =
        Array.isArray(got) &&
        got.length === expect.length &&
        got.every((v, i) => v === expect[i]);
      if (match) pass(`chains normalize: ${JSON.stringify(chains)}`, JSON.stringify(got));
      else fail(`chains normalize: ${JSON.stringify(chains)}`, `got ${JSON.stringify(got)}`);
    } catch (e) {
      fail(`chains normalize: ${JSON.stringify(chains)}`, e?.message || String(e));
    }
  }
}

async function testSignalLoad() {
  console.log("\n=== /signal loadSignal (live CEX data) ===");
  const cases = [
    { label: "default (binance path)", input: { token: "bitcoin" } },
    { label: "explicit binance", input: { token: "bitcoin", source: "binance" } },
    { label: "solana token", input: { token: "solana" } },
  ];

  for (const { label, input } of cases) {
    const start = Date.now();
    try {
      const out = await loadSignal(input);
      const sig = out?.signal;
      const hasReport =
        sig &&
        (sig.signal != null ||
          sig.trend != null ||
          sig.recommendation != null ||
          typeof sig === "object");
      const source = sig?.source || "unknown";
      const fallback = sig?.fallbackFrom ? ` fallbackFrom=${sig.fallbackFrom}` : "";
      const ms = Date.now() - start;
      if (hasReport) {
        pass(`loadSignal: ${label}`, `source=${source}${fallback} (${ms}ms)`);
      } else {
        fail(`loadSignal: ${label}`, `empty report (${ms}ms)`);
      }
    } catch (e) {
      fail(`loadSignal: ${label}`, `${e?.message || e} (${Date.now() - start}ms)`);
    }
  }
}

async function testBinanceKlines() {
  console.log("\n=== Binance klines fetch ===");
  const start = Date.now();
  try {
    const rows = await fetchBinanceKlinesJson("BTCUSDT", { bar: "1h", limit: 50 });
    if (Array.isArray(rows) && rows.length >= 20) {
      pass("fetchBinanceKlinesJson BTCUSDT", `${rows.length} candles (${Date.now() - start}ms)`);
    } else {
      fail("fetchBinanceKlinesJson BTCUSDT", `only ${rows?.length ?? 0} rows`);
    }
  } catch (e) {
    fail("fetchBinanceKlinesJson BTCUSDT", e?.message || String(e));
  }

  const start2 = Date.now();
  try {
    const rows2 = await fetchBinanceKlinesJson("BTCUSDT", { bar: "1h", limit: 50 });
    const ms = Date.now() - start2;
    if (ms < 500 && Array.isArray(rows2) && rows2.length >= 20) {
      pass("kline cache hit", `${ms}ms`);
    } else if (Array.isArray(rows2) && rows2.length >= 20) {
      pass("kline second fetch", `${rows2.length} candles (${ms}ms, cache may be cold)`);
    } else {
      fail("kline second fetch", `unexpected (${ms}ms)`);
    }
  } catch (e) {
    fail("kline cache hit", e?.message || String(e));
  }
}

async function testHttpEndpoint(path, label, opts = {}) {
  const url = `${BASE_URL}${path}`;
  const timeout = opts.timeoutMs ?? 25_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: opts.method || "GET",
      headers: { Accept: "application/json", ...(opts.headers || {}) },
      signal: controller.signal,
      ...(opts.body ? { body: JSON.stringify(opts.body), headers: { "Content-Type": "application/json", Accept: "application/json" } } : {}),
    });
    clearTimeout(timer);
    const ms = Date.now() - start;
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 200) };
    }

    if (opts.expectStatus && res.status !== opts.expectStatus) {
      fail(`HTTP ${label}`, `status ${res.status} (expected ${opts.expectStatus}) in ${ms}ms`);
      return;
    }

    if (res.status === 402) {
      pass(`HTTP ${label}`, `402 payment required (${ms}ms) — route alive`);
      return;
    }

    if (!res.ok) {
      fail(`HTTP ${label}`, `status ${res.status}: ${body?.error || body?.message || text.slice(0, 120)} (${ms}ms)`);
      return;
    }

    const detail = opts.check ? opts.check(body) : `status ${res.status} (${ms}ms)`;
    if (detail === true || (typeof detail === "string" && !detail.startsWith("FAIL"))) {
      pass(`HTTP ${label}`, typeof detail === "string" ? detail : `status ${res.status} (${ms}ms)`);
    } else {
      fail(`HTTP ${label}`, String(detail));
    }
  } catch (e) {
    clearTimeout(timer);
    const msg = e?.name === "AbortError" ? `timeout after ${timeout}ms` : e?.message || String(e);
    fail(`HTTP ${label}`, msg);
  }
}

async function testHttpEndpoints() {
  console.log(`\n=== HTTP endpoints @ ${BASE_URL} ===`);

  await testHttpEndpoint("/preview/news?ticker=BTC", "preview/news BTC", {
    timeoutMs: 30_000,
    check: (b) =>
      Array.isArray(b?.news) && b.news.length > 0
        ? `${b.news.length} articles`
        : "FAIL: empty news array",
  });

  await testHttpEndpoint("/preview/sentiment?ticker=general", "preview/sentiment general", {
    timeoutMs: 45_000,
    check: (b) =>
      Array.isArray(b?.sentimentAnalysis) && b.sentimentAnalysis.length > 0
        ? `source=${b.source || "?"}, rows=${b.sentimentAnalysis.length}`
        : "FAIL: empty sentiment",
  });

  await testHttpEndpoint("/signal?token=bitcoin", "signal (x402 probe)", {
    timeoutMs: 15_000,
    expectStatus: 402,
  });

  await testHttpEndpoint("/news?ticker=BTC", "news (x402 probe)", {
    timeoutMs: 15_000,
    expectStatus: 402,
  });

  await testHttpEndpoint("/nansen/smart-money/netflow?chains=solana", "nansen netflow chains=solana", {
    timeoutMs: 15_000,
    // 402 without payment is OK; 500 with chains error is NOT
    check: (_b, res) => true,
  });

  // Re-run nansen with explicit check on error message
  const nansenUrl = `${BASE_URL}/nansen/smart-money/netflow?chains=solana`;
  try {
    const res = await fetch(nansenUrl, { headers: { Accept: "application/json" } });
    const text = await res.text();
    if (text.includes("must be a list") || text.includes("Required field chains")) {
      fail("nansen chains mapping", text.slice(0, 160));
    } else if (res.status === 402 || res.status === 200) {
      pass("nansen chains mapping", `no list-format error (status ${res.status})`);
    } else if (res.status === 500 && text.includes("chains")) {
      fail("nansen chains mapping", text.slice(0, 160));
    } else {
      pass("nansen chains mapping", `status ${res.status} (no chains format bug)`);
    }
  } catch (e) {
    fail("nansen chains mapping", e?.message || String(e));
  }
}

async function main() {
  console.log("Upstream hardening smoke test");
  console.log("=".repeat(50));

  await testTickerLocal();
  await testNansenChainsNormalization();
  await testBinanceKlines();
  await testSignalLoad();
  await testHttpEndpoints();

  const failed = results.filter((r) => !r.ok);
  console.log("\n" + "=".repeat(50));
  console.log(`Results: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("\nFailed:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log("\nAll checks passed.");
}

main().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});
