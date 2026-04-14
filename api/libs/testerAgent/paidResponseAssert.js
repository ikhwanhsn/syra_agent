/**
 * Validates JSON bodies after a successful paid x402 call so cron can assert
 * "/news returns news", "/event returns event", etc.
 *
 * @param {string} path - probe path (e.g. /news)
 * @param {string} method - HTTP method
 * @param {unknown} data - parsed JSON body
 * @returns {{ ok: boolean; detail?: string; summary?: string }}
 */
export function assertPaidJsonShape(path, method, data) {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, detail: "Response is not a JSON object" };
  }
  const d = /** @type {Record<string, unknown>} */ (data);

  if (d.success === false && typeof d.error === "string") {
    return { ok: false, detail: `success:false — ${d.error.slice(0, 200)}` };
  }
  if (typeof d.error === "string" && d.error && !d.news && !d.signal && !d.event) {
    return { ok: false, detail: `error field: ${d.error.slice(0, 200)}` };
  }

  /** @param {string} key @param {number} [min] */
  const arr = (key, min = 1) => {
    const v = d[key];
    if (!Array.isArray(v) || v.length < min) {
      return { ok: false, detail: `expected non-empty array "${key}" (min ${min})` };
    }
    return { ok: true, summary: `${key}[${v.length}]` };
  };

  /** @param {string} key */
  const keyPresent = (key) => {
    if (!(key in d) || d[key] == null) {
      return { ok: false, detail: `missing or null "${key}"` };
    }
    return { ok: true, summary: key };
  };

  /** @param {string[]} keys at least one must be non-null */
  const anyKey = (keys) => {
    const hit = keys.find((k) => d[k] != null);
    if (!hit) return { ok: false, detail: `expected one of: ${keys.join(", ")}` };
    return { ok: true, summary: hit };
  };

  // --- Cryptonews bundle ---
  if (path === "/news") return arr("news", 1);
  if (path === "/sentiment") return arr("sentimentAnalysis", 1);
  if (path === "/event") return arr("event", 1);
  if (path === "/trending-headline") return arr("trendingHeadline", 1);
  if (path === "/sundown-digest") return arr("sundownDigest", 1);

  if (path === "/signal") {
    const s = d.signal;
    if (s == null || typeof s !== "object") return { ok: false, detail: "expected object signal" };
    return { ok: true, summary: "signal" };
  }

  if (path === "/brain") {
    if (d.success !== true) return { ok: false, detail: "expected success:true" };
    if (typeof d.response !== "string") return { ok: false, detail: "expected string response" };
    return { ok: true, summary: `response len ${d.response.length}` };
  }

  if (path === "/check-status" || path === "/mpp/v1/check-status") {
    if (d.status !== "ok") return { ok: false, detail: `expected status ok, got ${String(d.status)}` };
    if (typeof d.message !== "string" || !d.message) return { ok: false, detail: "expected message string" };
    return { ok: true, summary: "status ok" };
  }

  if (path === "/exa-search") {
    const r = arr("results", 0);
    if (!r.ok) return r;
    return { ok: true, summary: `results[${Array.isArray(d.results) ? d.results.length : 0}]` };
  }

  if (path === "/crawl") {
    const r = anyKey(["records", "jobId", "status"]);
    if (!r.ok) return r;
    return { ok: true, summary: r.summary || "crawl" };
  }

  if (path === "/browser-use") {
    if (d.success !== true) return { ok: false, detail: "expected success:true" };
    if (typeof d.output !== "string") return { ok: false, detail: "expected string output" };
    return { ok: true, summary: "browser-use output" };
  }

  if (path === "/analytics/summary") {
    if (d.api !== "v2" && !d.sections) return { ok: false, detail: "expected api v2 or sections" };
    return { ok: true, summary: "summary" };
  }

  if (path === "/smart-money") {
    const keys = Object.keys(d).filter((k) => !k.startsWith("_"));
    if (keys.length < 1) return { ok: false, detail: "expected smart-money payload keys" };
    return { ok: true, summary: keys.slice(0, 4).join(",") };
  }

  if (path === "/token-god-mode") {
    const keys = Object.keys(d);
    if (keys.length < 2) return { ok: false, detail: "expected multiple token-god-mode sections" };
    return { ok: true, summary: `${keys.length} keys` };
  }

  if (path === "/trending-jupiter") {
    const r = anyKey(["contractAddresses", "data", "tokenSummary"]);
    if (!r.ok) return r;
    return { ok: true, summary: "trending-jupiter" };
  }

  if (path === "/jupiter/swap/order") {
    const r = anyKey(["transaction", "swapTransaction", "requestId", "quoteResponse"]);
    if (!r.ok) return { ok: false, detail: "expected swap order fields" };
    return { ok: true, summary: "swap order" };
  }

  if (path === "/pumpfun/agents/swap") {
    const r = anyKey(["transaction", "pumpMintInfo"]);
    if (!r.ok) return { ok: false, detail: "expected pumpfun swap fields" };
    return { ok: true, summary: "pumpfun swap" };
  }

  if (path === "/pumpfun/agents/create-coin") {
    const r = anyKey(["transaction", "mintPublicKey"]);
    if (!r.ok) return { ok: false, detail: "expected pumpfun create-coin fields" };
    return { ok: true, summary: "pumpfun create" };
  }

  if (path === "/pumpfun/agents/collect-fees") {
    const r = anyKey(["transaction", "creator", "isGraduated", "usesSharingConfig"]);
    if (!r.ok) return { ok: false, detail: "expected pumpfun collect-fees fields" };
    return { ok: true, summary: "pumpfun collect-fees" };
  }

  if (path === "/pumpfun/agents/sharing-config") {
    const r = anyKey(["transaction", "mode", "sharingConfigAddress", "shareholderCount"]);
    if (!r.ok) return { ok: false, detail: "expected pumpfun sharing-config fields" };
    return { ok: true, summary: "pumpfun sharing" };
  }

  if (path === "/pumpfun/agent-payments/build-accept") {
    const r = keyPresent("transaction");
    if (!r.ok) return r;
    return { ok: true, summary: "agent payment tx" };
  }

  if (path === "/pumpfun/agent-payments/verify") {
    const r = keyPresent("verified");
    if (!r.ok) return r;
    return { ok: true, summary: "agent verify" };
  }

  if (path.startsWith("/pumpfun/coin/") || path === "/pumpfun/coin") {
    const r = keyPresent("mint");
    if (!r.ok) return r;
    return { ok: true, summary: "pumpfun coin" };
  }

  if (path === "/pumpfun/sol-price") {
    const r = anyKey(["solPrice"]);
    if (!r.ok) return { ok: false, detail: "expected solPrice" };
    return { ok: true, summary: "pumpfun sol" };
  }

  if (path === "/squid/route") {
    const r = anyKey(["route", "transactionRequest", "requestId"]);
    if (!r.ok) return { ok: false, detail: "expected squid route payload" };
    return { ok: true, summary: "squid route" };
  }

  if (path === "/squid/status") {
    if (typeof d !== "object") return { ok: false, detail: "squid status object" };
    return { ok: true, summary: "squid status" };
  }

  if (path === "/bubblemaps/maps") {
    const r = keyPresent("data");
    if (!r.ok) return r;
    return { ok: true, summary: "bubblemaps data" };
  }

  if (path === "/solana-agent") {
    const r = anyKey(["tickerNews", "sentimentAnalysis", "event", "tokenGodModePerp"]);
    if (!r.ok) return { ok: false, detail: "expected solana-agent sections" };
    return { ok: true, summary: "solana-agent" };
  }

  if (path.startsWith("/binance/spot")) {
    const r = Array.isArray(d) ? { ok: true, summary: "array" } : anyKey(["lastUpdateId", "bids", "symbols", "balances"]);
    if (!r.ok && !Array.isArray(d)) return { ok: false, detail: "binance spot: expected array or object payload" };
    return { ok: true, summary: Array.isArray(d) ? `array[${d.length}]` : "object" };
  }

  if (path === "/binance" || path.startsWith("/binance/")) {
    const r = anyKey(["data", "tokens", "interval", "count", "matrix"]);
    if (!r.ok) return { ok: false, detail: "binance correlation payload" };
    return { ok: true, summary: "binance" };
  }

  if (path.startsWith("/bankr")) {
    const r = anyKey(["balances", "jobId", "status", "success", "message"]);
    if (!r.ok) return { ok: false, detail: "bankr payload" };
    return { ok: true, summary: "bankr" };
  }

  if (path.startsWith("/giza")) {
    if (d.success !== true) return { ok: false, detail: "expected success:true" };
    const r = anyKey(["protocols", "wallet", "apy", "performance", "message"]);
    if (!r.ok) return { ok: false, detail: "giza payload" };
    return { ok: true, summary: "giza" };
  }

  if (path.startsWith("/neynar")) {
    const r = anyKey(["users", "casts", "result", "messages", "success"]);
    if (!r.ok) return { ok: false, detail: "neynar payload" };
    return { ok: true, summary: "neynar" };
  }

  if (path.startsWith("/siwa")) {
    const r = anyKey(["nonce", "valid", "issuedAt"]);
    if (!r.ok) return { ok: false, detail: "siwa payload" };
    return { ok: true, summary: "siwa" };
  }

  if (path.startsWith("/8004scan")) {
    const r = anyKey(["data", "agents", "chains", "stats", "items", "success"]);
    if (!r.ok) {
      if (typeof d === "object" && Object.keys(d).length > 0) return { ok: true, summary: "8004scan object" };
      return { ok: false, detail: "8004scan empty" };
    }
    return { ok: true, summary: "8004scan" };
  }

  if (path.startsWith("/heylol")) {
    const r = anyKey(["id", "username", "posts", "data", "success", "nonce"]);
    if (!r.ok && Object.keys(d).length > 0) return { ok: true, summary: "heylol lenient" };
    if (!r.ok) return { ok: false, detail: "heylol unexpected body" };
    return { ok: true, summary: "heylol" };
  }

  if (path.startsWith("/quicknode")) {
    const r = anyKey(["result", "balance", "status", "jsonrpc", "chain"]);
    if (!r.ok) return { ok: false, detail: "quicknode payload" };
    return { ok: true, summary: "quicknode" };
  }

  if (path.startsWith("/x")) {
    const r = anyKey(["data", "meta", "errors"]);
    if (d.errors && Array.isArray(d.errors) && d.errors.length) {
      return { ok: false, detail: `X API errors: ${JSON.stringify(d.errors).slice(0, 200)}` };
    }
    if (!r.ok) return { ok: false, detail: "x api payload" };
    return { ok: true, summary: "x" };
  }

  if (path.startsWith("/nansen")) {
    if (Object.keys(d).length < 1) return { ok: false, detail: "nansen empty object" };
    return { ok: true, summary: `nansen keys:${Object.keys(d).length}` };
  }

  const keys = Object.keys(d);
  if (keys.length === 0) return { ok: false, detail: "empty JSON object" };
  return { ok: true, summary: `lenient(${keys.slice(0, 5).join(",")})` };
}
