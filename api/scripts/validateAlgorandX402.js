/**
 * Validate Algorand x402 integration (capabilities + optional paid E2E).
 *
 * Usage:
 *   node -r dotenv/config scripts/validateAlgorandX402.js
 *   BASE_URL=https://api.syraa.fun node -r dotenv/config scripts/validateAlgorandX402.js
 *
 * Requires for paid E2E:
 *   ALGORAND_PAYTO (merchant) on API host
 *   ALGORAND_AGENT_PRIVATE_KEY (payer, opted into USDC ASA)
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BASE_URL = String(process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

async function checkCapabilities() {
  const res = await fetch(`${BASE_URL}/x402/capabilities`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`GET /x402/capabilities failed: ${res.status}`);
  }
  const algorand = body?.data?.algorand;
  if (!algorand?.enabled) {
    throw new Error(
      `Algorand not enabled on API. Set ALGORAND_PAYTO. Status: ${JSON.stringify(algorand)}`
    );
  }
  console.log("[validate-algorand-x402] capabilities OK", JSON.stringify(algorand));
  return algorand;
}

async function check402OffersNews() {
  const url = `${BASE_URL}/news?ticker=general`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (res.status !== 402) {
    throw new Error(`Expected 402 from ${url}, got ${res.status}`);
  }
  const prHeader = res.headers.get("payment-required") || res.headers.get("Payment-Required");
  const body = await res.json().catch(() => ({}));
  const accepts = body?.accepts || [];
  const algo = accepts.filter((a) => String(a?.network || "").startsWith("algorand:"));
  if (algo.length === 0) {
    throw new Error(
      `GET /news 402 has no Algorand accept. Networks: ${accepts.map((a) => a.network).join(", ")}`
    );
  }
  console.log(
    "[validate-algorand-x402] 402 offers include Algorand",
    JSON.stringify(algo.map((a) => ({ network: a.network, asset: a.asset, payTo: a.payTo })))
  );
  if (prHeader) {
    console.log("[validate-algorand-x402] Payment-Required header present");
  }
  return algo;
}

async function optionalPaidE2E() {
  const key =
    String(process.env.ALGORAND_AGENT_PRIVATE_KEY || process.env.AVM_PRIVATE_KEY || "").trim();
  if (!key) {
    console.log("[validate-algorand-x402] skip paid E2E (no ALGORAND_AGENT_PRIVATE_KEY)");
    return null;
  }
  const { getAlgorandX402PaymentFetch } = await import("../libs/sentinelPayer.js");
  const paymentFetch = await getAlgorandX402PaymentFetch();
  const url = `${BASE_URL}/news?ticker=general`;
  const res = await paymentFetch(url, {
    method: "GET",
    headers: { Accept: "application/json", "User-Agent": "SyraValidateAlgorandX402/1.0" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Paid GET /news failed: ${res.status} ${data?.error || data?.message || res.statusText}`
    );
  }
  const txHeader = res.headers.get("payment-response") || res.headers.get("Payment-Response");
  console.log("[validate-algorand-x402] paid E2E OK", {
    status: res.status,
    articleCount: Array.isArray(data?.news) ? data.news.length : 0,
    paymentResponseHeader: Boolean(txHeader),
  });
  return { status: res.status, paymentResponseHeader: txHeader };
}

async function main() {
  console.log("[validate-algorand-x402] baseUrl:", BASE_URL);
  await checkCapabilities();
  await check402OffersNews();
  await optionalPaidE2E();
  console.log("[validate-algorand-x402] all checks passed");
}

main().catch((e) => {
  console.error("[validate-algorand-x402] FAILED:", e?.message || e);
  process.exit(1);
});
