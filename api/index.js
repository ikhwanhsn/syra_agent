import cors from "cors";
import express from "express";
import rateLimit from "./utils/rateLimit.js";
import { securityHeaders } from "./utils/security.js";
import { requireApiKey } from "./utils/apiKeyAuth.js";
import { isGatewayOpenApiFreeRoute } from "./config/gatewayOpenApiFreeRoutes.js";
import { SYRA_META_DESCRIPTION, SYRA_TAGLINE } from "./config/syraBranding.js";
import { injectTrustedOriginApiKey } from "./utils/trustedOriginAuth.js";
import path from "path";
import { fileURLToPath } from "url";
import { createSignalRouterRegular } from "./routes/signal.js";
import { createCheckStatusAgentRouter } from "./agents/check-status.js";
import { createXProjectAnalyzerRouter } from "./agents/x-project-analyzer.js";
import { createXProjectsBatchAnalyzerRouter } from "./agents/x-projects-batch-analyzer.js";
import { createOpenRouterChatRouter } from "./routes/openrouterChat.js";
import { createChatCompletionsRouter } from "./routes/chatCompletions.js";
import { createImageGenerationsRouter } from "./routes/imageGenerations.js";
import { createVideoGenerationsRouter } from "./routes/videoGenerations.js";
import { createAgentChatRouter } from "./routes/agent/chat.js";
import { createAgentAuthRouter } from "./routes/agent/auth.js";
import { createAgentWalletIntentRouter } from "./routes/agent/walletIntent.js";
import { createAgentChartRouter } from "./routes/agent/chart.js";
import { createAgentPumpfunCoinRouter } from "./routes/agent/pumpfunCoin.js";
import { createTokensDossierRouter } from "./routes/agent/tokensDossier.js";
import { createAgentWalletRouter } from "./routes/agent/wallet.js";
import { createAgentBillingRouter } from "./routes/agent/billing.js";
import { createAgentToolsRouter } from "./routes/agent/tools.js";
import { createAgentPactRouter } from "./routes/agent/pact.js";
import { createAgentMarketplaceRouter } from "./routes/agent/marketplace.js";
import { createAgentLeaderboardRouter } from "./routes/agent/leaderboard.js";
import { createBnb8183Router } from "./routes/agent/bnb8183.js";
import { createAgentChainsRouter } from "./routes/agent/chains.js";
import { createUserPromptsRouter } from "./routes/agent/userPrompts.js";
import { createAgentSkillsRouter } from "./routes/agent/skills.js";
import { createSkillsRouter, getPublishedSkillDiscoveryResources } from "./routes/skills.js";
import { createInfoRouter } from "./routes/info.js";
import { createSyraDuneAnalyticsRouter } from "./routes/syraDuneAnalytics.js";
import { createWalletSolanaBalanceRouter } from "./routes/walletSolanaBalance.js";
import { createSolanaAgentRouter } from "./agents/solana-agent.js";
import { createAgentSignalRouter } from "./agents/create-signal.js";
import { createLeaderboardRouter } from "./routes/leaderboard.js";
import { createAnalyticsRouter } from "./routes/analytics.js";
import { createInternalResearchRouter } from "./routes/internalResearch.js";
import { createS3labsTelegramWebhookRouter } from "./routes/s3labsTelegramWebhook.js";
import { createInternalPartnershipScoutRouter } from "./routes/internalPartnershipScout.js";
import { createInternalHackathonsRouter } from "./routes/internalHackathons.js";
import { createInternalEventsRouter } from "./routes/internalEvents.js";
import { createInternalGrowthRouter } from "./routes/internalGrowth.js";
import { createInternalToolsRouter } from "./routes/internalTools.js";
import { createInternalAgentWalletsRouter } from "./routes/internalAgentWallets.js";
import { createInternalTesterAgentRouter } from "./routes/internalTesterAgent.js";
import {
  SYRA_PROBE_BASE_URL,
  TESTER_AGENT_CONFIG,
} from "./libs/testerAgent/testerAgentConfig.js";
import { createSpcxRouter, createEquityRouter } from "./routes/spcx.js";
import { createIndicatorRouter } from "./routes/indicator.js";
import { createBtcRouter } from "./routes/btc.js";
import { createSpcxExperimentRouter } from "./routes/experiment/spcx.js";
import { createSyraTradingTelegramWebhookRouter } from "./routes/syraTradingTelegramWebhook.js";
import { createSentinelDashboardRouter } from "./routes/sentinelDashboard.js";
import { createDashboardSummaryRouterRegular } from "./routes/dashboardSummary.js";
import {
  createUponlyRiseMarketRouter,
  createUponlyRiseMarketsRouter,
  createUponlyRisePortfolioRouter,
} from "./routes/uponlyRiseMarket.js";
import { createUponlyRiseCreateRouter } from "./routes/uponlyRiseCreate.js";
import { createXApiRouter } from "./routes/partner/x-api/index.js";
import { createBinanceTickerPriceRouter } from "./routes/partner/binance/ticker-price.js";
// x402 route imports (consolidated from v2 into routes)
import {
  createCryptonewsRouter,
  createNewsRouterRegular,
  createSentimentRouterRegular,
} from "./routes/partner/cryptonews.js";
import { createSignalRouter as createV2SignalRouter } from "./routes/signal.js";
// exa-search, crawl, browser-use, jupiter/swap/order, smart-money, token-god-mode, trending-jupiter, pumpfun, squid, bubblemaps,
// 8004scan, heylol, quicknode: agent-direct (POST /agent/tools/call); public HTTP routes removed for those.
import { createArbitrageExperimentX402Router } from "./routes/arbitrageExperimentX402.js";
import { createJupiterQuoteRouter } from "./routes/jupiter/quote.js";
import { createJupiterSwapUiRouter } from "./routes/jupiter/swapUi.js";
import {
  createPumpfunTrendingRouter,
  createPumpfunMoversRouter,
} from "./routes/pumpfun/marketLists.js";
import { createPumpfunAnalyzerRouter } from "./routes/pumpfun/analyzer.js";
import { createPumpfunScoutRouter } from "./routes/pumpfun/scout.js";
import { createRiseScoutRouter } from "./routes/rise.js";
import { createCoingeckoScoutRouter } from "./routes/coingecko.js";
import { createAssetsX402Router } from "./routes/assets/index.js";
import { createAssetsDetailX402Router } from "./routes/assets/detail.js";
import { createBitcoinX402Router } from "./routes/bitcoin/index.js";
import { createLpAgentExperimentRouter } from "./routes/lpAgentExperiment.js";
import { createLpAgentRealRouter } from "./routes/lpAgentReal.js";
import { createStocksExperimentRouter } from "./routes/stocksExperiment.js";
import { createBtcQuantExperimentRouter } from "./routes/btcQuantExperiment.js";
import { createBtcQuantRealRouter } from "./routes/btcQuantReal.js";
import { createBtc3MacroRouter } from "./routes/btc3Macro.js";
import { createShipLogStudioRouter } from "./routes/shipLogStudio.js";
import { createHealthRouter } from "./routes/health.js";
import { createMppV1Router } from "./routes/mpp/v1.js";
import { createMcpToolsRouter } from "./routes/mcp/tools.js";
import { getAgentFetch, SentinelBudgetError } from "./libs/agentFetch.js";
import { createNansenEndpointsRouter } from "./routes/partner/nansen/nansenEndpoints.js";
import { createTopledgerEndpointsRouter } from "./routes/partner/topledger/topledgerEndpoints.js";
import { createBinanceSpotRouter } from "./routes/partner/binance/spot.js";
import { createBinanceCorrelationRouter } from "./routes/partner/binance/correlation.js";
import { createBankrRouter } from "./routes/partner/bankr/index.js";
import { createGizaRouter } from "./routes/partner/giza/index.js";
import { createNeynarRouter } from "./routes/partner/neynar/index.js";
import { createSiwaRouter } from "./routes/partner/siwa/index.js";
// NOTE: @x402/express imports disabled - using custom V1-compatible middleware instead
// import { paymentMiddleware, x402ResourceServer } from "@x402/express";
// import { HTTPFacilitatorClient } from "@x402/core/server";
// import { ExactEvmScheme } from "@x402/evm/exact/server";
// import { ExactSvmScheme } from "@x402/svm/exact/server";
import dotenv from "dotenv";
import { zauthProvider } from "@zauthx402/sdk/middleware";
import { assertAgentWalletSecretEncryptionConfigured } from "./libs/agentWalletSecretCrypto.js";
import { metricsHandler } from "./utils/metrics.js";
import { createPredictionGameRouter } from "./routes/prediction-game/index.js";
import { create8004Router } from "./routes/8004.js";
import { createSaidRouter } from "./routes/said/index.js";
import { createAipRouter } from "./routes/aip/index.js";
import { createA2aRouter } from "./routes/a2a/index.js";
import { buildSyraAipAgentCardDocument } from "./libs/aipAgentCard.js";
import { getSyraAipWallet } from "./config/aipConfig.js";
import { createBrainRouter } from "./routes/brain.js";
import { createPlaygroundShareRouter } from "./routes/playgroundShare.js";
import { createStreamflowLocksRouter } from "./routes/streamflowLocks.js";
import { createStakingAppRouter } from "./routes/stakingApp.js";
import { createTempoPayoutRouter } from "./routes/payouts/tempo.js";
import { createKolRouter } from "./routes/kol/index.js";
import { createJobsRouter } from "./routes/jobs/index.js";
import { createAgentscoreRouter } from "./routes/agentscore/index.js";
import { createPillarsRouter } from "./routes/pillars.js";
import { createInvestRouter } from "./routes/invest.js";
import { createGrowRouter } from "./routes/grow.js";
import { createEarnRouter } from "./routes/earn.js";
import { createMultiWalletRecoveryRouter } from "./routes/multiWalletRecovery.js";
import { getV2Payment } from "./utils/getV2Payment.js";
import { sendTempoPayout } from "./libs/tempoPayout.js";
import {
  onMongooseConnected,
  runIfMongoConnected,
  startMongooseConnectionLoop,
} from "./config/mongoose.js";
import { buildMppDiscoveryOpenApi } from "./libs/mppDiscoveryOpenApi.js";
import { buildGatewayOpenApi } from "./libs/gatewayOpenApi.js";
import { X402_DISCOVERY_RESOURCE_PATHS } from "./config/x402DiscoveryResourcePaths.js";
import {
  getResourceDescription,
  getResourceMeta,
  getResourceName,
} from "./config/x402ResourceCatalog.js";
import { buildShadowfeedFeedsManifest } from "./config/shadowfeedDiscovery.js";
import { shadowfeedPartnerMiddleware } from "./utils/shadowfeedPartner.js";
import {
  bootstrapB402PrivateKeyFromEnv,
  getB402PublicStatus,
} from "./libs/b402KeyMaterial.js";
import { isB402Enabled } from "./config/b402Networks.js";
import { getAlgorandPublicStatus, isAlgorandEnabled } from "./config/algorandX402Networks.js";
import { getOkxX402PublicStatus } from "./config/okxX402Networks.js";
import { startupInfo, startupVerbose, startupWarn } from "./utils/startupLog.js";
import { startMemoryHygiene } from "./utils/memoryHygiene.js";
import { withSingleFlight } from "./utils/singleFlight.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load api/.env first (so SOLANA_RPC_URL etc. are set even when run from monorepo root)
dotenv.config({ path: path.resolve(__dirname, ".env") });
// Dev: web/.env.local often defines VITE_ADMIN_DASHBOARD_WALLET — mirror for staking admin gate.
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "../web/.env.local") });
}

const b402KeyBootstrap = bootstrapB402PrivateKeyFromEnv();
if (b402KeyBootstrap.wrote) {
  startupVerbose(
    `[b402] bootstrapped private key from ${b402KeyBootstrap.source} → ${b402KeyBootstrap.path}`,
  );
}
const b402BootStatus = getB402PublicStatus();
if (b402BootStatus.enabled) {
  startupVerbose(
    "[b402] credentials loaded",
    JSON.stringify({ keySource: b402BootStatus.keySource }),
  );
} else {
  startupWarn(
    "[b402] not ready at boot",
    JSON.stringify({ missing: b402BootStatus.missing, keySource: b402BootStatus.keySource }),
  );
}
const algorandBootStatus = getAlgorandPublicStatus();
if (algorandBootStatus.enabled) {
  startupVerbose(
    "[algorand-x402] ready at boot",
    JSON.stringify({
      payTo: algorandBootStatus.payTo,
      facilitatorUrl: algorandBootStatus.facilitatorUrl,
      networks: algorandBootStatus.networks?.map((n) => n.id),
    }),
  );
} else {
  startupWarn(
    "[algorand-x402] not ready at boot",
    JSON.stringify({ missing: algorandBootStatus.missing }),
  );
}

// SECURITY P0.1 — refuse to boot if agent wallet encryption is not configured.
// Skipping this check would silently allow plaintext storage of private keys.
try {
  assertAgentWalletSecretEncryptionConfigured();
} catch (err) {
  console.error("\n" + (err?.message || String(err)) + "\n");
  process.exit(1);
}

// x402 Payment Configuration
// NOTE: Individual routes use requirePayment() from utils/x402Payment.js
// which handles V1-compatible payment verification and 402 responses.
// See utils/x402Payment.js for configuration details.

const app = express();
const { requirePayment: requirePaymentV2, settlePaymentAndSetResponse } =
  await getV2Payment();

// Trust first proxy (e.g. Nginx, Cloudflare) so req.ip / X-Forwarded-For are correct for rate limiting
if (process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// NOTE: @x402/express paymentMiddleware DISABLED
// We use custom V1-compatible requirePayment middleware in each route file instead.
// This ensures x402scan compatibility with x402Version: 1 format.
//
// The individual routes (news.js, signal.js, etc.) use requirePayment() from
// utils/x402Payment.js which returns the correct V1 format with:
// - x402Version: 1
// - X-PAYMENT header requirement
// - Simple network name (e.g., "solana")
// - maxAmountRequired field
// - outputSchema with input/output structure
// - extra.feePayer field

// CORS: restrictive origins only for regular (non-x402) APIs; x402 routes allow any origin
// Add production dashboard origin via CORS_EXTRA_ORIGINS (comma-separated, e.g. https://your-app.vercel.app)
const CORS_EXTRA = (process.env.CORS_EXTRA_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const CORS_ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:5174", // internal dashboard
  "http://localhost:5175",
  "http://localhost:3001",
  "http://localhost:3000",
  "https://api.syraa.fun",
  "https://syraa.fun",
  "https://www.syraa.fun",
  "https://agent.syraa.fun",
  "https://www.agent.syraa.fun",
  "https://dashboard.syraa.fun",
  "https://www.dashboard.syraa.fun",
  "https://playground.syraa.fun",
  "https://www.playground.syraa.fun",
  "https://stake.syraa.fun",
  "https://www.stake.syraa.fun",
  "https://dev-landing-syra.vercel.app",
  "https://dev-dashboard-syra.vercel.app",
  "https://dev-playground-syra.vercel.app",
  "https://dev-ai-agent-syra.vercel.app",
  "https://predict.syraa.fun",
  "https://www.predict.syraa.fun",
  "https://uponlyfund.com",
  "https://www.uponlyfund.com",
  "https://s3labs.id",
  "https://www.s3labs.id",
  "https://s3labs.io",
  "https://www.s3labs.io",
  ...CORS_EXTRA,
];
/** Hoisted once — the CORS origin callback runs on every non-x402 browser request; avoid new Set() per hit. */
const CORS_ALLOWED_ORIGINS_SET = new Set(CORS_ALLOWED_ORIGINS);
const CORS_OPTIONS_X402 = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "api-key",
    "Api-Key",
    "API-KEY",
    "X-API-Key",
    "Payment-Signature",
    "PAYMENT-SIGNATURE",
    "Payment-Required",
    "PAYMENT-REQUIRED",
    "Payment-Response",
    "PAYMENT-RESPONSE",
    "X-Payment",
    "x-payment",
    "X-Payment-Protocol",
    "x-payment-protocol",
    "X-Payment-Escrow",
    "x-payment-escrow",
    "X-Payment-Agent",
    "x-payment-agent",
    "X-Payment-Depositor",
    "x-payment-depositor",
    "X-Payment-Program",
    "x-payment-program",
    "X-Payment-Depositor-Token",
    "x-payment-depositor-token",
    "X-Payment-Escrow-Vault",
    "x-payment-escrow-vault",
    "X-Payer-Address",
    "x-payer-address",
    "X-Admin-Wallet",
    "x-admin-wallet",
    "X-Sf-Partner",
    "x-sf-partner",
    "X-Sf-Timestamp",
    "x-sf-timestamp",
    "X-Sf-Nonce",
    "x-sf-nonce",
    "X-Sf-Signature",
    "x-sf-signature",
    "X-Syra-Device-Id",
    "x-syra-device-id",
  ],
};
const CORS_OPTIONS_REGULAR = {
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. same-origin, Postman, server-side)
    if (!origin) return cb(null, true);
    const normalized = origin.replace(/\/$/, ""); // strip trailing slash
    if (
      CORS_ALLOWED_ORIGINS_SET.has(origin) ||
      CORS_ALLOWED_ORIGINS_SET.has(normalized)
    )
      return cb(null, true);
    // Local Syra frontends may run on any localhost port during dev.
    try {
      const host = new URL(origin).hostname.toLowerCase();
      if (host === "localhost" || host === "127.0.0.1") return cb(null, true);
    } catch {
      /* ignore malformed origin */
    }
    return cb(null, false);
  },
  // Required when browsers use fetch(..., { credentials: "include" }) — e.g. ai-agent trading experiment page
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "api-key",
    "Api-Key",
    "API-KEY",
    "X-API-Key",
    "Payment-Signature",
    "PAYMENT-SIGNATURE",
    "Payment-Required",
    "PAYMENT-REQUIRED",
    "Payment-Response",
    "PAYMENT-RESPONSE",
    "X-Payment",
    "x-payment",
    "X-Payment-Protocol",
    "x-payment-protocol",
    "X-Payment-Escrow",
    "x-payment-escrow",
    "X-Payment-Agent",
    "x-payment-agent",
    "X-Payment-Depositor",
    "x-payment-depositor",
    "X-Payment-Program",
    "x-payment-program",
    "X-Payment-Depositor-Token",
    "x-payment-depositor-token",
    "X-Payment-Escrow-Vault",
    "x-payment-escrow-vault",
    "X-Payer-Address",
    "x-payer-address",
    "X-Admin-Wallet",
    "x-admin-wallet",
    "X-Sf-Partner",
    "x-sf-partner",
    "X-Sf-Timestamp",
    "x-sf-timestamp",
    "X-Sf-Nonce",
    "x-sf-nonce",
    "X-Sf-Signature",
    "x-sf-signature",
    "X-Syra-Device-Id",
    "x-syra-device-id",
  ],
};

// COMMAND: x402 API — unversioned paths (e.g. /news, /signal); v1 is not x402.
// Preview/landing routes (/preview/*, /dashboard-summary, /binance-ticker, /x) get permissive CORS; x402 routes skip rate limit.
function isX402Route(p) {
  if (!p) return false;
  if (p === "/openapi.json" || p === "/mpp-openapi.json") return true;
  if (p.startsWith("/.well-known")) return true;
  if (p.startsWith("/news")) return true;
  if (p.startsWith("/signal")) return true;
  if (p.startsWith("/spcx")) return true;
  if (p.startsWith("/equity")) return true;
  if (p === "/indicator" || p.startsWith("/indicator/")) return true;
  if (p === "/arbitrage" || p.startsWith("/arbitrage/")) return true;
  if (p === "/jupiter/quote" || p.startsWith("/jupiter/quote/")) return true;
  if (p === "/pumpfun/trending" || p.startsWith("/pumpfun/trending/")) return true;
  if (p === "/pumpfun/movers" || p.startsWith("/pumpfun/movers/")) return true;
  if (p === "/pumpfun/analyzer" || p.startsWith("/pumpfun/analyzer/")) return true;
  if (p === "/pumpfun/scout" || p.startsWith("/pumpfun/scout/")) return true;
  if (p === "/rise" || p.startsWith("/rise/")) return true;
  if (p === "/coingecko" || p.startsWith("/coingecko/")) return true;
  if (p === "/assets" || p.startsWith("/assets/")) return true;
  if (p === "/bitcoin" || p.startsWith("/bitcoin/")) return true;
  if (p.startsWith("/health")) return true;
  if (
    p === "/check-status" ||
    (p.startsWith("/check-status/") && !p.startsWith("/check-status-agent"))
  )
    return true;
  if (p.startsWith("/mpp")) return true;
  if (p.startsWith("/solana-agent")) return true;
  if (p.startsWith("/analytics/summary")) return true;
  if (p.startsWith("/sentiment")) return true;
  if (p.startsWith("/event")) return true;
  if (p.startsWith("/trending-headline")) return true;
  if (p.startsWith("/sundown-digest")) return true;
  if (p.startsWith("/8004")) return true;
  if (p.startsWith("/brain")) return true;
  if (p === "/a2a" || p.startsWith("/a2a/")) return true;
  if (p.startsWith("/nansen")) return true;
  if (p.startsWith("/binance")) return true;
  if (p.startsWith("/bankr")) return true;
  if (p.startsWith("/giza")) return true;
  if (p.startsWith("/neynar")) return true;
  if (p.startsWith("/siwa")) return true;
  if (p === "/x" || p.startsWith("/x/")) return true;
  if (p === "/x-analyzer" || p.startsWith("/x-analyzer/")) return true;
  if (p === "/skills" || p.startsWith("/skills/")) return true;
  return false;
}

/**
 * NOTE on the preview / dashboard / openapi-free tier:
 *   /preview/*, /dashboard-summary, /binance-ticker (internal Syra frontends only; not in OpenAPI free catalog)
 *
 * Listed in GET /openapi.json with security: [] for x402scan / tryponcho discovery.
 * Publicly reachable (no API key) and exempt from rate limits so discovery probes succeed.
 * Syra browser frontends may still use trusted-origin API-key injection when calling other routes.
 */

// SECURITY: only x402 (paid + public discovery JSON like /.well-known/x402, /openapi.json,
// /mpp-openapi.json, /health, /8004/*, etc. — see isX402Route) gets permissive `*` CORS so
// external agents and pay-per-call clients can integrate.
//
// Every other route — /agent/*, /api/playground-proxy, /api/signal, /preview/*,
// /dashboard-summary, /binance-ticker, /uponly-rise-*, /streamflow-locks, /staking, etc. —
// falls through to CORS_OPTIONS_REGULAR which only allows Syra's own origins (syraa.fun,
// agent.syraa.fun, playground.syraa.fun, dashboard.syraa.fun, predict.syraa.fun,
// uponlyfund.com, configured dev origins). This prevents external websites from consuming
// non-x402 Syra APIs while still letting Syra frontends call them transparently
// (trusted-origin API-key injection covers auth for browser callers).
app.use((req, res, next) => {
  const options = isX402Route(req.path)
    ? CORS_OPTIONS_X402
    : CORS_OPTIONS_REGULAR;
  cors(options)(req, res, next);
});

// Security: headers (X-Content-Type-Options, X-Frame-Options, etc.) and body size limit
app.use(securityHeaders);

// Timeout for playground proxy outbound fetch (ms). Prevents hanging so we always return 502 with a clear message.
const PLAYGROUND_PROXY_TIMEOUT_MS = 28_000;

function getHeaderCaseInsensitive(headers, name) {
  if (!headers || typeof headers !== "object") return undefined;
  const wanted = String(name || "").toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (String(k).toLowerCase() === wanted) return v;
  }
  return undefined;
}

function decodeBase64UrlJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const parsed = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function parseTempoChallengeFromWwwAuthenticate(headerValue) {
  if (!headerValue || typeof headerValue !== "string") return null;
  const raw = headerValue;
  if (!/^\s*payment\s/i.test(raw)) return null;
  const methodMatch = raw.match(/method="([^"]+)"/i);
  if (!methodMatch || String(methodMatch[1]).toLowerCase() !== "tempo")
    return null;
  const requestMatch = raw.match(/request="([^"]+)"/i);
  if (!requestMatch?.[1]) return null;
  const reqPayload = decodeBase64UrlJson(requestMatch[1]);
  if (!reqPayload) return null;
  const amountRaw = String(reqPayload.amount ?? "0").trim();
  const recipient = String(reqPayload.recipient ?? "").trim();
  if (!/^\d+$/.test(amountRaw) || !recipient) return null;
  const amountMicro = Number(amountRaw);
  if (!Number.isFinite(amountMicro) || amountMicro <= 0) return null;
  const idMatch = raw.match(/id="([^"]+)"/i);
  return {
    id: idMatch?.[1] ? String(idMatch[1]) : undefined,
    amountMicro,
    amountUsd: amountMicro / 1_000_000,
    recipient,
    currency: String(reqPayload.currency ?? "").trim(),
    chainId: String(reqPayload.chainId ?? reqPayload.chain ?? "").trim(),
  };
}

async function requireProxyPayment(req, res, options) {
  const middleware = requirePaymentV2(options);
  let allowed = false;
  await middleware(req, res, () => {
    allowed = true;
  });
  return allowed;
}

// Playground proxy must parse large bodies (payment headers can be 50kb+). Register before
// global json so this route gets 2mb limit.
//
// SECURITY: this route is non-x402 and must be Syra-internal only. Because it is registered
// before the global injectTrustedOriginApiKey / requireApiKey middlewares (the only routes in
// that early window are the proxy handler and CORS), we run those auth checks inline here so
// external callers (curl, server-side requests bypassing CORS) cannot consume it. CORS already
// blocks cross-origin browsers; the inline auth blocks everything else.
app.post(
  "/api/playground-proxy",
  injectTrustedOriginApiKey,
  requireApiKey(() => false),
  express.json({ limit: "2mb" }),
  async (req, res) => {
    const {
      url: targetUrl,
      method = "GET",
      body: forwardBody,
      headers: forwardHeaders = {},
    } = req.body || {};
    if (!targetUrl || typeof targetUrl !== "string") {
      res.status(400).json({ error: "Missing or invalid url in body" });
      return;
    }
    const allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"];
    const forwardMethod = (method || "GET").toUpperCase();
    if (!allowedMethods.includes(forwardMethod)) {
      res.status(400).json({
        error: `Method ${forwardMethod} not allowed. Supported: ${allowedMethods.join(", ")}`,
      });
      return;
    }
    const sentinelFetch = await getAgentFetch("playground");
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      PLAYGROUND_PROXY_TIMEOUT_MS,
    );
    try {
      const fetchOpts = {
        method: forwardMethod,
        headers: { ...forwardHeaders },
        signal: controller.signal,
      };
      if (
        forwardBody != null &&
        forwardBody !== "" &&
        forwardMethod !== "GET" &&
        forwardMethod !== "HEAD"
      ) {
        fetchOpts.body =
          typeof forwardBody === "string"
            ? forwardBody
            : JSON.stringify(forwardBody);
      }
      const proxyRes = await sentinelFetch(targetUrl, fetchOpts);
      clearTimeout(timeoutId);
      const responseText = await proxyRes.text();
      const forwardedHeaders = {};
      proxyRes.headers.forEach((value, key) => {
        forwardedHeaders[key] = value;
      });

      // Tempo MPP relay:
      // 1) Upstream returns 402 with WWW-Authenticate method="tempo".
      // 2) We ask the user to pay Syra via x402 (Solana/Base).
      // 3) After successful user payment, server pays Tempo via TEMPO_PAYOUT_PRIVATE_KEY.
      // 4) Retry upstream request once and return the final response.
      let target;
      try {
        target = new URL(targetUrl);
      } catch {
        target = null;
      }
      const isMppPath = target?.pathname?.toLowerCase().includes("/mpp/");
      const tempoChallenge = parseTempoChallengeFromWwwAuthenticate(
        getHeaderCaseInsensitive(forwardedHeaders, "www-authenticate"),
      );
      if (proxyRes.status === 402 && isMppPath && tempoChallenge) {
        const relayPrice = tempoChallenge.amountUsd.toFixed(6);
        const paid = await requireProxyPayment(req, res, {
          price: relayPrice,
          method: forwardMethod,
          discoverable: false,
          resource: "/api/playground-proxy",
          description:
            "MPP Tempo relay payment (user pays with x402; server settles Tempo challenge)",
          inputSchema: {
            bodyType: "json",
            bodyFields: {
              url: {
                type: "string",
                required: true,
                description: "Target URL",
              },
              method: {
                type: "string",
                required: false,
                description: "HTTP method",
              },
              body: {
                type: "object",
                required: false,
                description: "Request body",
              },
            },
          },
        });
        if (!paid) return;

        const memo = tempoChallenge.id
          ? tempoChallenge.id.slice(0, 32)
          : undefined;
        const payout = await sendTempoPayout({
          to: tempoChallenge.recipient,
          amountUsd: tempoChallenge.amountUsd,
          memo,
        });

        if (!payout.success) {
          if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
          res.status(502).json({
            success: false,
            error: "Tempo relay payout failed",
            message:
              payout.error ||
              "Could not settle Tempo challenge from server wallet.",
          });
          return;
        }

        const retryRes = await sentinelFetch(targetUrl, fetchOpts);
        const retryText = await retryRes.text();
        const skipHeaders = [
          "content-encoding",
          "transfer-encoding",
          "content-length",
          "connection",
        ];
        retryRes.headers.forEach((value, key) => {
          if (!skipHeaders.includes(key.toLowerCase())) {
            res.setHeader(key, value);
          }
        });
        res.setHeader("X-Syra-Tempo-Relay", "true");
        res.setHeader("X-Syra-Tempo-Payout-Tx", payout.transactionHash || "");
        if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
        res.status(retryRes.status).send(retryText);
        return;
      }

      // Forward safe response headers (exclude hop-by-hop and encoding)
      const skipHeaders = [
        "content-encoding",
        "transfer-encoding",
        "content-length",
        "connection",
      ];
      proxyRes.headers.forEach((value, key) => {
        if (!skipHeaders.includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      res.status(proxyRes.status).send(responseText);
    } catch (err) {
      clearTimeout(timeoutId);
      if (
        err &&
        (err.name === "SentinelBudgetError" ||
          err instanceof SentinelBudgetError)
      ) {
        res.status(402).json({
          error: "Playground spend limit exceeded",
          message: err.message || String(err),
          budgetExceeded: true,
        });
        return;
      }
      const isTimeout = err && err.name === "AbortError";
      res.status(502).json({
        error: "Proxy fetch failed",
        message: isTimeout
          ? "The request to the target API timed out."
          : err.message || String(err),
        hint: isTimeout
          ? "The target API took too long to respond. It may be slow or blocking server-side requests."
          : "The target API may be unreachable from our server (e.g. blocking our IP, firewall, or down).",
      });
    }
  },
);

app.use(
  express.json({
    limit: "200kb",
    verify: (req, _res, buf) => {
      if (buf?.length) req.rawBody = buf;
    },
  }),
); // Prevent large-payload DoS; rawBody used by ShadowFeed HMAC for POST bodies

// ShadowFeed Partner Bridge: verify HMAC before x402 payment on paid routes.
// Must run after body parser so POST body hash matches raw bytes (req.rawBody).
app.use((req, res, next) => {
  if (!isX402Route(req.path)) return next();
  return shadowfeedPartnerMiddleware()(req, res, next);
});
app.use(express.static(path.join(__dirname, "public")));

// Request insight tracking (volume, errors, latency) for dashboard – fire-and-forget on response finish
app.use((req, res, next) => {
  const start = Date.now();
  const skip = req.path === "/" || req.path === "/favicon.ico";
  res.once("finish", () => {
    if (skip) return;
    const durationMs = Date.now() - start;
    import("./utils/recordApiRequest.js")
      .then(({ recordApiRequest }) =>
        recordApiRequest(req, res, durationMs, {
          paid: req._requestInsightPaid === true,
        }),
      )
      .catch(() => {});
  });
  next();
});

// Favicon explicit route (important for bots)
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "favicon.ico"));
});

// Rate limit all non-x402 routes (preview, dashboard-summary, x, agent, playground, analytics, prediction-game) to prevent spam, DDoS, abuse
// Strict dual-window: burst 25/10s + sustained 100/min. Only x402 (paid) routes skip.
// Skip RISE proxies: one session loads many list pages (full-universe); counting each page toward burst breaks the UpOnly dashboard with 429.
app.use(
  rateLimit({
    strict: true,
    burstWindowMs: 10 * 1000,
    burstMax: 25,
    windowMs: 60 * 1000,
    max: 100,
    skip: (req) => {
      const p = req.path || "";
      return (
        p.startsWith("/agent/auth/") ||
        p === "/agent/wallet/connect" ||
        isX402Route(p) ||
        isGatewayOpenApiFreeRoute(p) ||
        p.startsWith("/internal/tester-agent") ||
        p.startsWith("/internal/trend-scout/run") ||
        p.startsWith("/internal/growth-scout/run") ||
        p.startsWith("/internal/s3labs-news/run") ||
        p.startsWith("/internal/s3labs-developer/run") ||
        p.startsWith("/internal/s3labs-event/run") ||
        p.startsWith("/internal/s3labs-job/run") ||
        p.startsWith("/internal/s3labs-telegram/webhook") ||
        p.startsWith("/internal/partnership-scout/run") ||
        p.startsWith("/internal/hackathons/run") ||
        p.startsWith("/uponly-rise-market") ||
        p.startsWith("/uponly-rise-portfolio") ||
        p.startsWith("/uponly-rise-create")
      );
    },
  }),
);

// For requests from trusted browser origins (syraa.fun, dashboard, agent, playground), inject
// server API key so frontends never need to embed it in client bundles (security fix).
app.use(injectTrustedOriginApiKey);

// KOL marketplace — public, no API key (s3labs /kol). Mount before requireApiKey.
app.use("/kol", createKolRouter());
app.use("/jobs", createJobsRouter());
app.use("/pillars", createPillarsRouter());
app.use("/invest", createInvestRouter());
app.use("/grow", createGrowRouter());
app.use("/earn", createEarnRouter());
app.use("/multiwallet-recover", createMultiWalletRecoveryRouter());

// API key / Bearer auth when API_KEY or API_KEYS is set in env.
// Skip auth for:
//   - x402 routes (paid, gated by 402 instead)
//   - landing/static surface (/, /favicon.ico, /og*, /info*) and the playground / prediction game
//     surfaces that have their own session model.
// All other non-x402 routes — including the preview/dashboard tier
// (/preview/*, /dashboard-summary, /binance-ticker, /streamflow-locks, /staking, /uponly-rise-*)
// and /agent/* — require a valid API key. Syra's own browser frontends keep working transparently
// because injectTrustedOriginApiKey above injects the server key when Origin/Referer is a trusted
// Syra origin (see utils/trustedOriginAuth.js). External sites and scripts cannot reach these
// routes without a valid key.
// /8004 also stays API-key protected.
app.use(
  requireApiKey((req) => {
    const p = req.path || "";
    if (p.startsWith("/internal/tester-agent")) {
      const secret = (process.env.TESTER_AGENT_CRON_SECRET || "").trim();
      if (secret) {
        const got = (req.get("x-tester-agent-cron-secret") || "").trim();
        if (got === secret) return true;
      }
    }
    if (
      p === "/internal/trend-scout/run" &&
      String(req.method || "").toUpperCase() === "POST"
    ) {
      const secret = (process.env.SYRA_TREND_SCOUT_CRON_SECRET || "").trim();
      if (secret) {
        const got = (req.get("x-syra-trend-scout-cron-secret") || "").trim();
        if (got === secret) return true;
      }
    }
    if (
      p === "/internal/growth-scout/run" &&
      String(req.method || "").toUpperCase() === "POST"
    ) {
      const secret = (process.env.SYRA_GROWTH_SCOUT_CRON_SECRET || "").trim();
      if (secret) {
        const got = (req.get("x-syra-growth-scout-cron-secret") || "").trim();
        if (got === secret) return true;
      }
    }
    if (
      p === "/internal/partnership-scout/run" &&
      String(req.method || "").toUpperCase() === "POST"
    ) {
      const secret = (
        process.env.SYRA_PARTNERSHIP_SCOUT_CRON_SECRET || ""
      ).trim();
      if (secret) {
        const got = (
          req.get("x-syra-partnership-scout-cron-secret") || ""
        ).trim();
        if (got === secret) return true;
      }
    }
    if (
      p === "/internal/hackathons/run" &&
      String(req.method || "").toUpperCase() === "POST"
    ) {
      const secret = (process.env.HACKATHON_SCOUT_CRON_SECRET || "").trim();
      if (secret) {
        const got = (req.get("x-hackathon-scout-cron-secret") || "").trim();
        if (got === secret) return true;
      }
    }
    if (
      p === "/internal/events/run" &&
      String(req.method || "").toUpperCase() === "POST"
    ) {
      const secret = (process.env.EVENT_SCOUT_CRON_SECRET || "").trim();
      if (secret) {
        const got = (req.get("x-event-scout-cron-secret") || "").trim();
        if (got === secret) return true;
      }
    }
    if (
      p.startsWith("/internal/s3labs-telegram/webhook") &&
      String(req.method || "").toUpperCase() === "POST"
    ) {
      return true;
    }
    if (
      p === "/internal/s3labs-news/run" &&
      String(req.method || "").toUpperCase() === "POST"
    ) {
      const secret = (process.env.S3LABS_NEWS_CRON_SECRET || "").trim();
      if (secret) {
        const got = (req.get("x-s3labs-news-cron-secret") || "").trim();
        if (got === secret) return true;
      }
    }
    if (
      (p === "/internal/s3labs-developer/run" ||
        p === "/internal/s3labs-event/run" ||
        p === "/internal/s3labs-job/run") &&
      String(req.method || "").toUpperCase() === "POST"
    ) {
      const shared = (process.env.S3LABS_AGENTS_CRON_SECRET || "").trim();
      if (shared) {
        const got = (req.get("x-s3labs-agents-cron-secret") || "").trim();
        if (got === shared) return true;
      }
      if (p === "/internal/s3labs-developer/run") {
        const secret = (process.env.S3LABS_DEVELOPER_CRON_SECRET || "").trim();
        if (secret && (req.get("x-s3labs-developer-cron-secret") || "").trim() === secret) {
          return true;
        }
      }
      if (p === "/internal/s3labs-event/run") {
        const secret = (process.env.S3LABS_EVENT_CRON_SECRET || "").trim();
        if (secret && (req.get("x-s3labs-event-cron-secret") || "").trim() === secret) {
          return true;
        }
      }
      if (p === "/internal/s3labs-job/run") {
        const secret = (process.env.S3LABS_JOB_CRON_SECRET || "").trim();
        if (secret && (req.get("x-s3labs-job-cron-secret") || "").trim() === secret) {
          return true;
        }
      }
    }
    if (
      p === "/agent/bnb8183/execute" &&
      String(req.method || "").toUpperCase() === "POST"
    ) {
      const secret = (process.env.ERC8183_INTERNAL_SECRET || "").trim();
      if (secret) {
        const got = (req.get("x-erc8183-internal-secret") || "").trim();
        if (got === secret) return true;
      }
    }
    return (
      isX402Route(p) ||
      isGatewayOpenApiFreeRoute(p) ||
      p === "/" ||
      p === "/favicon.ico" ||
      p.startsWith("/og") ||
      p.startsWith("/info") ||
      p.startsWith("/agentscore/") ||
      p.startsWith("/playground") ||
      p.startsWith("/prediction-game") ||
      p.startsWith("/kol")
    );
  }),
);

// ZAuth x402 monitoring (before x402 routes) – telemetry & optional validation/refunds via zauthx402.com
// Default SDK: telemetry.sampleRate=1 and includeResponseBody=true — wraps res.json/send/end and runs validation
// on every response (adds CPU before bytes leave the process). Tune with:
//   ZAUTH_TELEMETRY_SAMPLE_RATE=0.25  (only 25% of requests instrumented; others skip middleware entirely)
//   ZAUTH_TELEMETRY_INCLUDE_RESPONSE_BODY=false  (skip serializing response bodies into telemetry)
const ZAUTH_API_KEY = (process.env.ZAUTH_API_KEY || "").trim();
if (ZAUTH_API_KEY) {
  const zauthSampleRaw = (process.env.ZAUTH_TELEMETRY_SAMPLE_RATE || "").trim();
  const zauthSample =
    zauthSampleRaw === "" ? null : Number.parseFloat(zauthSampleRaw);
  const zauthRespBody =
    String(
      process.env.ZAUTH_TELEMETRY_INCLUDE_RESPONSE_BODY || "",
    ).toLowerCase() === "false" ||
    String(process.env.ZAUTH_TELEMETRY_INCLUDE_RESPONSE_BODY || "") === "0";
  const zauthTelemetry =
    (zauthSample != null &&
      Number.isFinite(zauthSample) &&
      zauthSample >= 0 &&
      zauthSample <= 1) ||
    zauthRespBody
      ? {
          telemetry: {
            ...(zauthSample != null &&
            Number.isFinite(zauthSample) &&
            zauthSample >= 0 &&
            zauthSample <= 1
              ? { sampleRate: zauthSample }
              : {}),
            ...(zauthRespBody ? { includeResponseBody: false } : {}),
          },
        }
      : {};
  app.use(
    zauthProvider(ZAUTH_API_KEY, {
      ...zauthTelemetry,
      refund: {
        enabled: true,
        solanaPrivateKey: process.env.ZAUTH_SOLANA_PRIVATE_KEY,
        network: "solana",
        maxRefundUsd: 1.0,
      },
    }),
  );
}

app.get("/", (req, res) => {
  const art = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║          ███████╗██╗   ██╗██████╗  █████╗      █████╗ ██╗                    ║
║          ██╔════╝╚██╗ ██╔╝██╔══██╗██╔══██╗    ██╔══██╗██║                    ║
║          ███████╗ ╚████╔╝ ██████╔╝███████║    ███████║██║                    ║
║          ╚════██║  ╚██╔╝  ██╔══██╗██╔══██║    ██╔══██║██║                    ║
║          ███████║   ██║   ██║  ██║██║  ██║    ██║  ██║██║                    ║
║          ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝                    ║
║                                                                              ║
║                           API GATEWAY v1.0                                   ║
║                                                                              ║
║                    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                       ║
║                                                                              ║
║                    AUTONOMOUS TRADING • NEVER SLEEPS                         ║
║                                                                              ║                      
║                    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│                         WELCOME TO THE FUTURE                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ⚡ The world's first X402-native AI agent trading assistant on Solana        │
│                                                                              │
│  While you sleep, SYRA works. While markets move, SYRA reacts. 24/7/365.     │
│                                                                              │
│  → Automated signal generation powered by real-time market intelligence      │
│  → Lightning-fast execution with Solana's sub-second transaction speeds      │
│  → Zero human intervention required - your AI co-pilot never takes breaks    │
│  → Seamless Telegram integration - control everything from your phone        │
│  → Web3-native payments via X402 protocol - no banks, no delays              │
│                                                                              │
│  The market doesn't sleep. Why should your trading strategy?                 │
│                                                                              │
│  🤖 AI-driven decisions │ 💰 Micro-payments (0.0001 USDC) │ 🚀 Instant on-chain │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM STATUS                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ● Agent Status         : ✓ ACTIVE & MONITORING MARKETS                      │
│  ● API Version          : v1.0.0 (24/7 Operations)                           │
│  ● System Uptime        : ${process
    .uptime()
    .toFixed(2)}s                                                │
│  ● Current Time (UTC)   : ${new Date().toISOString()}                           │
│  ● Trading Network      : Solana Devnet (Production Ready)                   │
│  ● Payment Token        : USDC (Instant Settlement)                          │
│  ● Signal Cost          : 0.0001 USDC (~$0.0001 per signal)                  │
│  ● Avg Response Time    : <100ms (Real-time Processing)                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                      AVAILABLE API ENDPOINTS                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ Trading Signal Creation (X402 Protocol) ──────────────────────────────┐  │
│  │  GET    /api/signal/create       [AVAILABLE SOON]                      │  │
│  │         → Initiate signal creation, returns 402 Payment Required       │  │
│  │         → Response includes X402 payment details (USDC/Solana)         │  │
│  │                                                                        │  │
│  │  POST   /api/signal/create       [AVAILABLE SOON]                      │  │
│  │         → Submit signal with X-Payment header                          │  │
│  │         → Verifies on-chain payment before saving signal               │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Intelligence & Analytics ─────────────────────────────────────────────┐  │
│  │  POST   /v1/insight              [AVAILABLE SOON]                      │  │
│  │         → AI-powered market intelligence and trade analysis            │  │
│  │                                                                        │  │
│  │  POST   /v1/tracking             [AVAILABLE SOON]                      │  │
│  │         → Real-time wallet and transaction monitoring                  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Data Providers ───────────────────────────────────────────────────────┐  │
│  │  GET    /v1/corbits              [AVAILABLE SOON]                      │  │
│  │         → On-chain metrics and market data                             │  │
│  │                                                                        │  │
│  │  GET    /v1/nansen               [AVAILABLE SOON]                      │  │
│  │         → Smart money flow analysis and whale tracking                 │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ Blockchain Operations ────────────────────────────────────────────────┐  │
│  │  POST   /v1/solana/tx            [AVAILABLE SOON]                      │  │
│  │         → High-performance Solana transaction broadcasting             │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                       CORE CAPABILITIES                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🤖 24/7 Agent Coverage          → Trading agent never sleeps, always alert │
│  ⚡ Real-Time Market Analysis    → Sub-second reaction to market movements  │
│  🔐 X402 Payment Protocol        → Web3-native instant micropayments        │
│  📱 Telegram Bot Integration     → Control your strategy from anywhere      │
│  💰 Solana-Powered Settlement    → Fast, cheap, and verifiable on-chain     │
│  🎯 Smart Signal Generation      → AI-driven entry/exit recommendations     │
│  🛡️  On-Chain Payment Verification → Every transaction cryptographically proven │
│  📊 Round-the-Clock Monitoring   → Markets move 24/7, so does SYRA          │
│                                                                              │
│  ⚠️  AUTOMATED ADVANTAGE: While manual traders sleep 8 hours/day, SYRA      │
│     operates at peak performance 24 hours/day. Never miss an opportunity.    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║      "The Market Never Sleeps. Neither Does Machine Money for Agents."       ║
║                                                                              ║
║              © 2026 SYRA AI Labs. All Rights Reserved.                       ║
║         Documentation & API Access • https://docs.syraa.fun                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

  const ogImageUrl = "https://www.syraa.fun/images/og-banner.png";

  res.setHeader("Content-Type", "text/html");

  return res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <!-- OG Metadata -->
      <meta property="og:title" content="Syra API Gateway" />
      <meta property="og:description" content="${SYRA_META_DESCRIPTION}" />
      <meta property="og:image" content="${ogImageUrl}" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="628" />
      <meta property="og:image:alt" content="Syra — ${SYRA_TAGLINE}" />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@syra_agent" />
      <meta name="twitter:creator" content="@syra_agent" />
      <meta name="twitter:title" content="Syra API Gateway" />
      <meta name="twitter:description" content="${SYRA_META_DESCRIPTION}" />
      <meta name="twitter:image" content="${ogImageUrl}" />
      <meta name="twitter:image:alt" content="Syra — ${SYRA_TAGLINE}" />

      <!-- Favicon -->
      <link rel="icon" href="/favicon.ico" />

      <title>Syra API Gateway</title>

      <style>
        body {
          background: #000;
          color: #0f0;
          font-family: "Courier New", monospace;
          white-space: pre;
          padding: 20px;
          font-size: 12px;
        }
        .art {
          white-space: pre-wrap;
        }
      </style>

    </head>
    <body>
      <div class="art">${art}</div>
    </body>
    </html>
  `);
});

// x402 routes (unversioned paths only; single canonical URL per endpoint)
// Partner HTTP (also callable via POST /agent/tools/call when agentDirect)
app.use("/info", await createInfoRouter());
app.use("/syra-analytics", createSyraDuneAnalyticsRouter());
app.use("/wallet/solana", createWalletSolanaBalanceRouter());
app.use("/", await createCryptonewsRouter());

// Preview/landing routes (no x402) – dashboard-summary, binance-ticker, preview/news|sentiment|signal
app.use("/preview/news", await createNewsRouterRegular());
app.use("/preview/sentiment", await createSentimentRouterRegular());
app.use("/preview/signal", await createSignalRouterRegular());
app.use("/dashboard-summary", await createDashboardSummaryRouterRegular());
app.use("/uponly-rise-market", createUponlyRiseMarketRouter());
app.use("/uponly-rise-markets", createUponlyRiseMarketsRouter());
app.use("/uponly-rise-portfolio", createUponlyRisePortfolioRouter());
app.use("/uponly-rise-create", createUponlyRiseCreateRouter());
app.use("/binance-ticker", await createBinanceTickerPriceRouter());
app.use("/btc", await createBtcRouter());
// Legacy /v1 → 410
app.use("/v1", (req, res) => {
  res.status(410).json({
    success: false,
    error:
      "v1 API is no longer available. Use x402 paths (e.g. /x, /news, /signal) or trusted-origin preview helpers.",
    migration: "https://api.syraa.fun",
    docs: "https://docs.syraa.fun",
  });
});

// Legacy free /api/signal — removed; signal is x402-only at /signal
app.use("/api/signal", (req, res) => {
  res.status(410).json({
    success: false,
    error:
      "GET/POST /api/signal is no longer free. Use GET/POST /signal with x402 payment.",
    migration: "/signal",
    docs: "https://docs.syraa.fun/docs/api/signal",
  });
});
app.use("/signal", await createV2SignalRouter());
app.use("/spcx", await createSpcxRouter());
app.use("/equity", await createEquityRouter());
app.use("/indicator", await createIndicatorRouter());
app.use("/arbitrage", await createArbitrageExperimentX402Router());
app.use("/jupiter/quote", await createJupiterQuoteRouter());
app.use("/jupiter/ui", await createJupiterSwapUiRouter());
app.use("/pumpfun/analyzer", createPumpfunAnalyzerRouter());
app.use("/pumpfun/scout", createPumpfunScoutRouter());
app.use("/pumpfun/trending", createPumpfunTrendingRouter());
app.use("/pumpfun/movers", createPumpfunMoversRouter());
app.use("/rise", createRiseScoutRouter());
app.use("/coingecko", createCoingeckoScoutRouter());
app.use("/assets/detail", await createAssetsDetailX402Router());
app.use("/assets", await createAssetsX402Router());
app.use("/bitcoin", await createBitcoinX402Router());
// Legacy /check-status → /health (308). Agent + discovery use /health.
app.use((req, res, next) => {
  const p = req.path || "";
  if (
    p === "/check-status" ||
    (p.startsWith("/check-status/") && !p.startsWith("/check-status-agent"))
  ) {
    const rest = p === "/check-status" ? "" : p.slice("/check-status".length);
    const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return res.redirect(308, `/health${rest}${q}`);
  }
  next();
});
// Legacy MPP paths → canonical /mpp/health
app.use((req, res, next) => {
  const p = req.path || "";
  if (
    p === "/mpp/v1/check-status" ||
    p.startsWith("/mpp/v1/check-status/") ||
    p === "/mpp/v1/health" ||
    p.startsWith("/mpp/v1/health/")
  ) {
    const rest =
      p === "/mpp/v1/check-status" || p === "/mpp/v1/health"
        ? ""
        : p.startsWith("/mpp/v1/check-status/")
          ? p.slice("/mpp/v1/check-status".length)
          : p.slice("/mpp/v1/health".length);
    const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return res.redirect(308, `/mpp/health${rest}${q}`);
  }
  next();
});
app.use("/health", await createHealthRouter());
app.use("/skills", await createSkillsRouter());

// SECURITY P1.8 — Prometheus metrics. Gated behind METRICS_TOKEN to prevent enumeration.
app.get("/metrics", (req, res, next) => {
  const expected = (process.env.METRICS_TOKEN || "").trim();
  if (!expected) return res.status(404).end();
  const got = (req.get("x-metrics-token") || req.query?.token || "").trim();
  if (got !== expected) return res.status(401).end();
  return metricsHandler(req, res).catch(next);
});
app.use("/mpp", await createMppV1Router());
app.use("/mcp/tools", await createMcpToolsRouter());
app.use("/check-status-agent", await createCheckStatusAgentRouter());
app.use("/x-analyzer", await createXProjectAnalyzerRouter());
app.use("/x-projects-analyze", createXProjectsBatchAnalyzerRouter());
app.use("/brain", await createBrainRouter());
app.use("/chat/completions", await createChatCompletionsRouter());
app.use("/images/generations", await createImageGenerationsRouter());
app.use("/videos/generations", await createVideoGenerationsRouter());
app.use("/openrouter", await createOpenRouterChatRouter());
// SECURITY P0.2 — wallet sign-in (SIWS/SIWE), token refresh, sign-out
app.use("/agent/auth", await createAgentAuthRouter());
// SECURITY P1.4 — per-intent user confirmation for high-risk wallet actions
app.use("/agent/wallet/intent", await createAgentWalletIntentRouter());
// Agent chat: completion, generate-description, generate-agent-image (Xona), share, CRUD
app.use("/agent/chat", await createAgentChatRouter());
app.use("/agent/chart", createAgentChartRouter());
app.use("/agent/pumpfun", createAgentPumpfunCoinRouter());
app.use("/agent/tokens", createTokensDossierRouter());
app.use("/agent/wallet/billing", await createAgentBillingRouter());
app.use("/agent/wallet", await createAgentWalletRouter());
app.use("/agent/tools", await createAgentToolsRouter());
app.use("/agent/pact", createAgentPactRouter());
app.use("/agent/marketplace/prompts", await createUserPromptsRouter());
app.use("/agent/marketplace/skills", await createAgentSkillsRouter());
app.use("/agent/marketplace", await createAgentMarketplaceRouter());
app.use("/agent/leaderboard", await createAgentLeaderboardRouter());
app.use("/agent/bnb8183", createBnb8183Router());
app.use("/agent/chains", createAgentChainsRouter());
app.use("/solana-agent", await createSolanaAgentRouter());
app.use("/create-signal", await createAgentSignalRouter());
app.use("/leaderboard", await createLeaderboardRouter());
// Sentinel Dashboard: spend, agents, alerts (API key auth); same storage as wrapWithSentinel
app.use("/internal/sentinel", await createSentinelDashboardRouter());
// Tester agent (cron smoke); mount before /internal so paths are not swallowed by research router
app.use("/internal/tester-agent", createInternalTesterAgentRouter());
// S3Labs Telegram @mention Q&A (webhook secret; no API key)
app.use("/internal", createS3labsTelegramWebhookRouter());
app.use("/internal", createSyraTradingTelegramWebhookRouter());
// Internal dashboard: research-store + scouts (API key auth, no x402)
app.use("/internal", createInternalPartnershipScoutRouter());
app.use("/internal", createInternalHackathonsRouter());
app.use("/internal", createInternalEventsRouter());
app.use("/internal", createInternalGrowthRouter());
app.use("/internal", createInternalToolsRouter());
app.use("/internal", createInternalAgentWalletsRouter());
app.use("/internal", await createInternalResearchRouter());
app.use("/experiment/spcx", createSpcxExperimentRouter());
// LP agent experiment lab (Meteora DLMM dry-run simulation only)
app.use("/experiment/lp-agent", createLpAgentExperimentRouter());
// LP real agent — on-chain Meteora DLMM from backend-custodied agent wallet
app.use("/experiment/lp-agent-real", createLpAgentRealRouter());
// BTC onchain quant lab (paper sim + real cbBTC via Jupiter)
app.use("/experiment/btc-quant", createBtcQuantExperimentRouter());
app.use("/experiment/btc-quant-real", createBtcQuantRealRouter());
app.use("/experiment/btc3-macro", createBtc3MacroRouter());
// Stocks news experiment — paper xStocks trading via Jupiter + news signals
app.use("/experiment/stocks", createStocksExperimentRouter());
app.use("/post/studio", createShipLogStudioRouter());
// Analytics: KPI (/analytics/kpi, /analytics/errors) and x402 summary (/analytics/summary)
app.use("/analytics", await createAnalyticsRouter());

// Nansen x402 catalog (PAYER_KEYPAIR); mirrors /nansen/* paths used by agent tools
app.use("/nansen", await createNansenEndpointsRouter());
// TopLedger Solana DeFi intelligence (MPP upstream; mirrors /topledger/* agent tool paths)
app.use("/topledger", await createTopledgerEndpointsRouter());
// Binance: mount /binance/spot before /binance so /binance/spot/* and /binance/correlation resolve correctly
app.use("/binance/spot", await createBinanceSpotRouter());
app.use("/binance", await createBinanceCorrelationRouter());
app.use("/bankr", await createBankrRouter());
app.use("/giza", await createGizaRouter());
app.use("/neynar", await createNeynarRouter());
app.use("/siwa", await createSiwaRouter());

// 8004 Trustless Agent Registry (read-only: liveness, integrity, discovery, introspection)
app.use("/8004", await create8004Router());
// SAID Protocol agent identity (verification, trust, agent details)
app.use("/said", await createSaidRouter());
// Agent Internet Protocol (AIP) — did:aip identity + verification
app.use("/aip", await createAipRouter());
// AIP-02 A2A JSON-RPC 2.0 task server
app.use("/a2a", await createA2aRouter());
// X (Twitter) API proxy (x402) – user lookup, search recent, user tweets, feed. GET and POST supported.
app.use("/x", await createXApiRouter());

// Tempo payout rail: POST /payouts/tempo (API key required). Env: TEMPO_RPC_URL, TEMPO_PAYOUT_PRIVATE_KEY, TEMPO_PAYOUT_TOKEN.
app.use("/payouts", createTempoPayoutRouter());

// AgentScore buyer discovery (public metadata; pay via POST /agent/tools/call)
app.use("/agentscore", createAgentscoreRouter());

// Prediction Game API routes
app.use("/prediction-game", createPredictionGameRouter());

// Playground share: save/load request config by content-based slug (same request => same link)
app.use("/playground", await createPlaygroundShareRouter());
app.use("/streamflow-locks", await createStreamflowLocksRouter());
app.use("/staking", await createStakingAppRouter());

// MPP / AgentCash discovery — canonical OpenAPI (https://www.mppscan.com/discovery)
// OpenAPI 3.1 — gateway catalog (10+ ops: signal, preview, dashboard, x402 news/sentiment, brain, etc.)
app.get("/openapi.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(buildGatewayOpenApi());
});

// MPP / AgentCash discovery (was previously at /openapi.json)
app.get("/mpp-openapi.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(buildMppDiscoveryOpenApi());
});

// X402 Jobs verification
app.get("/.well-known/x402-verification.json", (req, res) => {
  res.json({ x402: "8ab3d1b3906d" });
});

// ShadowFeed provider discovery manifest (Step 9 onboarding)
// https://docs.shadowfeed.app/providers/onboarding#step-9--publish-your-discovery-manifest
app.get("/.well-known/shadowfeed-feeds.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
  res.json(buildShadowfeedFeedsManifest());
});

// AIP-01 Agent Card (https://aipagents.xyz)
app.get("/.well-known/agent.json", (_req, res) => {
  const wallet =
    getSyraAipWallet() ||
    process.env.SOLANA_PAYTO?.trim() ||
    process.env.PAYTO?.trim();
  if (!wallet) {
    return res.status(503).json({
      success: false,
      error: "AIP Agent Card unavailable",
      message: "Set SYRA_AIP_WALLET or run npm run register-aip",
    });
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
  res.json(buildSyraAipAgentCardDocument(wallet));
});

// Serve discovery document at /.well-known/x402 (x402scan compatible)
// Lists all x402 APIs (unversioned paths only).
const X402_BASE = "https://api.syraa.fun";
app.get("/.well-known/x402", async (req, res) => {
  // Collect ownership proofs for both EVM and Solana addresses
  const ownershipProofs = [];
  if (process.env.X402_OWNERSHIP_PROOF_EVM) {
    ownershipProofs.push(process.env.X402_OWNERSHIP_PROOF_EVM);
  }
  if (process.env.X402_OWNERSHIP_PROOF_SVM) {
    ownershipProofs.push(process.env.X402_OWNERSHIP_PROOF_SVM);
  }
  // Fallback to legacy single proof env var
  if (ownershipProofs.length === 0 && process.env.X402_OWNERSHIP_PROOF) {
    ownershipProofs.push(process.env.X402_OWNERSHIP_PROOF);
  }

  const resources = X402_DISCOVERY_RESOURCE_PATHS.map(
    (p) => `${X402_BASE}/${p}`,
  );

  let creatorSkillResources = [];
  let creatorSkillDetails = [];
  try {
    creatorSkillDetails = await getPublishedSkillDiscoveryResources();
    creatorSkillResources = creatorSkillDetails.map((s) => s.url);
  } catch {
    creatorSkillDetails = [];
    creatorSkillResources = [];
  }

  const resourceDetails = [
    ...X402_DISCOVERY_RESOURCE_PATHS.map((p) => {
      const meta = getResourceMeta(p);
      return {
        url: `${X402_BASE}/${p}`,
        name: getResourceName(p),
        description: getResourceDescription(p),
        price: meta?.suggestedPriceStx ?? null,
      };
    }),
    ...creatorSkillDetails.map((s) => ({
      url: s.url,
      name: s.name,
      description: s.description,
      price: s.price,
      category: s.category,
      creatorSkill: true,
      payToAddress: s.payToAddress,
    })),
  ];

  const b402Token = (process.env.B402_TOKEN || "USD1").trim();
  const paymentNetworkLines = [
    "- **Base Mainnet (EVM)**: `eip155:8453` - USDC payments",
    "- **Solana Mainnet (SVM)**: `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` - USDC payments",
  ];
  if (isB402Enabled()) {
    paymentNetworkLines.push(
      `- **BNB Smart Chain (B402)**: \`eip155:56\` - ${b402Token} payments via Binance OnchainPay`,
    );
  }
  if (isAlgorandEnabled()) {
    paymentNetworkLines.push(
      "- **Algorand Mainnet (AVM)**: `algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=` - USDC ASA (31566704) via GoPlausible facilitator",
    );
  }

  res.json({
    version: 1, // Discovery document version (not x402 protocol version)
    resources: [...resources, ...creatorSkillResources],
    resourceDetails,
    // IMPORTANT: Generate ownership proofs by running: node scripts/generateOwnershipProof.js
    // Sign "https://api.syraa.fun" with both EVM_PRIVATE_KEY and SVM_PRIVATE_KEY
    // Set X402_OWNERSHIP_PROOF_EVM and X402_OWNERSHIP_PROOF_SVM environment variables
    ownershipProofs: ownershipProofs,
    instructions: `# SYRA API Documentation

Visit https://docs.syraa.fun for full documentation.

## Supported Payment Networks

${paymentNetworkLines.join("\n")}

## Rate Limits (per IP)

- **Burst**: 25 requests / 10 seconds
- **Sustained**: 100 requests / 60 seconds
- Exceeding either limit returns HTTP 429 with a \`Retry-After\` header (seconds) and JSON body \`{ "success": false, "message": "Too many requests. Please slow down." }\`.
- x402 paid routes (the resources listed above) are gated by HTTP 402 instead and bypass this throttle.
- Machine-readable spec: \`x-ratelimit\` extension at the root of GET /openapi.json.

## Authentication

No API key required for the resources listed above — all are gated by the x402 protocol (HTTP 402). The free preview tier (\`/preview/*\`, \`/dashboard-summary\`, \`/binance-ticker\`, \`/health\`) is also publicly accessible.

## Support

- Documentation: https://docs.syraa.fun
- Twitter: @syraa_ai`,
  });
});

// Public x402 payment network status (no secrets) — verify Binance/B402 before playground testing.
app.get("/x402/capabilities", (_req, res) => {
  const b402 = getB402PublicStatus();
  const algorand = getAlgorandPublicStatus();
  const okx = getOkxX402PublicStatus();
  res.json({
    success: true,
    data: {
      networks: {
        solana: true,
        base: true,
        binance: b402.enabled,
        algorand: algorand.enabled,
        xlayer: okx.enabled,
      },
      b402,
      algorand,
      okx,
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

const PORT = process.env.PORT || 3000;

// Connect to MongoDB in background with retry (do not block server startup)
startMongooseConnectionLoop();
onMongooseConnected(() => {
  return Promise.all([
    import("./libs/lpExperimentService.js").then((m) =>
      m.ensureLpExperimentBootstrapped().catch(() => {}),
    ),
    import("./libs/lpRealService.js").then((m) =>
      m.ensureLpRealBootstrapped().catch(() => {}),
    ),
  ]);
});

// Eager-init x402 V2 PayAI bundle (default facilitator) so first paid request doesn't wait for /supported
import("./utils/x402ResourceServer.js").then(({ ensureX402ResourceServerInitialized }) => {
  ensureX402ResourceServerInitialized().catch(() => {});
});

app.listen(PORT, () => {
  startupInfo(`[syra-api] listening on port ${PORT}`);
  startMemoryHygiene();

  import("./libs/solanaServerRpc.js")
    .then(({ logSolanaRpcStartupProbe }) => logSolanaRpcStartupProbe())
    .catch((e) =>
      console.warn(
        "[solanaServerRpc] startup probe load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  const LP_AGENT_SIGNAL_INTERVAL_MS = 120_000;
  const LP_AGENT_RESOLVE_INTERVAL_MS = (() => {
    const raw = Number(process.env.LP_EXPERIMENT_RESOLVE_MS);
    return Number.isFinite(raw) && raw >= 5_000 ? Math.floor(raw) : 60_000;
  })();

  const runLpSignal = runIfMongoConnected(
    withSingleFlight(() =>
      import("./libs/lpExperimentService.js")
        .then(({ runLpExperimentSignalCycle }) => runLpExperimentSignalCycle())
        .then((out) => {
          if (out.errors?.length) {
            console.warn(
              "[LP experiment] signal errors:",
              out.errors.slice(0, 3),
            );
          }
        })
        .catch((err) =>
          console.warn("[LP experiment] signal failed:", err?.message || err),
        ),
    ),
  );

  const runLpResolve = runIfMongoConnected(
    withSingleFlight(() =>
      import("./libs/lpExperimentService.js")
        .then(({ resolveOpenLpRuns }) => resolveOpenLpRuns())
        .then((out) => {
          if (out.errors?.length) {
            console.warn(
              "[LP experiment] resolve errors:",
              out.errors.slice(0, 3),
            );
          }
        })
        .catch((err) =>
          console.warn("[LP experiment] resolve failed:", err?.message || err),
        ),
    ),
  );

  if (LP_AGENT_SIGNAL_INTERVAL_MS >= 60_000) {
    setInterval(runLpSignal, LP_AGENT_SIGNAL_INTERVAL_MS);
  }
  if (LP_AGENT_RESOLVE_INTERVAL_MS >= 5_000) {
    setInterval(runLpResolve, LP_AGENT_RESOLVE_INTERVAL_MS);
  }

  const STOCKS_SIGNAL_INTERVAL_MS = Number(
    process.env.STOCKS_EXPERIMENT_SIGNAL_MS || 300_000,
  );
  const STOCKS_RESOLVE_INTERVAL_MS = Number(
    process.env.STOCKS_EXPERIMENT_RESOLVE_MS || 60_000,
  );

  const runStocksSignal = runIfMongoConnected(
    withSingleFlight(() =>
      import("./libs/stocksExperimentService.js")
        .then(({ runStocksSignalCycle }) => runStocksSignalCycle())
        .then((out) => {
          if (out.errors?.length) {
            console.warn("[Stocks experiment] signal errors:", out.errors.slice(0, 3));
          }
        })
        .catch((err) =>
          console.warn("[Stocks experiment] signal failed:", err?.message || err),
        ),
    ),
  );

  const runStocksResolve = runIfMongoConnected(
    withSingleFlight(() =>
      import("./libs/stocksExperimentService.js")
        .then(({ resolveOpenStocksRuns }) => resolveOpenStocksRuns())
        .then((out) => {
          if (out.errors?.length) {
            console.warn("[Stocks experiment] resolve errors:", out.errors.slice(0, 3));
          }
        })
        .catch((err) =>
          console.warn("[Stocks experiment] resolve failed:", err?.message || err),
        ),
    ),
  );

  if (STOCKS_SIGNAL_INTERVAL_MS >= 60_000) {
    setInterval(runStocksSignal, STOCKS_SIGNAL_INTERVAL_MS);
  }
  if (STOCKS_RESOLVE_INTERVAL_MS >= 5_000) {
    setInterval(runStocksResolve, STOCKS_RESOLVE_INTERVAL_MS);
  }

  const LP_AGENT_REAL_SIGNAL_INTERVAL_MS = 120_000;
  const LP_AGENT_REAL_RESOLVE_INTERVAL_MS = 30_000;

  const runLpRealSignal = runIfMongoConnected(
    withSingleFlight(() =>
      import("./libs/lpRealService.js")
        .then(({ isRealCronEnabled, runLpRealSignalCycle }) => {
          if (!isRealCronEnabled()) return null;
          return runLpRealSignalCycle();
        })
        .then((out) => {
          if (out?.errors?.length) {
            console.warn("[LP real] signal errors:", out.errors.slice(0, 3));
          }
        })
        .catch((err) =>
          console.warn("[LP real] signal failed:", err?.message || err),
        ),
    ),
  );

  const runLpRealResolve = runIfMongoConnected(
    withSingleFlight(() =>
      import("./libs/lpRealService.js")
        .then(({ isRealCronEnabled, resolveLpRealPositions }) => {
          if (!isRealCronEnabled()) return null;
          return resolveLpRealPositions();
        })
        .then((out) => {
          if (out?.errors?.length) {
            console.warn("[LP real] resolve errors:", out.errors.slice(0, 3));
          }
        })
        .catch((err) =>
          console.warn("[LP real] resolve failed:", err?.message || err),
        ),
    ),
  );

  if (LP_AGENT_REAL_SIGNAL_INTERVAL_MS >= 60_000) {
    setInterval(runLpRealSignal, LP_AGENT_REAL_SIGNAL_INTERVAL_MS);
  }
  if (LP_AGENT_REAL_RESOLVE_INTERVAL_MS >= 5_000) {
    setInterval(runLpRealResolve, LP_AGENT_REAL_RESOLVE_INTERVAL_MS);
  }

  const bootLpRealCrons = runIfMongoConnected(() =>
    import("./libs/lpRealService.js")
      .then(
        ({
          isRealCronEnabled,
          runLpRealSignalCycle,
          resolveLpRealPositions,
        }) => {
          if (!isRealCronEnabled()) return null;
          startupVerbose("[LP real] boot signal+resolve tick");
          return Promise.all([
            runLpRealSignalCycle(),
            resolveLpRealPositions(),
          ]);
        },
      )
      .catch((err) =>
        console.warn("[LP real] boot tick failed:", err?.message || err),
      ),
  );
  setTimeout(bootLpRealCrons, 20_000);

  const BTC_QUANT_SIGNAL_INTERVAL_MS = 120_000;
  const BTC_QUANT_RESOLVE_INTERVAL_MS = 30_000;

  const runBtcQuantSignal = runIfMongoConnected(
    withSingleFlight(() =>
      import("./libs/btcQuantExperimentService.js")
        .then(({ runAllBtcQuantSignalCycles }) => runAllBtcQuantSignalCycles())
        .then((out) => {
          for (const [lane, result] of Object.entries(out.lanes ?? {})) {
            if (result.errors?.length) {
              console.warn(`[BTC quant ${lane}] signal errors:`, result.errors.slice(0, 3));
            }
          }
        })
        .catch((err) =>
          console.warn("[BTC quant] signal failed:", err?.message || err),
        ),
    ),
  );

  const runBtcQuantResolve = runIfMongoConnected(
    withSingleFlight(() =>
      import("./libs/btcQuantExperimentService.js")
        .then(({ resolveAllOpenBtcQuantRuns }) => resolveAllOpenBtcQuantRuns())
        .then((out) => {
          for (const [lane, result] of Object.entries(out.lanes ?? {})) {
            if (result.errors?.length) {
              console.warn(`[BTC quant ${lane}] resolve errors:`, result.errors.slice(0, 3));
            }
          }
        })
        .catch((err) =>
          console.warn("[BTC quant] resolve failed:", err?.message || err),
        ),
    ),
  );

  if (BTC_QUANT_SIGNAL_INTERVAL_MS >= 60_000) {
    setInterval(runBtcQuantSignal, BTC_QUANT_SIGNAL_INTERVAL_MS);
  }
  if (BTC_QUANT_RESOLVE_INTERVAL_MS >= 5_000) {
    setInterval(runBtcQuantResolve, BTC_QUANT_RESOLVE_INTERVAL_MS);
  }

  const runBtcQuantRealSignal = runIfMongoConnected(
    withSingleFlight(() =>
      import("./libs/btcQuantRealService.js")
        .then(({ isBtcQuantRealCronEnabled, runBtcQuantRealSignalCycle }) => {
          if (!isBtcQuantRealCronEnabled()) return null;
          return runBtcQuantRealSignalCycle();
        })
        .then((out) => {
          if (out?.error) {
            console.warn("[BTC quant real] signal:", out.error);
          }
        })
        .catch((err) =>
          console.warn("[BTC quant real] signal failed:", err?.message || err),
        ),
    ),
  );

  const runBtcQuantRealResolve = runIfMongoConnected(
    withSingleFlight(() =>
      import("./libs/btcQuantRealService.js")
        .then(({ isBtcQuantRealCronEnabled, resolveBtcQuantRealPositions }) => {
          if (!isBtcQuantRealCronEnabled()) return null;
          return resolveBtcQuantRealPositions();
        })
        .then((out) => {
          if (out?.errors?.length) {
            console.warn("[BTC quant real] resolve errors:", out.errors.slice(0, 3));
          }
        })
        .catch((err) =>
          console.warn("[BTC quant real] resolve failed:", err?.message || err),
        ),
    ),
  );

  if (BTC_QUANT_SIGNAL_INTERVAL_MS >= 60_000) {
    setInterval(runBtcQuantRealSignal, BTC_QUANT_SIGNAL_INTERVAL_MS);
  }
  if (BTC_QUANT_RESOLVE_INTERVAL_MS >= 5_000) {
    setInterval(runBtcQuantRealResolve, BTC_QUANT_RESOLVE_INTERVAL_MS);
  }

  import("./libs/btc3/macroIntelligenceScheduler.js").then(({ startBtc3MacroScheduler }) => {
    startBtc3MacroScheduler(withSingleFlight, runIfMongoConnected);
  });

  import("./libs/btcQuantExperimentEvolution.js")
    .then(({ btcQuantEvolutionConfigFromEnv, runAllBtcQuantEvolutions }) => {
      const evo = btcQuantEvolutionConfigFromEnv();
      if (!evo.enabled || evo.ms < 60_000) return;
      const tick = runIfMongoConnected(
        withSingleFlight(() =>
          runAllBtcQuantEvolutions({
            removeCount: evo.removeCount,
            minDecided: evo.minDecided,
            pinned: evo.pinned,
          })
            .then((out) => {
              for (const [lane, result] of Object.entries(out.lanes ?? {})) {
                if (!result.ok) continue;
                if (result.skipped) {
                  startupVerbose(`[BTC quant evolution ${lane}] skipped:`, result.skipped);
                  continue;
                }
                startupVerbose(
                  `[BTC quant evolution ${lane}]`,
                  "culled",
                  result.culled?.length ?? 0,
                  "spawned",
                  result.spawned?.length ?? 0,
                );
              }
            })
            .catch((err) =>
              console.warn("[BTC quant evolution failed]", err?.message || err),
            ),
        ),
      );
      setInterval(tick, evo.ms);
    })
    .catch(() => {});

  import("./libs/btcQuantExperimentEvolution.js")
    .then(({ btcQuantRealEvolutionConfigFromEnv, runBtcQuantRealEvolution }) => {
      const evo = btcQuantRealEvolutionConfigFromEnv();
      if (!evo.enabled || evo.ms < 60_000) return;
      const tick = runIfMongoConnected(
        withSingleFlight(() =>
          import("./libs/btcQuantRealService.js")
            .then(({ isBtcQuantRealCronEnabled }) => {
              if (!isBtcQuantRealCronEnabled()) return null;
              return runBtcQuantRealEvolution();
            })
            .then((out) => {
              if (!out || out.skipped) return;
              startupVerbose("[BTC quant real evolution]", out.summary || "completed");
            })
            .catch((err) => console.warn("[BTC quant real evolution failed]", err?.message || err)),
        ),
      );
      setInterval(tick, evo.ms);
    })
    .catch(() => {});

  import("./libs/btc3/btc3LearningService.js")
    .then(({ btc3LearningConfigFromEnv, runBtc3Learning }) => {
      const evo = btc3LearningConfigFromEnv();
      if (!evo.enabled || evo.ms < 60_000) return;
      const tick = runIfMongoConnected(
        withSingleFlight(() =>
          runBtc3Learning()
            .then((out) => {
              if (!out || out.skipped) return;
              startupVerbose("[BTC3 learning]", out.summary || "completed");
            })
            .catch((err) => console.warn("[BTC3 learning failed]", err?.message || err)),
        ),
      );
      setInterval(tick, evo.ms);
    })
    .catch(() => {});

  import("./libs/lpExperimentEvolution.js")
    .then(({ lpEvolutionConfigFromEnv, runLpExperimentEvolution }) => {
      const evo = lpEvolutionConfigFromEnv();
      if (!evo.enabled || evo.ms < 60_000) return;
      const tick = runIfMongoConnected(
        withSingleFlight(() =>
          runLpExperimentEvolution({
            removeCount: evo.removeCount,
            minDecided: evo.minDecided,
            dailySpawnCount: evo.dailySpawnCount,
            maxStrategies: evo.maxStrategies,
            pinned: evo.pinned,
          })
            .then((out) => {
              if (!out.ok) return;
              if (out.skipped) {
                startupVerbose("[LP experiment evolution] skipped:", out.skipped);
                return;
              }
              startupVerbose(
                "[LP experiment evolution]",
                "culled",
                out.culled?.length ?? 0,
                "spawned",
                out.spawned?.length ?? 0,
                "daily",
                out.dailySpawned?.length ?? 0,
              );
            })
            .catch((err) =>
              console.warn(
                "[LP experiment evolution failed]",
                err?.message || err,
              ),
            ),
        ),
      );
      setInterval(tick, evo.ms);
    })
    .catch(() => {});

  import("./libs/stocksExperimentEvolution.js")
    .then(({ stocksEvolutionConfigFromEnv, runStocksExperimentEvolution }) => {
      const evo = stocksEvolutionConfigFromEnv();
      if (!evo.enabled || evo.ms < 60_000) return;
      const tick = runIfMongoConnected(
        withSingleFlight(() =>
          runStocksExperimentEvolution()
            .then((out) => {
              if (out.skipped) {
                startupVerbose("[Stocks experiment evolution] skipped:", out.skipped);
                return;
              }
              startupVerbose(
                "[Stocks experiment evolution]",
                "culled",
                out.culled?.length ?? 0,
                "spawned",
                out.spawned?.length ?? 0,
              );
            })
            .catch((err) =>
              console.warn("[Stocks experiment evolution failed]", err?.message || err),
            ),
        ),
      );
      setInterval(tick, evo.ms);
    })
    .catch(() => {});

  import("./libs/lpRealEvolution.js")
    .then(({ lpRealEvolutionConfigFromEnv, runLpRealEvolution }) => {
      const evo = lpRealEvolutionConfigFromEnv();
      if (!evo.enabled || evo.ms < 60_000) return;
      const tick = runIfMongoConnected(
        withSingleFlight(() =>
          import("./libs/lpRealService.js")
            .then(({ isRealCronEnabled }) => {
              if (!isRealCronEnabled()) return null;
              return runLpRealEvolution();
            })
            .then((out) => {
              if (!out || out.skipped) return;
              startupVerbose("[LP real evolution]", out.summary || "completed");
            })
            .catch((err) => console.warn("[LP real evolution failed]", err?.message || err)),
        ),
      );
      setInterval(tick, evo.ms);
    })
    .catch(() => {});

  const testerSchedule = TESTER_AGENT_CONFIG.inProcessScheduleEnabled === true;
  const testerIntervalMs = testerSchedule
    ? TESTER_AGENT_CONFIG.scheduleIntervalMs
    : 0;
  if (testerSchedule && testerIntervalMs >= 60_000) {
    const runTesterAgentCron = withSingleFlight(async () => {
      try {
        const { runTesterAgentSuite, computeTesterAgentSuiteTimeoutMs } =
          await import("./libs/testerAgent/tests.js");
        const baseUrl = SYRA_PROBE_BASE_URL.replace(/\/+$/, "");
        const timeoutMs = computeTesterAgentSuiteTimeoutMs();
        const signal =
          typeof AbortSignal !== "undefined" &&
          typeof AbortSignal.timeout === "function"
            ? AbortSignal.timeout(timeoutMs)
            : undefined;
        const report = await runTesterAgentSuite(baseUrl, { signal });
        if (!report.success) {
          const bad = report.results?.find((r) => !r.ok);
          console.warn(
            "[tester-agent-schedule] first failure:",
            bad?.id,
            bad?.error || bad?.failedIds,
          );
        }
      } catch (e) {
        console.warn(
          "[tester-agent-schedule]",
          e instanceof Error ? e.message : e,
        );
      }
    });
    if (TESTER_AGENT_CONFIG.scheduleRunOnStart === true) {
      runTesterAgentCron();
    }
    setInterval(runTesterAgentCron, testerIntervalMs);
  }

  import("./libs/healthX402Monitor.js")
    .then(({ startHealthX402Monitor }) => {
      startHealthX402Monitor();
    })
    .catch((e) =>
      console.warn(
        "[health-x402-monitor] load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/syraTrendScoutScheduler.js")
    .then(({ startSyraTrendScoutScheduler }) => {
      startSyraTrendScoutScheduler();
    })
    .catch((e) =>
      console.warn(
        "[syra-trend-scout] load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/s3labs/s3labsScheduler.js")
    .then(({ startS3labsAgentsScheduler }) => {
      startS3labsAgentsScheduler();
    })
    .catch((e) =>
      console.warn(
        "[s3labs-agents] load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/s3labs/s3labsJobScheduler.js")
    .then(({ startS3labsJobScheduler }) => {
      startS3labsJobScheduler();
    })
    .catch((e) =>
      console.warn(
        "[s3labs-job] load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/s3labs/s3labsTelegramBootstrap.js")
    .then(({ startS3labsTelegramQa }) => startS3labsTelegramQa())
    .catch((e) =>
      console.warn(
        "[s3labs-telegram-qa] load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/syraPartnershipScoutScheduler.js")
    .then(({ startSyraPartnershipScoutScheduler }) => {
      startSyraPartnershipScoutScheduler();
    })
    .catch((e) =>
      console.warn(
        "[syra-partnership-scout] load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/syraGrowthScoutScheduler.js")
    .then(({ startSyraGrowthScoutScheduler }) => {
      startSyraGrowthScoutScheduler();
    })
    .catch((e) =>
      console.warn(
        "[syra-growth-scout] load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/hackathon/hackathonScoutScheduler.js")
    .then(({ startHackathonScoutScheduler }) => {
      startHackathonScoutScheduler();
    })
    .catch((e) =>
      console.warn(
        "[hackathon-scout] load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/events/eventScoutScheduler.js")
    .then(({ startEventScoutScheduler }) => {
      startEventScoutScheduler();
    })
    .catch((e) =>
      console.warn(
        "[event-scout] load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/binanceKlineWsBuffer.js")
    .then(({ prewarmBinanceKlineWsBuffers }) => {
      prewarmBinanceKlineWsBuffers();
    })
    .catch((e) =>
      console.warn(
        "[binance-kline-ws] prewarm load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/sentimentDailyPipeline.js")
    .then(({ startSentimentDailyScheduler }) => {
      startSentimentDailyScheduler();
    })
    .catch((e) =>
      console.warn(
        "[internal-news] sentiment scheduler load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/kolDailyScheduler.js")
    .then(({ startKolDailyScheduler }) => {
      startKolDailyScheduler();
    })
    .catch((e) =>
      console.warn(
        "[kol] daily scheduler load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/btcIntelligenceScheduler.js")
    .then(({ startBtcIntelligenceScheduler }) => {
      startBtcIntelligenceScheduler();
    })
    .catch((e) =>
      console.warn(
        "[btc-intelligence] scheduler load failed:",
        e instanceof Error ? e.message : e,
      ),
    );

  import("./libs/payshClient.js")
    .then(({ startPayshCatalogAutoRefresh }) => {
      startPayshCatalogAutoRefresh();
    })
    .catch((e) =>
      console.warn(
        "[paysh] auto-refresh load failed:",
        e instanceof Error ? e.message : e,
      ),
    );
});
