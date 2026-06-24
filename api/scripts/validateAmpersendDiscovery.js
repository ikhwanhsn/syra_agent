/**
 * Validate Syra readiness for Ampersend marketplace (x402 Bazaar on Base mainnet).
 *
 * Ampersend ingests Bazaar listings after at least one successful Base settlement.
 * @see https://docs.ampersend.ai/platform/marketplace
 *
 * Usage:
 *   node -r dotenv/config scripts/validateAmpersendDiscovery.js
 *   BASE_URL=https://api.syraa.fun node -r dotenv/config scripts/validateAmpersendDiscovery.js
 *
 * Optional paid E2E (indexes endpoint in Bazaar after settle):
 *   CMC_PAYER_PRIVATE_KEY=0x... node -r dotenv/config scripts/validateAmpersendDiscovery.js --pay
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AMPERSEND_MARKETPLACE_NETWORK, isX402BazaarEnabled } from "../config/x402Bazaar.js";
import { getPayaiPayToAddresses } from "../config/payaiX402Networks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BASE_URL = String(process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const PAY_E2E = process.argv.includes("--pay");

function fail(msg) {
  console.error(`[validate-ampersend] FAIL: ${msg}`);
  process.exitCode = 1;
}

function ok(msg, detail) {
  console.log(`[validate-ampersend] OK: ${msg}${detail ? ` ${detail}` : ""}`);
}

async function checkBazaarEnabled() {
  if (!isX402BazaarEnabled()) {
    fail("X402_BAZAAR_ENABLED=false — Bazaar discovery is disabled");
    return false;
  }
  ok("Bazaar discovery enabled (X402_BAZAAR_ENABLED)");
  return true;
}

async function checkBasePayTo() {
  const { evmPayTo } = getPayaiPayToAddresses();
  if (!evmPayTo) {
    fail(
      "BASE_PAYTO (or EVM_PAYTO) is not set — Ampersend production marketplace only lists Base mainnet endpoints"
    );
    return false;
  }
  ok("Base payTo configured", evmPayTo);
  return true;
}

async function checkCapabilities() {
  const res = await fetch(`${BASE_URL}/x402/capabilities`);
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) {
    console.log(
      `[validate-ampersend] WARN: GET /x402/capabilities returned ${res.status} (skipped — use GET /health 402 Base check instead)`
    );
    return true;
  }
  if (!res.ok) {
    fail(`GET /x402/capabilities returned ${res.status}`);
    return false;
  }
  const networks = body?.data?.networks ?? body?.networks ?? {};
  const baseEnabled =
    networks === true ||
    networks?.base === true ||
    (Array.isArray(networks) &&
      networks.some((n) => n?.caip2 === AMPERSEND_MARKETPLACE_NETWORK || n?.id === "base"));
  if (!baseEnabled) {
    fail(
      `Base (${AMPERSEND_MARKETPLACE_NETWORK}) not enabled in /x402/capabilities — set BASE_PAYTO and restart API`
    );
    return false;
  }
  ok("Base mainnet enabled in x402 capabilities");
  return true;
}

async function check402HealthOffersBase() {
  const url = `${BASE_URL}/health`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (res.status !== 402) {
    fail(`Expected 402 from ${url}, got ${res.status}`);
    return false;
  }
  const prHeader = res.headers.get("payment-required") || res.headers.get("Payment-Required");
  const body = await res.json().catch(() => ({}));
  const accepts = body?.accepts || [];
  const baseAccept = accepts.find((a) => String(a?.network || "") === AMPERSEND_MARKETPLACE_NETWORK);
  if (!baseAccept) {
    fail(
      `GET /health 402 has no Base accept. Networks: ${accepts.map((a) => a.network).join(", ") || "(none)"}`
    );
    return false;
  }
  ok("GET /health advertises Base mainnet", JSON.stringify({ payTo: baseAccept.payTo, amount: baseAccept.amount }));
  if (prHeader) ok("Payment-Required header present on 402");
  return true;
}

async function checkWellKnown() {
  const res = await fetch(`${BASE_URL}/.well-known/x402`);
  if (!res.ok) {
    fail(`GET /.well-known/x402 returned ${res.status}`);
    return false;
  }
  const body = await res.json().catch(() => ({}));
  const count = Array.isArray(body?.resources) ? body.resources.length : 0;
  ok(`/.well-known/x402 lists ${count} resources`);
  return true;
}

async function optionalBasePaidE2E() {
  const key = String(process.env.CMC_PAYER_PRIVATE_KEY || process.env.BASE_PAYER_PRIVATE_KEY || "").trim();
  if (!key) {
    console.log("[validate-ampersend] skip paid E2E (set CMC_PAYER_PRIVATE_KEY or pass without --pay)");
    return null;
  }
  if (!PAY_E2E) {
    console.log("[validate-ampersend] skip paid E2E (pass --pay to run a Base settlement for Bazaar indexing)");
    return null;
  }
  const { getBaseX402PaymentFetch } = await import("../libs/sentinelPayer.js");
  const paymentFetch = await getBaseX402PaymentFetch();
  const url = `${BASE_URL}/health`;
  const res = await paymentFetch(url, {
    method: "GET",
    headers: { Accept: "application/json", "User-Agent": "SyraValidateAmpersend/1.0" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    fail(`Paid GET /health on Base failed: ${res.status} ${data?.error || data?.message || res.statusText}`);
    return false;
  }
  ok("Paid Base E2E succeeded — endpoint should index in Bazaar after facilitator sync");
  return true;
}

async function main() {
  console.log(`[validate-ampersend] target=${BASE_URL}`);
  let allOk = true;
  allOk = (await checkBazaarEnabled()) && allOk;
  allOk = (await checkBasePayTo()) && allOk;
  allOk = (await checkCapabilities()) && allOk;
  allOk = (await check402HealthOffersBase()) && allOk;
  allOk = (await checkWellKnown()) && allOk;
  if (PAY_E2E) {
    const paid = await optionalBasePaidE2E();
    if (paid === false) allOk = false;
  }
  if (allOk) {
    console.log(
      "\n[validate-ampersend] Ready for Ampersend Bazaar ingestion. After first Base settlement, listings appear at https://app.ampersend.ai/discover (source=bazaar, subject to review). For curated placement email ampersend@edgeandnode.com."
    );
  } else {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  fail(e?.message || String(e));
  process.exit(1);
});
