/**
 * Register Syra with x402 discovery registries (CDP Bazaar, PayAI, Ampersend).
 *
 * Usage:
 *   node -r dotenv/config scripts/registerX402Registries.js
 *   node -r dotenv/config scripts/registerX402Registries.js --ampersend --pay
 *   node -r dotenv/config scripts/registerX402Registries.js --validate
 *   node -r dotenv/config scripts/registerX402Registries.js --validate --local
 *   node -r dotenv/config scripts/registerX402Registries.js --validate --base-url=https://api.syraa.fun
 *
 * @see https://docs.x402.org/extensions/bazaar
 * @see https://docs.payai.network/x402/sellers
 */
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getBaseX402GatewayConfig } from "../config/baseX402Gateway.js";
import { getPayaiPayToAddresses } from "../config/payaiX402Networks.js";
import { buildPublicMetricsSnapshot } from "../libs/publicMetricsService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PRODUCTION_BASE = "https://api.syraa.fun";
const VALIDATE = process.argv.includes("--validate");
const VALIDATE_LOCAL = process.argv.includes("--local");
const VALIDATE_PRODUCTION =
  process.argv.includes("--production") || (VALIDATE && !VALIDATE_LOCAL);
const RUN_AMPERSEND = process.argv.includes("--ampersend") || process.argv.includes("--pay");

/** Manifest / payTo config uses env BASE_URL (may be localhost in dev). */
const BASE_URL = String(process.env.BASE_URL || PRODUCTION_BASE).replace(/\/+$/, "");

/** HTTP probes for --validate: production by default so you need not run api locally. */
function resolveValidationBaseUrl() {
  const flagArg = process.argv.find((a) => a.startsWith("--base-url="));
  if (flagArg) return flagArg.slice("--base-url=".length).replace(/\/+$/, "");

  const envValidate = String(process.env.X402_VALIDATE_BASE_URL || "").trim();
  if (envValidate) return envValidate.replace(/\/+$/, "");

  if (VALIDATE_PRODUCTION) return PRODUCTION_BASE;

  return BASE_URL;
}

const VALIDATION_BASE_URL = resolveValidationBaseUrl();

function log(msg) {
  console.log(`[x402-registries] ${msg}`);
}

function fail(msg) {
  console.error(`[x402-registries] FAIL: ${msg}`);
  process.exitCode = 1;
}

async function probeUrl(url, init) {
  try {
    const res = await fetch(url, init);
    return { res, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { res: null, error: msg };
  }
}

async function validateDiscovery() {
  const base = VALIDATION_BASE_URL;
  log(`Validating discovery at ${base}`);
  if (VALIDATE_PRODUCTION && BASE_URL !== base) {
    log(`(manifest BASE_URL remains ${BASE_URL} — use --local to probe localhost)`);
  }

  const checks = [];

  const wellKnownHit = await probeUrl(`${base}/.well-known/x402`);
  if (wellKnownHit.error) {
    checks.push({
      name: "GET /.well-known/x402",
      ok: false,
      detail: wellKnownHit.error,
    });
  } else {
    const wellKnown = wellKnownHit.res;
    checks.push({
      name: "GET /.well-known/x402",
      ok: wellKnown.ok,
      detail: wellKnown.ok
        ? `${(await wellKnown.json()).resources?.length ?? 0} resources`
        : `status ${wellKnown.status}`,
    });
  }

  const metricsHit = await probeUrl(`${base}/api/metrics`);
  checks.push({
    name: "GET /api/metrics",
    ok: Boolean(metricsHit.res?.ok),
    detail: metricsHit.error
      ? metricsHit.error
      : metricsHit.res?.ok
        ? "public metrics live"
        : `status ${metricsHit.res?.status ?? "unknown"}`,
  });

  const llmsHit = await probeUrl(`${base}/llms-full.txt`);
  if (llmsHit.error) {
    checks.push({
      name: "GET /llms-full.txt",
      ok: false,
      detail: llmsHit.error,
    });
  } else {
    const llms = llmsHit.res;
    const text = llms.ok ? await llms.text() : "";
    checks.push({
      name: "GET /llms-full.txt",
      ok: llms.ok && text.includes("insights/network-health"),
      detail: llms.ok
        ? `${text.length} bytes${text.includes("insights/network-health") ? ", insights listed" : ", insights missing"}`
        : `status ${llms.status}`,
    });
  }

  const freePillarsHit = await probeUrl(`${base}/free/pillars`);
  checks.push({
    name: "GET /free/pillars",
    ok: Boolean(freePillarsHit.res?.ok),
    detail: freePillarsHit.error
      ? freePillarsHit.error
      : freePillarsHit.res?.ok
        ? "free tier live"
        : `status ${freePillarsHit.res?.status ?? "unknown"}`,
  });

  const healthHit = await probeUrl(`${base}/health`, {
    headers: { Accept: "application/json" },
  });
  checks.push({
    name: "GET /health (402 probe)",
    ok: healthHit.res?.status === 402,
    detail: healthHit.error
      ? healthHit.error
      : `status ${healthHit.res?.status ?? "unknown"}`,
  });

  const openapiHit = await probeUrl(`${base}/openapi.json`);
  let insightsInOpenApi = 0;
  if (openapiHit.res?.ok) {
    try {
      const spec = await openapiHit.res.json();
      insightsInOpenApi = Object.keys(spec?.paths ?? {}).filter((p) =>
        p.includes("/insights/"),
      ).length;
    } catch {
      insightsInOpenApi = 0;
    }
  }
  checks.push({
    name: "GET /openapi.json (insights paths)",
    ok: Boolean(openapiHit.res?.ok) && insightsInOpenApi >= 6,
    detail: openapiHit.error
      ? openapiHit.error
      : openapiHit.res?.ok
        ? `${insightsInOpenApi}/6 insights paths listed`
        : `status ${openapiHit.res?.status ?? "unknown"}`,
  });

  const insightsHit = await probeUrl(`${base}/insights/network-health`, {
    headers: { Accept: "application/json" },
  });
  checks.push({
    name: "GET /insights/network-health (402 probe)",
    ok: insightsHit.res?.status === 402,
    detail: insightsHit.error
      ? insightsHit.error
      : `status ${insightsHit.res?.status ?? "unknown"}`,
  });

  for (const c of checks) {
    if (c.ok) log(`OK  ${c.name} — ${c.detail}`);
    else fail(`${c.name} — ${c.detail}`);
  }

  return checks.every((c) => c.ok);
}

function writeRegistryManifest() {
  const baseGateway = getBaseX402GatewayConfig();
  const { solanaPayTo, evmPayTo } = getPayaiPayToAddresses();
  const manifest = {
    service: "Syra",
    tagline: "Machine money for agents — Solana intelligence, execution, treasury",
    discovery_url: `${BASE_URL}/.well-known/x402`,
    openapi_url: `${BASE_URL}/openapi.json`,
    metrics_url: `${BASE_URL}/api/metrics`,
    llms_full_url: `${BASE_URL}/llms-full.txt`,
    networks: [
      ...(evmPayTo
        ? [{ caip2: "eip155:8453", asset: "USDC", payTo: evmPayTo, label: "Base" }]
        : []),
      ...(solanaPayTo
        ? [
            {
              caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
              asset: "USDC",
              payTo: solanaPayTo,
              label: "Solana",
            },
          ]
        : []),
    ],
    base_gateway: baseGateway,
    registries: {
      cdp_bazaar: {
        note: "List at https://portal.cdp.coinbase.com — Bazaar discovers payTo from on-chain settlements",
        payTo: evmPayTo,
        network: "eip155:8453",
      },
      payai: {
        note: "Submit seller profile at https://payai.network",
        facilitator: "https://facilitator.payai.network",
      },
      agent402: {
        note: "Auto-indexed from CDP Bazaar + on-chain USDC to payTo",
        leaderboard: "https://agent402.tools/leaderboard",
      },
      x402stats: {
        note: "Auto-indexed from facilitator registries",
        url: "https://x402stats.io",
      },
      ampersend: {
        script: "node -r dotenv/config scripts/registerAmpersendMarketplace.js --write-payload",
        marketplace: "https://api.ampersend.ai/api/v1/agents/marketplace",
      },
      zauth: {
        note: "Provider Hub SDK auto-registers endpoints on traffic; database at https://zauth.inc/database",
        provider_hub: "https://zauth.inc/provider-hub",
        directory_api: "https://api.zauth.inc/api/directory",
        sdk: "@zauthx402/sdk",
      },
      x402scan: {
        note: "Register at https://www.x402scan.com/resources/register — requires openapi.json listing",
        discovery: `${BASE_URL}/openapi.json`,
      },
    },
    updatedAt: new Date().toISOString(),
  };

  const outPath = path.resolve(__dirname, "../../ampersend/x402-registry-manifest.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
  log(`Wrote registry manifest → ${outPath}`);
  return manifest;
}

async function main() {
  log(`Syra x402 registry tooling — ${BASE_URL}`);

  const manifest = writeRegistryManifest();
  const baseGateway = getBaseX402GatewayConfig();

  if (!baseGateway.enabled) {
    log("WARN: Base gateway not configured — set BASE_PAYTO or EVM_PAYTO for CDP Bazaar indexing");
  } else {
    log(`Base gateway ready — payTo ${baseGateway.payTo}`);
  }

  try {
    if (VALIDATE) {
      log("Skipping local Mongo metrics snapshot during --validate (remote HTTP probes only)");
    } else {
      const metrics = await buildPublicMetricsSnapshot();
      log(
        `Metrics snapshot: ${metrics.lifetime.totalCalls} calls, $${metrics.lifetime.totalUsdSettled} USDC, ${metrics.lifetime.uniquePayingWallets} wallets`,
      );
    }
  } catch (e) {
    log(`WARN: metrics snapshot failed — ${e instanceof Error ? e.message : e}`);
  }

  if (VALIDATE || !RUN_AMPERSEND) {
    const ok = await validateDiscovery();
    if (!ok) fail("Discovery validation failed");
  }

  if (RUN_AMPERSEND) {
    log("Delegating to registerAmpersendMarketplace.js …");
    const { spawn } = await import("node:child_process");
    await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        ["-r", "dotenv/config", path.resolve(__dirname, "registerAmpersendMarketplace.js"), "--write-payload"],
        { stdio: "inherit", cwd: path.resolve(__dirname, "..") },
      );
      child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ampersend exit ${code}`))));
    });
  }

  log("Registry checklist:");
  log(`  CDP Bazaar payTo: ${manifest.networks.find((n) => n.caip2 === "eip155:8453")?.payTo ?? "NOT SET"}`);
  log(`  Discovery: ${manifest.discovery_url}`);
  log(`  Metrics: ${manifest.metrics_url}`);
  log("Done.");
}

main().catch((e) => {
  fail(e instanceof Error ? e.message : String(e));
});
