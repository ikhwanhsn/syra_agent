/**
 * Validate Dexter facilitator wiring for x402 Labs `/insights/*` routes.
 *
 * Checks:
 * 1. Dexter facilitator GET /supported is reachable
 * 2. Local Dexter resource server initializes
 * 3. Unpaid GET /insights/network-health returns 402 (Dexter-backed)
 * 4. Unpaid GET /news (or /health) still returns 402 via PayAI (control)
 * 5. Optional paid E2E when PAYER_KEYPAIR is set
 *
 * Usage:
 *   node -r dotenv/config scripts/validateDexterLabsX402.js
 *   BASE_URL=https://api.syraa.fun node -r dotenv/config scripts/validateDexterLabsX402.js
 */
import {
  ensureX402DexterResourceServerInitialized,
  getX402ResourceServerDexter,
  ensureX402ResourceServerInitialized,
  getX402ResourceServer,
} from "../utils/x402ResourceServer.js";
import { getEnabledDexterNetworks } from "../config/dexterX402Networks.js";

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const DEXTER_URL = (process.env.DEXTER_FACILITATOR_URL || "https://x402.dexter.cash").replace(
  /\/$/,
  "",
);

function ok(msg) {
  console.log(`[validate-dexter-labs] OK: ${msg}`);
}

function fail(msg) {
  console.error(`[validate-dexter-labs] FAIL: ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`[validate-dexter-labs] WARN: ${msg}`);
}

async function fetchWithTimeout(url, init = {}, ms = 30_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function decodePaymentRequired(res) {
  const header =
    res.headers.get("payment-required") ||
    res.headers.get("Payment-Required") ||
    "";
  if (!header) return null;
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

async function main() {
  console.log(`[validate-dexter-labs] BASE_URL=${BASE_URL}`);
  console.log(`[validate-dexter-labs] DEXTER_URL=${DEXTER_URL}`);

  // 1) Dexter facilitator live
  const supportedRes = await fetchWithTimeout(`${DEXTER_URL}/supported`);
  if (!supportedRes.ok) {
    fail(`Dexter GET /supported returned ${supportedRes.status}`);
  }
  const supported = await supportedRes.json();
  const kinds = Array.isArray(supported?.kinds) ? supported.kinds : [];
  const hasSolana = kinds.some(
    (k) =>
      k?.scheme === "exact" &&
      String(k?.network || "").startsWith("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"),
  );
  if (!hasSolana) {
    fail("Dexter /supported missing Solana mainnet exact scheme");
  }
  ok(`Dexter facilitator reachable (${kinds.length} kinds)`);

  // 2) Local Dexter resource server init
  const networks = getEnabledDexterNetworks();
  console.log(
    `[validate-dexter-labs] enabled Dexter networks: ${networks.map((n) => n.id).join(",")}`,
  );
  await ensureX402DexterResourceServerInitialized();
  const dexterBundle = getX402ResourceServerDexter();
  if (!dexterBundle?.resourceServer) {
    fail("getX402ResourceServerDexter() returned empty bundle");
  }
  if (dexterBundle.config?.networkProfile !== "dexter") {
    fail(`expected networkProfile=dexter, got ${dexterBundle.config?.networkProfile}`);
  }
  ok("Dexter resource server initialized");

  // PayAI default still initializes (control)
  await ensureX402ResourceServerInitialized();
  const payaiBundle = getX402ResourceServer();
  if (payaiBundle.config?.networkProfile !== "payai") {
    fail(`expected default networkProfile=payai, got ${payaiBundle.config?.networkProfile}`);
  }
  ok("PayAI resource server still default");

  // 3) Probe insights 402
  const insightsRes = await fetchWithTimeout(`${BASE_URL}/insights/network-health`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (insightsRes.status !== 402) {
    fail(`/insights/network-health expected 402 unpaid, got ${insightsRes.status}`);
  }
  const insightsPr = decodePaymentRequired(insightsRes);
  if (!insightsPr) {
    fail("/insights/network-health 402 missing Payment-Required header");
  }
  const accepts = insightsPr.accepts || insightsPr.paymentRequirements || [];
  if (!Array.isArray(accepts) || accepts.length === 0) {
    fail("/insights/network-health 402 has empty accepts");
  }
  const solAccept = accepts.find((a) => String(a?.network || "").startsWith("solana:"));
  if (!solAccept) {
    fail("/insights/network-health 402 missing solana accept");
  }
  ok(
    `insights 402 ok (accepts=${accepts.length}, solana payTo=${solAccept.payTo}, amount=${solAccept.amount})`,
  );

  // 4) Control: a non-labs route should still 402 (PayAI path)
  const controlPath = "/news";
  const controlRes = await fetchWithTimeout(`${BASE_URL}${controlPath}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (controlRes.status !== 402 && controlRes.status !== 200) {
    // Some deployments may gate differently; don't hard-fail on 401/403 from API key
    warn(`${controlPath} returned ${controlRes.status} (expected 402 unpaid or 200)`);
  } else if (controlRes.status === 402) {
    ok(`${controlPath} still returns 402 (PayAI path intact)`);
  } else {
    warn(`${controlPath} returned 200 without payment — skipping PayAI control assert`);
  }

  // 5) Optional paid E2E
  const payerRaw = String(process.env.PAYER_KEYPAIR || "").trim();
  if (!payerRaw) {
    warn("PAYER_KEYPAIR not set — skipping paid E2E settle test");
    console.log("[validate-dexter-labs] done (402 + facilitator OK)");
    return;
  }

  const { getNansenPaymentFetch } = await import("../libs/sentinelPayer.js");
  const paymentFetch = await getNansenPaymentFetch();
  const paidRes = await paymentFetch(`${BASE_URL}/insights/network-health`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const bodyText = await paidRes.text();
  let body = null;
  try {
    body = JSON.parse(bodyText);
  } catch {
    /* ignore */
  }

  if (paidRes.status !== 200) {
    fail(
      `paid /insights/network-health expected 200, got ${paidRes.status}: ${bodyText.slice(0, 400)}`,
    );
  }
  if (!body?.success) {
    fail(`paid response missing success=true: ${bodyText.slice(0, 400)}`);
  }

  const paymentResponse =
    paidRes.headers.get("Payment-Response") || paidRes.headers.get("payment-response") || "";
  ok(
    `paid E2E settled via Dexter (Payment-Response=${paymentResponse ? "present" : "absent"}, dataKeys=${Object.keys(body.data || {}).join(",")})`,
  );
  console.log("[validate-dexter-labs] done");
}

main().catch((e) => {
  fail(e?.message || String(e));
});
