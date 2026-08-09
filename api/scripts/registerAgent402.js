/**
 * Register / verify Syra on Agent402.tools seller index.
 *
 * Usage:
 *   node -r dotenv/config scripts/registerAgent402.js
 *   node -r dotenv/config scripts/registerAgent402.js --check
 *   node -r dotenv/config scripts/registerAgent402.js --origin=https://api.syraa.fun
 *
 * @see https://agent402.tools/sell
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PRODUCTION_ORIGIN = "https://api.syraa.fun";
const REGISTER_URL = "https://agent402.tools/api/index/register";
const INDEX_URL = "https://agent402.tools/api/index";

const CHECK_ONLY = process.argv.includes("--check");

function resolveOrigin() {
  const flagArg = process.argv.find((a) => a.startsWith("--origin="));
  if (flagArg) return flagArg.slice("--origin=".length).replace(/\/+$/, "");
  const envOrigin = String(process.env.AGENT402_ORIGIN || process.env.SYRA_PUBLIC_API_URL || "").trim();
  if (envOrigin) return envOrigin.replace(/\/+$/, "");
  return PRODUCTION_ORIGIN;
}

function log(msg) {
  console.log(`[agent402] ${msg}`);
}

function fail(msg) {
  console.error(`[agent402] FAIL: ${msg}`);
  process.exitCode = 1;
}

/**
 * @param {string} origin
 * @returns {boolean}
 */
function originMatches(candidate, origin) {
  const want = origin.replace(/\/+$/, "").toLowerCase();
  const got = String(candidate || "").replace(/\/+$/, "").toLowerCase();
  return got === want;
}

/**
 * @param {string} origin
 * @returns {Promise<object | null>}
 */
async function findSellerInIndex(origin) {
  const host = new URL(origin).hostname.replace(/^www\./, "");
  // Prefer search — default index sort buries newly registered sellers.
  for (const url of [
    `${INDEX_URL}?q=${encodeURIComponent(host)}&perPage=100`,
    `${INDEX_URL}?origin=${encodeURIComponent(origin)}&perPage=100`,
  ]) {
    const res = await fetch(url);
    if (!res.ok) continue;
    const json = await res.json();
    const sellers = Array.isArray(json?.sellers) ? json.sellers : [];
    const hit = sellers.find((s) => originMatches(s?.origin, origin));
    if (hit) return hit;
  }

  let page = 1;
  const maxPages = 40;
  while (page <= maxPages) {
    const url = `${INDEX_URL}?page=${page}&perPage=100`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`GET ${url} → HTTP ${res.status}`);
    }
    const json = await res.json();
    const sellers = Array.isArray(json?.sellers) ? json.sellers : [];
    const hit = sellers.find((s) => originMatches(s?.origin, origin));
    if (hit) return hit;

    const pages = Number(json?.pages) || 1;
    if (page >= pages || sellers.length === 0) break;
    page += 1;
  }
  return null;
}

async function register(origin) {
  log(`POST ${REGISTER_URL} origin=${origin}`);
  const res = await fetch(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ origin }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`register non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
  // Idempotent: if we already submitted this hour, fall through to --check against the index.
  if (res.status === 429) {
    log(`WARN: register rate-limited (${json?.error || "429"}); verifying existing listing`);
    return null;
  }
  if (!res.ok) {
    throw new Error(`register HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  if (!json.listed) {
    throw new Error(`register response listed≠true: ${JSON.stringify(json)}`);
  }
  const seller = json.seller || {};
  log(
    `listed displayName=${seller.displayName ?? "?"} toolCount=${seller.toolCount ?? "?"} health=${seller.health ?? "?"} routable=${seller.routable ?? "?"} networks=${JSON.stringify(seller.networks ?? [])}`,
  );
  return json;
}

async function check(origin) {
  log(`Checking index for ${origin}`);
  /** @type {object | null} */
  let seller = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    seller = await findSellerInIndex(origin);
    if (seller) break;
    if (attempt < 4) {
      log(`index miss (attempt ${attempt}/4), retrying…`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  if (!seller) {
    fail(`origin not found in Agent402 index: ${origin}`);
    return null;
  }
  log(
    `found displayName=${seller.displayName ?? "?"} toolCount=${seller.toolCount ?? "?"} health=${seller.health ?? "?"} routable=${seller.routable ?? "?"} discoveryPath=${seller.discoveryPath ?? "?"}`,
  );
  if (Number(seller.health) !== 1) {
    fail(`seller health is ${seller.health}, expected 1`);
  }
  if (seller.routable !== true) {
    fail(`seller routable is ${seller.routable}, expected true`);
  }
  return seller;
}

async function main() {
  const origin = resolveOrigin();
  log(`Syra Agent402 tooling — ${origin}`);

  if (!CHECK_ONLY) {
    await register(origin);
  }

  const seller = await check(origin);
  if (!seller) return;

  const name = String(seller.displayName || "");
  if (name !== "Syra" && name !== "api.syraa.fun") {
    log(`WARN: unexpected displayName "${name}" (want Syra after discovery branding deploy)`);
  } else if (name === "api.syraa.fun") {
    log(
      "WARN: displayName still hostname — deploy branded /.well-known/x402 (name: Syra) then re-run register",
    );
  } else {
    log("displayName OK: Syra");
  }

  log("Done.");
}

main().catch((e) => {
  fail(e instanceof Error ? e.message : String(e));
});
