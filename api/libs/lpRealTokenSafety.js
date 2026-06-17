/**
 * Meridian-style token safety hard gates for real Meteora LP deployment.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getLpRealBlockedLaunchpads,
  getLpRealMaxBotHoldersPct,
  getLpRealMaxMcapUsd,
  getLpRealMaxTop10Pct,
  getLpRealMinHolders,
  getLpRealMinMcapUsd,
  getLpRealUseRealSignals,
} from "../config/lpRealAgentAccess.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOCKLIST_PATH = join(__dirname, "../config/lpRealDeployerBlocklist.json");

/** @type {{ deployerAddresses: Set<string>, tokenMints: Set<string> } | null} */
let blocklistCache = null;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function loadBlocklist() {
  if (blocklistCache) return blocklistCache;
  try {
    const raw = JSON.parse(readFileSync(BLOCKLIST_PATH, "utf8"));
    blocklistCache = {
      deployerAddresses: new Set(
        (Array.isArray(raw.deployerAddresses) ? raw.deployerAddresses : [])
          .map((a) => String(a).trim())
          .filter(Boolean),
      ),
      tokenMints: new Set(
        (Array.isArray(raw.tokenMints) ? raw.tokenMints : [])
          .map((a) => String(a).trim())
          .filter(Boolean),
      ),
    };
  } catch {
    blocklistCache = { deployerAddresses: new Set(), tokenMints: new Set() };
  }
  return blocklistCache;
}

/**
 * @param {string | null | undefined} mint
 */
export function isBlockedTokenMint(mint) {
  if (!mint) return false;
  return loadBlocklist().tokenMints.has(String(mint).trim());
}

/**
 * @param {string | null | undefined} address
 */
export function isBlockedDeployer(address) {
  if (!address) return false;
  return loadBlocklist().deployerAddresses.has(String(address).trim());
}

/**
 * @param {Record<string, unknown>} signals
 * @param {{ requireRealSignals?: boolean }} [opts]
 */
export function passesRealTokenSafety(signals, opts = {}) {
  const requireReal = opts.requireRealSignals ?? getLpRealUseRealSignals();
  const reasons = [];

  if (requireReal && signals?.available === false) {
    return { pass: false, reasons: ["real_signals_unavailable"] };
  }

  const tokenMint = String(signals?.tokenMint || "").trim();
  if (tokenMint && isBlockedTokenMint(tokenMint)) {
    reasons.push("blocked_token_mint");
  }

  const deployer = String(signals?.deployerAddress || "").trim();
  if (deployer && isBlockedDeployer(deployer)) {
    reasons.push("blocked_deployer");
  }

  const top10 = signals?.topHoldersPct;
  if (top10 != null && toNum(top10) > getLpRealMaxTop10Pct()) {
    reasons.push(`top10_concentration:${toNum(top10).toFixed(1)}`);
  }

  const botPct = signals?.botHoldersPct;
  if (botPct != null && toNum(botPct) > getLpRealMaxBotHoldersPct()) {
    reasons.push(`bot_holders:${toNum(botPct).toFixed(1)}`);
  }

  const holders = toNum(signals?.holderCount);
  if (holders > 0 && holders < getLpRealMinHolders()) {
    reasons.push(`min_holders:${holders}`);
  }

  const mcap = toNum(signals?.mcapUsd);
  const minMcap = getLpRealMinMcapUsd();
  const maxMcap = getLpRealMaxMcapUsd();
  if (mcap > 0) {
    if (mcap < minMcap) reasons.push(`mcap_below_min:${Math.floor(mcap)}`);
    if (mcap > maxMcap) reasons.push(`mcap_above_max:${Math.floor(mcap)}`);
  }

  if (signals?.mintAuthorityRenounced === false) {
    reasons.push("mint_authority_active");
  }
  if (signals?.freezeAuthorityRenounced === false) {
    reasons.push("freeze_authority_active");
  }

  const launchpad = String(signals?.launchpad || "").trim().toLowerCase();
  const blockedLaunchpads = getLpRealBlockedLaunchpads();
  if (launchpad && blockedLaunchpads.some((b) => launchpad.includes(String(b).toLowerCase()))) {
    reasons.push(`blocked_launchpad:${launchpad}`);
  }

  return { pass: reasons.length === 0, reasons };
}

export function __resetBlocklistCacheForTest() {
  blocklistCache = null;
}
