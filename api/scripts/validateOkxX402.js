/**
 * Validate OKX X Layer x402 integration (capabilities + optional paid E2E).
 *
 * Usage:
 *   node -r dotenv/config scripts/validateOkxX402.js
 *   BASE_URL=https://api.syraa.fun node -r dotenv/config scripts/validateOkxX402.js
 */
import { getOkxX402PublicStatus } from "../config/okxX402Networks.js";

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

function ok(msg) {
  console.log(`[validate-okx-x402] OK: ${msg}`);
}

function fail(msg) {
  console.error(`[validate-okx-x402] FAIL: ${msg}`);
  process.exit(1);
}

async function main() {
  const local = getOkxX402PublicStatus();
  console.log("[validate-okx-x402] local config", JSON.stringify(local, null, 2));

  const res = await fetch(`${BASE_URL}/x402/capabilities`);
  if (!res.ok) {
    fail(`GET /x402/capabilities returned ${res.status}`);
  }
  const body = await res.json();
  const okx = body?.data?.okx;
  if (!okx) {
    fail("capabilities response missing data.okx");
  }

  if (!local.enabled) {
    console.warn(
      "[validate-okx-x402] WARN: OKX x402 not enabled locally — set OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE, OKX_X402_PAYTO",
    );
    ok("capabilities endpoint reachable");
    return;
  }

  if (!okx.enabled) {
    fail("local OKX x402 enabled but remote /x402/capabilities reports disabled — deploy env vars");
  }

  const hasXlayer = body?.data?.networks?.xlayer === true;
  if (!hasXlayer) {
    fail("networks.xlayer not true in capabilities");
  }

  ok(`X Layer OKX facilitator enabled (payTo=${okx.payTo})`);

  const healthRes = await fetch(`${BASE_URL}/health`);
  if (healthRes.status !== 402) {
    fail(`/health should return 402 without payment (got ${healthRes.status})`);
  }
  const paymentRequired =
    healthRes.headers.get("payment-required") ||
    healthRes.headers.get("Payment-Required") ||
    "";
  if (!paymentRequired) {
    fail("/health 402 missing Payment-Required header");
  }

  const decoded = JSON.parse(
    Buffer.from(paymentRequired, "base64").toString("utf8"),
  );
  const accepts = decoded?.accepts || decoded?.paymentRequirements || [];
  const xlayerAccept = accepts.find((a) => String(a?.network) === "eip155:196");
  if (!xlayerAccept) {
    fail("402 accepts missing eip155:196 (X Layer) — OKX facilitator may not be wired");
  }

  ok(`402 offers X Layer accept (payTo=${xlayerAccept.payTo}, asset=${xlayerAccept.asset})`);
  console.log("[validate-okx-x402] done");
}

main().catch((e) => {
  fail(e?.message || String(e));
});
