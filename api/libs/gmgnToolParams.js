/**
 * Normalize LLM/frontend params for GMGN OpenAPI (chain ids, aliases, safe defaults).
 * Used by runGmgnAgentTool and by agent routes before getAgentToolParamGateMessage.
 */

/** @param {unknown} v */
function hasTrimmedString(v) {
  return v != null && String(v).trim() !== "";
}

/**
 * @param {Record<string, unknown>} p
 * @param {string[]} keys
 * @returns {string | undefined}
 */
function firstString(p, keys) {
  for (const k of keys) {
    const v = p[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return undefined;
}

/**
 * @param {string} s
 */
function looksLikeSolanaMint(s) {
  const t = String(s).trim();
  if (t.startsWith("0x")) return false;
  if (t.length < 32 || t.length > 48) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(t);
}

const TOKEN_TOOL_IDS = new Set([
  "gmgn-token-info",
  "gmgn-token-security",
  "gmgn-token-pool",
  "gmgn-token-holders",
  "gmgn-token-traders",
  "gmgn-market-kline",
]);

const CHAIN_WALLET_TOOL_IDS = new Set([
  "gmgn-portfolio-holdings",
  "gmgn-portfolio-activity",
  "gmgn-portfolio-stats",
  "gmgn-portfolio-created-tokens",
]);

const TOKEN_BALANCE_WALLET_KEYS = ["wallet", "wallet_address", "walletAddress", "user"];
const TOKEN_BALANCE_MINT_KEYS = [
  "token",
  "mint",
  "token_address",
  "tokenAddress",
  "token_mint",
  "tokenMint",
  "ca",
  "asset",
];

const ADDRESS_ALIASES = [
  "address",
  "token",
  "token_address",
  "tokenAddress",
  "mint",
  "contract",
  "contractAddress",
  "ca",
  "tokenMint",
  "token_mint",
  "token_contract",
  "tokenContract",
];

const WALLET_ALIASES = [
  "wallet",
  "wallet_address",
  "walletAddress",
  "user",
  "owner",
  "account",
  "address",
  "user_address",
  "userAddress",
];

/**
 * GMGN OpenAPI uses short chain ids: sol, bsc, eth, base.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeGmgnChain(raw) {
  const c = String(raw).trim().toLowerCase();
  const aliases = {
    solana: "sol",
    sol: "sol",
    binance: "bsc",
    binance_smart_chain: "bsc",
    bsc_chain: "bsc",
    bnb: "bsc",
    ethereum: "eth",
    mainnet: "eth",
    eth: "eth",
    base: "base",
  };
  return aliases[c] ?? c;
}

/**
 * @param {string} s
 * @param {string[]} [allowed] — lowercase allowed values; if not in list, return as normalized lower case
 * @returns {string}
 */
function normalizeEnumLower(s, allowed) {
  const t = String(s).trim().toLowerCase();
  if (allowed && allowed.length) {
    const m = allowed.find((a) => a === t);
    return m ?? t;
  }
  return t;
}

const TRENDING_INTERVALS = new Set(["1m", "5m", "1h", "6h", "24h"]);
const KLINE_RES = new Set(["1m", "5m", "15m", "1h", "4h", "1d"]);

/**
 * @param {string} toolId
 * @param {Record<string, unknown> | null | undefined} input
 * @returns {Record<string, string>}
 */
export function enrichGmgnToolParams(toolId, input) {
  if (!toolId || !String(toolId).startsWith("gmgn-")) {
    return input && typeof input === "object" ? /** @type {Record<string, string>} */ ({ ...input }) : {};
  }

  /** @type {Record<string, string>} */
  const p = {};
  if (input && typeof input === "object") {
    for (const [k, v] of Object.entries(input)) {
      if (v != null) p[k] = typeof v === "string" ? v : String(v);
    }
  }

  if (p.chain && String(p.chain).trim() !== "") {
    p.chain = normalizeGmgnChain(String(p.chain).trim());
  }

  if (TOKEN_TOOL_IDS.has(toolId)) {
    const a = firstString(/** @type {Record<string, unknown>} */ (p), ADDRESS_ALIASES);
    if (a) p.address = a;
  }

  if (CHAIN_WALLET_TOOL_IDS.has(toolId)) {
    if (!hasTrimmedString(p.wallet)) {
      const w = firstString(/** @type {Record<string, unknown>} */ (p), [
        ...WALLET_ALIASES,
      ]);
      if (w) p.wallet = w;
    }
  }

  if (toolId === "gmgn-portfolio-token-balance") {
    if (!hasTrimmedString(p.wallet)) {
      const w = firstString(/** @type {Record<string, unknown>} */ (p), TOKEN_BALANCE_WALLET_KEYS);
      if (w) p.wallet = w;
    }
    if (!hasTrimmedString(p.token)) {
      const tok = firstString(/** @type {Record<string, unknown>} */ (p), TOKEN_BALANCE_MINT_KEYS);
      if (tok) p.token = tok;
    }
  }

  const addrForHeuristic = p.address || p.mint;
  if (!hasTrimmedString(p.chain) && looksLikeSolanaMint(String(addrForHeuristic || ""))) {
    p.chain = "sol";
  }

  if (!hasTrimmedString(p.chain) && CHAIN_WALLET_TOOL_IDS.has(toolId) && p.wallet) {
    if (looksLikeSolanaMint(String(p.wallet))) p.chain = "sol";
  }
  if (!hasTrimmedString(p.chain) && toolId === "gmgn-portfolio-token-balance" && p.wallet && p.token) {
    if (looksLikeSolanaMint(String(p.wallet)) && looksLikeSolanaMint(String(p.token))) p.chain = "sol";
  }

  if (!hasTrimmedString(p.chain) && (toolId === "gmgn-market-trenches" || toolId === "gmgn-market-trending")) {
    p.chain = "sol";
  }

  if (toolId === "gmgn-market-trending") {
    if (!hasTrimmedString(p.interval)) {
      p.interval = "1h";
    } else {
      p.interval = normalizeEnumLower(p.interval, [...TRENDING_INTERVALS]);
    }
  }

  if (toolId === "gmgn-market-kline") {
    if (!hasTrimmedString(p.resolution)) {
      p.resolution = "1h";
    } else {
      p.resolution = normalizeEnumLower(p.resolution, [...KLINE_RES]);
    }
  }

  if (toolId === "gmgn-market-signal" && !hasTrimmedString(p.chain)) {
    p.chain = "sol";
  }

  if ((toolId === "gmgn-track-kol" || toolId === "gmgn-track-smartmoney") && hasTrimmedString(p.chain)) {
    p.chain = normalizeGmgnChain(p.chain);
  }
  if (toolId === "gmgn-track-follow-wallet" && hasTrimmedString(p.chain)) {
    p.chain = normalizeGmgnChain(p.chain);
  }

  return p;
}
