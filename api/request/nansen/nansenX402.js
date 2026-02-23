/**
 * Nansen API client — one function per x402-supported endpoint.
 * Use these from your routes; no routes are defined here.
 *
 * x402: https://docs.nansen.ai/getting-started/x402-payments
 * - Without API key: server returns 402; use an x402-capable fetch (e.g. payer.fetch) to pay and retry.
 * - With API key: Nansen uses the key and no payment is required.
 *
 * Options for each call: { fetch, baseUrl, apiKey }
 * - fetch: optional (default global fetch); use payer.fetch for x402 payment flow.
 * - baseUrl: optional (default process.env.NANSEN_API_BASE_URL || 'https://api.nansen.ai').
 * - apiKey: optional; if set, sent as header and no x402 payment is required.
 */

const DEFAULT_BASE_URL = "https://api.nansen.ai";

/**
 * @param {string} path - e.g. '/api/v1/profiler/address/current-balance'
 * @param {object} payload - JSON body
 * @param {{ fetch?: typeof fetch; baseUrl?: string; apiKey?: string }} [options]
 * @returns {Promise<object>} Parsed JSON response
 */
async function nansenPost(path, payload, options = {}) {
  const baseUrl = options.baseUrl ?? process.env.NANSEN_API_BASE_URL ?? DEFAULT_BASE_URL;
  const fetchFn = options.fetch ?? globalThis.fetch;
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.apiKey ? { apiKey: options.apiKey } : {}),
  };
  const response = await fetchFn(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload ?? {}),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Nansen ${path}: ${response.status} ${response.statusText} ${text}`);
  }
  return response.json();
}

// -----------------------------------------------------------------------------
// Basic — $0.01/call (https://docs.nansen.ai/getting-started/x402-payments)
// -----------------------------------------------------------------------------

/** Current token holdings for addresses or entities. POST /api/v1/profiler/address/current-balance */
export async function profilerAddressCurrentBalance(payload, options) {
  return nansenPost("/api/v1/profiler/address/current-balance", payload, options);
}

/** Historical balances for addresses. POST /api/v1/profiler/address/historical-balances */
export async function profilerAddressHistoricalBalances(payload, options) {
  return nansenPost("/api/v1/profiler/address/historical-balances", payload, options);
}

/** Perpetual positions. POST /api/v1/profiler/perp-positions */
export async function profilerPerpPositions(payload, options) {
  return nansenPost("/api/v1/profiler/perp-positions", payload, options);
}

/** Address transactions. POST /api/v1/profiler/address/transactions */
export async function profilerAddressTransactions(payload, options) {
  return nansenPost("/api/v1/profiler/address/transactions", payload, options);
}

/** Perp trades. POST /api/v1/profiler/perp-trades */
export async function profilerPerpTrades(payload, options) {
  return nansenPost("/api/v1/profiler/perp-trades", payload, options);
}

/** Related wallets. POST /api/v1/profiler/address/related-wallets */
export async function profilerAddressRelatedWallets(payload, options) {
  return nansenPost("/api/v1/profiler/address/related-wallets", payload, options);
}

/** PnL summary for address. POST /api/v1/profiler/address/pnl-summary */
export async function profilerAddressPnlSummary(payload, options) {
  return nansenPost("/api/v1/profiler/address/pnl-summary", payload, options);
}

/** PnL for address. POST /api/v1/profiler/address/pnl */
export async function profilerAddressPnl(payload, options) {
  return nansenPost("/api/v1/profiler/address/pnl", payload, options);
}

/** Token screener. POST /api/v1/token-screener */
export async function tokenScreener(payload, options) {
  return nansenPost("/api/v1/token-screener", payload, options);
}

/** Perp screener. POST /api/v1/perp-screener */
export async function perpScreener(payload, options) {
  return nansenPost("/api/v1/perp-screener", payload, options);
}

/** TGM transfers. POST /api/v1/tgm/transfers */
export async function tgmTransfers(payload, options) {
  return nansenPost("/api/v1/tgm/transfers", payload, options);
}

/** TGM Jupiter DCA. POST /api/v1/tgm/jup-dca */
export async function tgmJupDca(payload, options) {
  return nansenPost("/api/v1/tgm/jup-dca", payload, options);
}

/** TGM flow intelligence. POST /api/v1/tgm/flow-intelligence */
export async function tgmFlowIntelligence(payload, options) {
  return nansenPost("/api/v1/tgm/flow-intelligence", payload, options);
}

/** TGM who bought/sold. POST /api/v1/tgm/who-bought-sold */
export async function tgmWhoBoughtSold(payload, options) {
  return nansenPost("/api/v1/tgm/who-bought-sold", payload, options);
}

/** TGM DEX trades. POST /api/v1/tgm/dex-trades */
export async function tgmDexTrades(payload, options) {
  return nansenPost("/api/v1/tgm/dex-trades", payload, options);
}

/** TGM flows. POST /api/v1/tgm/flows */
export async function tgmFlows(payload, options) {
  return nansenPost("/api/v1/tgm/flows", payload, options);
}

// -----------------------------------------------------------------------------
// Premium — $0.05/call
// -----------------------------------------------------------------------------

/** Address counterparties. POST /api/v1/profiler/address/counterparties */
export async function profilerAddressCounterparties(payload, options) {
  return nansenPost("/api/v1/profiler/address/counterparties", payload, options);
}

/** TGM holders. POST /api/v1/tgm/holders */
export async function tgmHolders(payload, options) {
  return nansenPost("/api/v1/tgm/holders", payload, options);
}

/** TGM PnL leaderboard. POST /api/v1/tgm/pnl-leaderboard */
export async function tgmPnlLeaderboard(payload, options) {
  return nansenPost("/api/v1/tgm/pnl-leaderboard", payload, options);
}

/** TGM perp PnL leaderboard. POST /api/v1/tgm/perp-pnl-leaderboard */
export async function tgmPerpPnlLeaderboard(payload, options) {
  return nansenPost("/api/v1/tgm/perp-pnl-leaderboard", payload, options);
}

/** Perp leaderboard. POST /api/v1/perp-leaderboard */
export async function perpLeaderboard(payload, options) {
  return nansenPost("/api/v1/perp-leaderboard", payload, options);
}

// -----------------------------------------------------------------------------
// Smart Money — $0.05/call
// -----------------------------------------------------------------------------

/** Smart money net flow. POST /api/v1/smart-money/netflow */
export async function smartMoneyNetflow(payload, options) {
  return nansenPost("/api/v1/smart-money/netflow", payload, options);
}

/** Smart money holdings. POST /api/v1/smart-money/holdings */
export async function smartMoneyHoldings(payload, options) {
  return nansenPost("/api/v1/smart-money/holdings", payload, options);
}

/** Smart money DEX trades. POST /api/v1/smart-money/dex-trades */
export async function smartMoneyDexTrades(payload, options) {
  return nansenPost("/api/v1/smart-money/dex-trades", payload, options);
}

/** Smart money historical holdings. POST /api/v1/smart-money/historical-holdings */
export async function smartMoneyHistoricalHoldings(payload, options) {
  return nansenPost("/api/v1/smart-money/historical-holdings", payload, options);
}

/** Smart money DCAs. POST /api/v1/smart-money/dcas */
export async function smartMoneyDcas(payload, options) {
  return nansenPost("/api/v1/smart-money/dcas", payload, options);
}

// -----------------------------------------------------------------------------
// TGM perp (used by token-god-mode-perp) — same pricing as other profiler/tgm
// -----------------------------------------------------------------------------

/** TGM perp positions. POST /api/v1/tgm/perp-positions */
export async function tgmPerpPositions(payload, options) {
  return nansenPost("/api/v1/tgm/perp-positions", payload, options);
}

/** TGM perp trades. POST /api/v1/tgm/perp-trades */
export async function tgmPerpTrades(payload, options) {
  return nansenPost("/api/v1/tgm/perp-trades", payload, options);
}
