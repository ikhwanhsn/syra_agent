/**
 * Prepare Syra for Ampersend marketplace visibility and trigger Bazaar indexing.
 *
 * Usage:
 *   node -r dotenv/config scripts/registerAmpersendMarketplace.js --until-listed --pay
 *
 * @see https://docs.ampersend.ai/platform/marketplace
 */
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AMPERSEND_MARKETPLACE_NETWORK } from "../config/x402Bazaar.js";
import { X402_DISCOVERY_RESOURCE_PATHS } from "../config/x402DiscoveryResourcePaths.js";
import { getResourceDescription, getResourceMeta } from "../config/x402ResourceCatalog.js";
import { getPayaiPayToAddresses } from "../config/payaiX402Networks.js";
import {
  SYRA_AGENT_DESCRIPTION,
  SYRA_BAZAAR_CATEGORY,
  SYRA_BAZAAR_DOCS_URL,
  SYRA_BAZAAR_ICON_URL,
  SYRA_BAZAAR_SERVICE_NAME,
  SYRA_BAZAAR_TAGS,
} from "../config/syraBranding.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BASE_URL = String(process.env.BASE_URL || "https://api.syraa.fun").replace(/\/+$/, "");
const PAY_E2E = process.argv.includes("--pay") || process.argv.includes("--until-listed");
const WRITE_PAYLOAD = process.argv.includes("--write-payload");
const UNTIL_LISTED = process.argv.includes("--until-listed");
const SKIP_EMAIL = process.argv.includes("--skip-email");
const AMPERSEND_MARKETPLACE_API = "https://api.ampersend.ai/api/v1/agents/marketplace";
const BASE_USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const POLL_MS = Number(process.env.AMPERSEND_POLL_MS || 30_000);
const MAX_WAIT_MS = Number(process.env.AMPERSEND_MAX_WAIT_MS || 20 * 60_000);

function log(msg) {
  console.log(`[register-ampersend] ${msg}`);
}

function fail(msg) {
  console.error(`[register-ampersend] FAIL: ${msg}`);
  process.exitCode = 1;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function usdToMicroUsdc(usd) {
  return String(Math.round(Number(usd) * 1_000_000));
}

function buildCatalogPayload() {
  const { evmPayTo } = getPayaiPayToAddresses();
  const endpoints = X402_DISCOVERY_RESOURCE_PATHS.map((slug) => {
    const meta = getResourceMeta(slug);
    const priceUsd = meta?.suggestedPriceStx ?? 0.01;
    return {
      url: `${BASE_URL}/${slug}`,
      methods: meta?.methods ?? ["GET"],
      x402_enabled: true,
      x402_protocol_version: 2,
      network: "base",
      description: getResourceDescription(slug),
      enabled: true,
      pricing_config: {
        amount: usdToMicroUsdc(priceUsd),
        amountAtomicUnit: usdToMicroUsdc(priceUsd),
        currency: "USDC",
        networkCaip2ID: AMPERSEND_MARKETPLACE_NETWORK,
        assetAddress: BASE_USDC,
        payTo: evmPayTo,
        x402Schema: "exact",
      },
    };
  });

  return {
    name: SYRA_BAZAAR_SERVICE_NAME,
    description: SYRA_AGENT_DESCRIPTION,
    source: "catalog",
    category: SYRA_BAZAAR_CATEGORY,
    tags: SYRA_BAZAAR_TAGS,
    url: "https://syraa.fun",
    logo_url: SYRA_BAZAAR_ICON_URL,
    docs_url: SYRA_BAZAAR_DOCS_URL,
    skillmd_url: `${BASE_URL}/skill.md`,
    openapi_url: `${BASE_URL}/openapi.json`,
    discovery_url: `${BASE_URL}/.well-known/x402`,
    endpoints,
  };
}

async function checkMarketplaceListed() {
  const res = await fetch(`${AMPERSEND_MARKETPLACE_API}?search=syra`);
  if (!res.ok) return null;
  const agents = await res.json();
  return Array.isArray(agents) ? agents : [];
}

async function check402Metadata() {
  const res = await fetch(`${BASE_URL}/health`, { headers: { Accept: "application/json" } });
  if (res.status !== 402) return { ok: false, reason: `expected 402, got ${res.status}` };
  const prHeader = res.headers.get("payment-required");
  if (!prHeader) return { ok: false, reason: "missing Payment-Required header" };
  let pr;
  try {
    pr = JSON.parse(Buffer.from(prHeader, "base64").toString());
  } catch {
    return { ok: false, reason: "could not decode Payment-Required header" };
  }
  const resource = pr?.resource ?? {};
  const url = String(resource.url || "");
  if (!url.startsWith("https://")) {
    return { ok: false, reason: `resource.url not https (${url || "empty"})` };
  }
  if (!resource.serviceName) {
    return { ok: false, reason: "resource missing serviceName" };
  }
  if (!pr?.extensions?.bazaar?.discoverable) {
    return { ok: false, reason: "missing discoverable bazaar extension" };
  }
  return { ok: true, url, serviceName: resource.serviceName };
}

async function waitForDeployReady() {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const meta = await check402Metadata();
    if (meta.ok) {
      log(`deploy ready: ${meta.url} serviceName=${meta.serviceName}`);
      return true;
    }
    log(`waiting for deploy (${meta.reason})…`);
    await sleep(POLL_MS);
  }
  fail(`deploy not ready after ${MAX_WAIT_MS / 1000}s — push API fix and retry`);
  return false;
}

async function runBasePaidIndexing() {
  const key = String(process.env.CMC_PAYER_PRIVATE_KEY || process.env.BASE_PAYER_PRIVATE_KEY || "").trim();
  if (!key) {
    log("skip paid E2E — set CMC_PAYER_PRIVATE_KEY");
    return null;
  }
  if (!PAY_E2E) {
    log("skip paid E2E — pass --pay");
    return null;
  }
  const { getBaseX402PaymentFetch } = await import("../libs/sentinelPayer.js");
  const paymentFetch = await getBaseX402PaymentFetch();
  const paths = ["health", "brain", "news", "signal", "indicator", "bitcoin"];
  let ok = 0;
  for (const p of paths) {
    const url = `${BASE_URL}/${p}`;
    try {
      const res = await paymentFetch(url, {
        method: "GET",
        headers: { Accept: "application/json", "User-Agent": "SyraRegisterAmpersend/1.0" },
      });
      if (res.ok) {
        ok += 1;
        log(`paid E2E ok ${p}`);
      } else {
        const body = await res.json().catch(() => ({}));
        log(`paid E2E skip ${p}: ${res.status} ${body?.error || body?.message || ""}`);
      }
    } catch (e) {
      log(`paid E2E skip ${p}: ${e?.message || e}`);
    }
  }
  if (ok === 0) {
    fail("No paid Base settlements succeeded");
    return false;
  }
  log(`paid E2E complete (${ok}/${paths.length} endpoints)`);
  return true;
}

function writePayloadFile(payload) {
  const outDir = path.resolve(__dirname, "../../ampersend");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "catalog-registration.json");
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  log(`wrote ${outPath}`);
  return outPath;
}

function buildCatalogEmailBody(payload) {
  return `Hi Ampersend team,

Please add Syra to the Ampersend marketplace catalog (source=catalog).

Service: ${payload.name}
Category: ${payload.category}
Website: ${payload.url}
Docs: ${payload.docs_url}
OpenAPI: ${payload.openapi_url}
x402 discovery: ${payload.discovery_url}
Agent skill: ${payload.skillmd_url}

Description:
${payload.description}

Network: Base mainnet (eip155:8453), USDC exact x402 v2
Endpoints: ${payload.endpoints.length} paid intelligence APIs (JSON attached)

Tags: ${payload.tags.join(", ")}

We have Bazaar discovery enabled on all 402 responses and have run Base mainnet settlements for indexing.

Thank you,
Syra — https://syraa.fun
`;
}

async function sendCatalogEmail(payload, jsonPath) {
  if (SKIP_EMAIL) {
    log("skip catalog email (--skip-email)");
    return false;
  }
  const json = fs.readFileSync(jsonPath, "utf8");
  const body = {
    to: ["ampersend@edgeandnode.com"],
    subject: "Catalog listing request: Syra x402 APIs (Base mainnet, 29 endpoints)",
    text: buildCatalogEmailBody(payload),
    attachments: [
      {
        filename: "syra-catalog-registration.json",
        contentType: "application/json",
        content: Buffer.from(json, "utf8").toString("base64"),
      },
    ],
  };

  try {
    const { getBaseX402PaymentFetch } = await import("../libs/sentinelPayer.js");
    const paymentFetch = await getBaseX402PaymentFetch();
    const res = await paymentFetch("https://stableemail.dev/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      log(`catalog email failed: ${res.status} ${data?.error || data?.message || res.statusText}`);
      return false;
    }
    log("catalog submission email sent to ampersend@edgeandnode.com");
    return true;
  } catch (e) {
    log(`catalog email skip: ${e?.message || e} (send manually with ${jsonPath})`);
    return false;
  }
}

async function pollUntilListed(startMs) {
  while (Date.now() - startMs < MAX_WAIT_MS) {
    const listed = await checkMarketplaceListed();
    if (listed?.length) {
      log(`LISTED on Ampersend marketplace (${listed.length} match(es)):`);
      for (const a of listed) {
        log(`  ✓ ${a.name} [${a.source}] id=${a.id} endpoints=${a.endpoints?.length ?? 0}`);
      }
      return true;
    }
    log(`not listed yet — polling again in ${POLL_MS / 1000}s…`);
    await sleep(POLL_MS);
  }
  return false;
}

async function main() {
  log(`target=${BASE_URL} until-listed=${UNTIL_LISTED}`);
  const payload = buildCatalogPayload();
  const jsonPath = writePayloadFile(payload);
  log(`catalog payload: ${payload.endpoints.length} Base endpoints`);

  let listed = await checkMarketplaceListed();
  if (listed?.length) {
    log(`already listed:`);
    for (const a of listed) log(`  ✓ ${a.name} [${a.source}]`);
    return;
  }

  const startMs = Date.now();

  if (UNTIL_LISTED) {
    const ready = await waitForDeployReady();
    if (!ready) return;
  } else {
    const meta = await check402Metadata();
    if (!meta.ok) {
      fail(meta.reason);
      log("deploy API fix first, or use --until-listed to wait for deploy");
      return;
    }
    log(`OK: 402 metadata url=${meta.url} serviceName=${meta.serviceName}`);
  }

  await runBasePaidIndexing();
  await sendCatalogEmail(payload, jsonPath);

  if (UNTIL_LISTED) {
    const ok = await pollUntilListed(startMs);
    if (!ok) {
      fail(
        `Syra not listed within ${MAX_WAIT_MS / 60000} min — catalog review is manual; check app.ampersend.ai/discover later`
      );
    }
    return;
  }

  log("run with --until-listed --pay to poll marketplace until listed");
}

main().catch((e) => {
  fail(e?.message || String(e));
  process.exit(1);
});
