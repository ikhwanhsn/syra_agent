import cors from "cors";
import express from "express";
import rateLimit from "./utils/rateLimit.js";
import { securityHeaders } from "./utils/security.js";
import { requireApiKey } from "./utils/apiKeyAuth.js";
import { injectTrustedOriginApiKey } from "./utils/trustedOriginAuth.js";
import path from "path";
import { fileURLToPath } from "url";
import {
  createPublicSignalApiRouter,
  createSignalRouterRegular,
} from "./routes/signal.js";
import { createCheckStatusAgentRouter } from "./agents/check-status.js";
import { createOpenRouterChatRouter } from "./routes/openrouterChat.js";
import { createAgentChatRouter } from "./routes/agent/chat.js";
import { createAgentChartRouter } from "./routes/agent/chart.js";
import { createAgentPumpfunCoinRouter } from "./routes/agent/pumpfunCoin.js";
import { createAgentWalletRouter } from "./routes/agent/wallet.js";
import { createAgentToolsRouter } from "./routes/agent/tools.js";
import { createAgentMarketplaceRouter } from "./routes/agent/marketplace.js";
import { createAgentLeaderboardRouter } from "./routes/agent/leaderboard.js";
import { createUserPromptsRouter } from "./routes/agent/userPrompts.js";
import { createInfoRouter } from "./routes/info.js";
import { createSolanaAgentRouter } from "./agents/solana-agent.js";
import { createAgentSignalRouter } from "./agents/create-signal.js";
import { createLeaderboardRouter } from "./routes/leaderboard.js";
import { createAnalyticsRouter } from "./routes/analytics.js";
import { createInternalResearchRouter } from "./routes/internalResearch.js";
import { createInternalTesterAgentRouter } from "./routes/internalTesterAgent.js";
import { TESTER_AGENT_CONFIG } from "./libs/testerAgent/testerAgentConfig.js";
import { createInternalArenaWorkerRouter } from "./routes/internalArenaWorker.js";
import { isArenaPaused } from "./scripts/devfun-arena/arenaPause.mjs";
import { createTradingExperimentRouter } from "./routes/tradingExperiment.js";
import { createSentinelDashboardRouter } from "./routes/sentinelDashboard.js";
import { createDashboardSummaryRouterRegular } from "./routes/dashboardSummary.js";
import { createXApiRouter } from "./routes/partner/x-api/index.js";
import { createBinanceTickerPriceRouter } from "./routes/partner/binance/ticker-price.js";
// x402 route imports (consolidated from v2 into routes)
import {
  createCryptonewsRouter,
  createNewsRouterRegular,
  createSentimentRouterRegular,
} from "./routes/partner/cryptonews.js";
import { createSignalRouter as createV2SignalRouter } from "./routes/signal.js";
import { createExaSearchRouter as createV2ExaSearchRouter } from "./routes/exa-search.js";
import { createCrawlRouter } from "./routes/crawl.js";
import { createBrowserUseRouter } from "./routes/browserUse.js";
import { createCheckStatusRouter as createV2CheckStatusRouter } from "./routes/check-status.js";
import { createMppV1Router } from "./routes/mpp/v1.js";
import { createSmartMoneyRouter as createV2SmartMoneyRouter } from "./routes/partner/nansen/smart-money.js";
import { createTokenGodModeRouter as createV2TokenGodModeRouter } from "./routes/partner/nansen/token-god-mode.js";
import { createTrendingJupiterRouter as createV2TrendingJupiterRouter } from "./routes/partner/jupiter/trending.js";
import { createJupiterSwapOrderRouter as createV2JupiterSwapOrderRouter } from "./routes/partner/jupiter/swap-order.js";
import { createPumpFunRouter } from "./routes/partner/pumpfun/index.js";
import { createSquidRouteRouter as createV2SquidRouteRouter } from "./routes/partner/squid/route.js";
import { createSquidStatusRouter as createV2SquidStatusRouter } from "./routes/partner/squid/status.js";
import { getSentinelFetch, SentinelBudgetError } from "./libs/sentinelFetch.js";
import { createBubblemapsMapsRouter as createV2BubblemapsMapsRouter } from "./routes/partner/bubblemaps/maps.js";
import { createNansenEndpointsRouter } from "./routes/partner/nansen/nansenEndpoints.js";
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
import { createPredictionGameRouter } from "./routes/prediction-game/index.js";
import { create8004Router } from "./routes/8004.js";
import { create8004scanRouter } from "./routes/partner/8004scan/index.js";
import { createHeyLolRouter } from "./routes/heylol.js";
import { createBrainRouter } from "./routes/brain.js";
import { createQuicknodeRouter } from "./routes/partner/quicknode/index.js";
import { createPlaygroundShareRouter } from "./routes/playgroundShare.js";
import { createStreamflowLocksRouter } from "./routes/streamflowLocks.js";
import { createStakingAppRouter } from "./routes/stakingApp.js";
import { createTempoPayoutRouter } from "./routes/payouts/tempo.js";
import { getV2Payment } from "./utils/getV2Payment.js";
import { sendTempoPayout } from "./libs/tempoPayout.js";
import connectMongoose from "./config/mongoose.js";
import { buildMppDiscoveryOpenApi } from "./libs/mppDiscoveryOpenApi.js";
import { buildGatewayOpenApi } from "./libs/gatewayOpenApi.js";
import { X402_DISCOVERY_RESOURCE_PATHS } from "./config/x402DiscoveryResourcePaths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load api/.env first (so SOLANA_RPC_URL etc. are set even when run from monorepo root)
dotenv.config({ path: path.resolve(__dirname, ".env") });

// x402 Payment Configuration
// NOTE: Individual routes use requirePayment() from utils/x402Payment.js
// which handles V1-compatible payment verification and 402 responses.
// See utils/x402Payment.js for configuration details.

const app = express();
const { requirePayment: requirePaymentV2, settlePaymentAndSetResponse } = await getV2Payment();

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
  "https://api.syraa.fun",
  "https://syraa.fun",
  "https://www.syraa.fun",
  "https://agent.syraa.fun",
  "https://www.agent.syraa.fun",
  "https://dashboard.syraa.fun",
  "https://www.dashboard.syraa.fun",
  "https://playground.syraa.fun",
  "https://www.playground.syraa.fun",
  "https://dev-landing-syra.vercel.app",
  "https://dev-dashboard-syra.vercel.app",
  "https://dev-playground-syra.vercel.app",
  "https://dev-ai-agent-syra.vercel.app",
  "https://predict.syraa.fun",
  "https://www.predict.syraa.fun",
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
  ],
};
const CORS_OPTIONS_REGULAR = {
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. same-origin, Postman, server-side)
    if (!origin) return cb(null, true);
    const normalized = origin.replace(/\/$/, ""); // strip trailing slash
    if (CORS_ALLOWED_ORIGINS_SET.has(origin) || CORS_ALLOWED_ORIGINS_SET.has(normalized)) return cb(null, true);
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
  if (p.startsWith("/exa-search")) return true;
  if (p.startsWith("/crawl")) return true;
  if (p.startsWith("/browser-use")) return true;
  if (p.startsWith("/check-status") && !p.startsWith("/check-status-agent")) return true;
  if (p.startsWith("/mpp/v1")) return true;
  if (p.startsWith("/smart-money")) return true;
  if (p.startsWith("/token-god-mode")) return true;
  if (p.startsWith("/solana-agent")) return true;
  if (p.startsWith("/trending-jupiter")) return true;
  if (p.startsWith("/jupiter")) return true;
  if (p.startsWith("/pumpfun")) return true;
  if (p.startsWith("/squid")) return true;
  if (p.startsWith("/analytics/summary")) return true;
  if (p.startsWith("/sentiment")) return true;
  if (p.startsWith("/event")) return true;
  if (p.startsWith("/trending-headline")) return true;
  if (p.startsWith("/sundown-digest")) return true;
  if (p.startsWith("/bubblemaps")) return true;
  if (p.startsWith("/8004")) return true;
  if (p.startsWith("/8004scan")) return true;
  if (p.startsWith("/heylol")) return true;
  if (p.startsWith("/brain")) return true;
  if (p.startsWith("/quicknode")) return true;
  if (p.startsWith("/erc8004")) return true;
  if (p.startsWith("/nansen")) return true;
  if (p.startsWith("/binance")) return true;
  if (p.startsWith("/bankr")) return true;
  if (p.startsWith("/giza")) return true;
  if (p.startsWith("/neynar")) return true;
  if (p.startsWith("/siwa")) return true;
  if (p === "/x" || p.startsWith("/x/")) return true;
  return false;
}

/** Agent routes (ai-agent website) need permissive CORS so the frontend can call from any origin (e.g. localhost:5173). */
function isAgentRoute(p) {
  return p && (p === "/agent" || p.startsWith("/agent/"));
}

/** hey.lol proxy routes — permissive CORS for frontend/agent callers. */
function isHeyLolRoute(p) {
  return p && (p === "/heylol" || p.startsWith("/heylol/"));
}

/** Playground proxy: allows api-playground (playground.syraa.fun) to call other x402 APIs without CORS issues. */
function isPlaygroundProxyRoute(p) {
  return p === "/api/playground-proxy";
}

/** Public non-x402 signal API — permissive CORS for proxies and third-party clients. */
function isPublicSignalApiRoute(p) {
  return p === "/api/signal" || p.startsWith("/api/signal/");
}

/** Preview/landing routes (no v1/regular): allow any origin for dev/staging landings. */
function isPreviewRoute(p) {
  if (!p) return false;
  if (p.startsWith("/preview")) return true;
  if (p.startsWith("/dashboard-summary")) return true;
  if (p.startsWith("/binance-ticker")) return true;
  if (p.startsWith("/streamflow-locks")) return true;
  if (p.startsWith("/staking")) return true;
  return false;
}

app.use((req, res, next) => {
  const options =
    isX402Route(req.path) ||
    isAgentRoute(req.path) ||
    isHeyLolRoute(req.path) ||
    isPlaygroundProxyRoute(req.path) ||
    isPublicSignalApiRoute(req.path) ||
    isPreviewRoute(req.path)
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
  if (!methodMatch || String(methodMatch[1]).toLowerCase() !== "tempo") return null;
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

// Playground proxy must parse large bodies (payment headers can be 50kb+). Register before global json so this route gets 2mb limit.
app.post(
  "/api/playground-proxy",
  express.json({ limit: "2mb" }),
  async (req, res) => {
    const { url: targetUrl, method = "GET", body: forwardBody, headers: forwardHeaders = {} } = req.body || {};
    if (!targetUrl || typeof targetUrl !== "string") {
      res.status(400).json({ error: "Missing or invalid url in body" });
      return;
    }
    const allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"];
    const forwardMethod = (method || "GET").toUpperCase();
    if (!allowedMethods.includes(forwardMethod)) {
      res.status(400).json({ error: `Method ${forwardMethod} not allowed. Supported: ${allowedMethods.join(", ")}` });
      return;
    }
    const sentinelFetch = getSentinelFetch("playground");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PLAYGROUND_PROXY_TIMEOUT_MS);
    try {
      const fetchOpts = {
        method: forwardMethod,
        headers: { ...forwardHeaders },
        signal: controller.signal,
      };
      if (forwardBody != null && forwardBody !== "" && forwardMethod !== "GET" && forwardMethod !== "HEAD") {
        fetchOpts.body = typeof forwardBody === "string" ? forwardBody : JSON.stringify(forwardBody);
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
        getHeaderCaseInsensitive(forwardedHeaders, "www-authenticate")
      );
      if (proxyRes.status === 402 && isMppPath && tempoChallenge) {
        const relayPrice = tempoChallenge.amountUsd.toFixed(6);
        const paid = await requireProxyPayment(req, res, {
          price: relayPrice,
          method: forwardMethod,
          discoverable: false,
          resource: "/api/playground-proxy",
          description: "MPP Tempo relay payment (user pays with x402; server settles Tempo challenge)",
          inputSchema: {
            bodyType: "json",
            bodyFields: {
              url: { type: "string", required: true, description: "Target URL" },
              method: { type: "string", required: false, description: "HTTP method" },
              body: { type: "object", required: false, description: "Request body" },
            },
          },
        });
        if (!paid) return;

        const memo = tempoChallenge.id ? tempoChallenge.id.slice(0, 32) : undefined;
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
            message: payout.error || "Could not settle Tempo challenge from server wallet.",
          });
          return;
        }

        const retryRes = await sentinelFetch(targetUrl, fetchOpts);
        const retryText = await retryRes.text();
        const skipHeaders = ["content-encoding", "transfer-encoding", "content-length", "connection"];
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
      const skipHeaders = ["content-encoding", "transfer-encoding", "content-length", "connection"];
      proxyRes.headers.forEach((value, key) => {
        if (!skipHeaders.includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      res.status(proxyRes.status).send(responseText);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err && (err.name === "SentinelBudgetError" || err instanceof SentinelBudgetError)) {
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
        message: isTimeout ? "The request to the target API timed out." : (err.message || String(err)),
        hint: isTimeout
          ? "The target API took too long to respond. It may be slow or blocking server-side requests."
          : "The target API may be unreachable from our server (e.g. blocking our IP, firewall, or down).",
      });
    }
  }
);

app.use(express.json({ limit: "200kb" })); // Prevent large-payload DoS
app.use(express.static(path.join(__dirname, "public")));

// Request insight tracking (volume, errors, latency) for dashboard – fire-and-forget on response finish
app.use((req, res, next) => {
  const start = Date.now();
  const skip = req.path === "/" || req.path === "/favicon.ico";
  res.once("finish", () => {
    if (skip) return;
    const durationMs = Date.now() - start;
    import("./utils/recordApiRequest.js").then(({ recordApiRequest }) =>
      recordApiRequest(req, res, durationMs, {
        paid: req._requestInsightPaid === true,
      })
    ).catch(() => {});
  });
  next();
});

// Favicon explicit route (important for bots)
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "favicon.ico"));
});

// Rate limit all non-x402 routes (preview, dashboard-summary, x, agent, playground, analytics, prediction-game) to prevent spam, DDoS, abuse
// Strict dual-window: burst 25/10s + sustained 100/min. Only x402 (paid) routes skip.
app.use(
  rateLimit({
    strict: true,
    burstWindowMs: 10 * 1000,
    burstMax: 25,
    windowMs: 60 * 1000,
    max: 100,
    skip: (req) => isX402Route(req.path) || (req.path || "").startsWith("/internal/tester-agent"),
  }),
);

// For requests from trusted browser origins (syraa.fun, dashboard, agent, playground), inject
// server API key so frontends never need to embed it in client bundles (security fix).
app.use(injectTrustedOriginApiKey);

// API key / Bearer auth when API_KEY or API_KEYS is set in env.
// Skip auth for x402 routes and public paths. /8004 is protected by API key (same as other non-x402 APIs).
app.use(
  requireApiKey(
    (req) => {
      const p = req.path || "";
      if (p.startsWith("/internal/tester-agent")) {
        const secret = (process.env.TESTER_AGENT_CRON_SECRET || "").trim();
        if (secret) {
          const got = (req.get("x-tester-agent-cron-secret") || "").trim();
          if (got === secret) return true;
        }
      }
      return (
        isX402Route(p) ||
        p === "/" ||
        p === "/favicon.ico" ||
        p.startsWith("/og") ||
        p.startsWith("/info") ||
        p.startsWith("/playground") ||
        p.startsWith("/prediction-game") ||
        p.startsWith("/streamflow-locks") ||
        p.startsWith("/staking")
      );
    },
  ),
);

// ZAuth x402 monitoring (before x402 routes) – telemetry & optional validation/refunds via zauthx402.com
// Default SDK: telemetry.sampleRate=1 and includeResponseBody=true — wraps res.json/send/end and runs validation
// on every response (adds CPU before bytes leave the process). Tune with:
//   ZAUTH_TELEMETRY_SAMPLE_RATE=0.25  (only 25% of requests instrumented; others skip middleware entirely)
//   ZAUTH_TELEMETRY_INCLUDE_RESPONSE_BODY=false  (skip serializing response bodies into telemetry)
const ZAUTH_API_KEY = (process.env.ZAUTH_API_KEY || "").trim();
if (ZAUTH_API_KEY) {
  const zauthSampleRaw = (process.env.ZAUTH_TELEMETRY_SAMPLE_RATE || "").trim();
  const zauthSample = zauthSampleRaw === "" ? null : Number.parseFloat(zauthSampleRaw);
  const zauthRespBody =
    String(process.env.ZAUTH_TELEMETRY_INCLUDE_RESPONSE_BODY || "").toLowerCase() === "false" ||
    String(process.env.ZAUTH_TELEMETRY_INCLUDE_RESPONSE_BODY || "") === "0";
  const zauthTelemetry =
    (zauthSample != null && Number.isFinite(zauthSample) && zauthSample >= 0 && zauthSample <= 1) || zauthRespBody
      ? {
          telemetry: {
            ...(zauthSample != null && Number.isFinite(zauthSample) && zauthSample >= 0 && zauthSample <= 1
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
│  🤖 24/7 Automated Trading       → AI agent never sleeps, always alert      │
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
║         "The Market Never Sleeps. Neither Does Your AI Trading Agent."       ║
║                                                                              ║
║              © 2025 SYRA AI Labs. All Rights Reserved.                       ║
║         Documentation & API Access • https://docs.syraa.fun                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

  // Get the full domain from the request
  const protocol = req.protocol; // http or https
  const host = req.get("host"); // domain + port
  const ogImageUrl = `${protocol}://${host}/og.png`;

  res.setHeader("Content-Type", "text/html");

  return res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <!-- OG Metadata -->
      <meta property="og:title" content="Syra API Gateway" />
      <meta property="og:description" content="The First x402-Native AI Agent Trading Assistant on Solana" />
      <meta property="og:image" content="${ogImageUrl}" />
      <meta property="og:type" content="website" />

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
app.use("/", await createCryptonewsRouter());

// Preview/landing routes (no x402) – dashboard-summary, binance-ticker, preview/news|sentiment|signal
app.use("/preview/news", await createNewsRouterRegular());
app.use("/preview/sentiment", await createSentimentRouterRegular());
app.use("/preview/signal", await createSignalRouterRegular());
app.use("/dashboard-summary", await createDashboardSummaryRouterRegular());
app.use("/binance-ticker", await createBinanceTickerPriceRouter());
// Legacy /v1 → 410
app.use("/v1", (req, res) => {
  res.status(410).json({
    success: false,
    error: "v1 API is no longer available. Use /dashboard-summary, /preview/* (free) or x402 paths (e.g. /x, /news, /signal).",
    migration: "https://api.syraa.fun",
    docs: "https://docs.syraa.fun",
  });
});

// x402 routes (unversioned; CAIP-2, PAYMENT-SIGNATURE header)
app.use("/api/signal", await createPublicSignalApiRouter());
app.use("/signal", await createV2SignalRouter());
app.use("/exa-search", await createV2ExaSearchRouter());
app.use("/crawl", await createCrawlRouter());
app.use("/browser-use", await createBrowserUseRouter());
app.use("/check-status", await createV2CheckStatusRouter());
app.use("/mpp/v1", await createMppV1Router());
app.use("/check-status-agent", await createCheckStatusAgentRouter());
app.use("/brain", await createBrainRouter());
app.use("/smart-money", await createV2SmartMoneyRouter());
app.use("/openrouter", await createOpenRouterChatRouter());
// Agent chat: completion, generate-description, generate-agent-image (Xona), share, CRUD
app.use("/agent/chat", await createAgentChatRouter());
app.use("/agent/chart", createAgentChartRouter());
app.use("/agent/pumpfun", createAgentPumpfunCoinRouter());
app.use("/agent/wallet", await createAgentWalletRouter());
app.use("/agent/tools", await createAgentToolsRouter());
app.use("/agent/marketplace/prompts", await createUserPromptsRouter());
app.use("/agent/marketplace", await createAgentMarketplaceRouter());
app.use("/agent/leaderboard", await createAgentLeaderboardRouter());
app.use("/token-god-mode", await createV2TokenGodModeRouter());
app.use("/solana-agent", await createSolanaAgentRouter());
app.use("/trending-jupiter", await createV2TrendingJupiterRouter());
app.use("/jupiter/swap/order", await createV2JupiterSwapOrderRouter());
app.use("/pumpfun", await createPumpFunRouter());
app.use("/squid/route", await createV2SquidRouteRouter());
app.use("/squid/status", await createV2SquidStatusRouter());
app.use("/create-signal", await createAgentSignalRouter());
app.use("/leaderboard", await createLeaderboardRouter());
// Sentinel Dashboard: spend, agents, alerts (API key auth); same storage as wrapWithSentinel
app.use("/internal/sentinel", await createSentinelDashboardRouter());
// Tester agent (cron smoke); mount before /internal so paths are not swallowed by research router
app.use("/internal/tester-agent", createInternalTesterAgentRouter());
// Internal dashboard: research-store, research-resume (API key auth, no x402)
app.use("/internal", await createInternalResearchRouter());
// DevFun arena: optional in-process schedule (ARENA_SCHEDULE_TICKS) + POST /tick with ARENA_CRON_SECRET
app.use("/internal/arena-worker", createInternalArenaWorkerRouter());
// Trading agent experiment lab (API key auth, no x402; optional cron secret on POST run-cycle)
app.use("/experiment/trading-agent", createTradingExperimentRouter());
// Analytics: KPI (/analytics/kpi, /analytics/errors) and x402 summary (/analytics/summary)
app.use("/analytics", await createAnalyticsRouter());
app.use("/bubblemaps/maps", await createV2BubblemapsMapsRouter());

// Nansen x402 catalog (PAYER_KEYPAIR); mirrors /nansen/* paths used by agent tools
app.use("/nansen", await createNansenEndpointsRouter());
// Binance: mount /binance/spot before /binance so /binance/spot/* and /binance/correlation resolve correctly
app.use("/binance/spot", await createBinanceSpotRouter());
app.use("/binance", await createBinanceCorrelationRouter());
app.use("/bankr", await createBankrRouter());
app.use("/giza", await createGizaRouter());
app.use("/neynar", await createNeynarRouter());
app.use("/siwa", await createSiwaRouter());

// 8004 Trustless Agent Registry (read-only: liveness, integrity, discovery, introspection)
app.use("/8004", await create8004Router());
// 8004scan.io Public API proxy (x402) – agents, stats, search, feedbacks, chains
app.use("/8004scan", await create8004scanRouter());

// hey.lol agent API proxy (x402) – profile, posts, feed, DMs, services, token. Use HEYLOL_SOLANA_PRIVATE_KEY or anonymousId.
app.use("/heylol", await createHeyLolRouter());
// Quicknode RPC proxy (x402) – balance, transaction status, raw JSON-RPC. Set QUICKNODE_SOLANA_RPC_URL / QUICKNODE_BASE_RPC_URL.
app.use("/quicknode", await createQuicknodeRouter());
// ERC-8004 alias → canonical /8004scan (308 permanent redirect)
app.use("/erc8004", (req, res) => {
  const suffix = req.path === "/" ? "" : req.path;
  res.redirect(308, `/8004scan${suffix}`);
});
// X (Twitter) API proxy (x402) – user lookup, search recent, user tweets, feed. GET and POST supported.
app.use("/x", await createXApiRouter());

// Tempo payout rail: POST /payouts/tempo (API key required). Env: TEMPO_RPC_URL, TEMPO_PAYOUT_PRIVATE_KEY, TEMPO_PAYOUT_TOKEN.
app.use("/payouts", createTempoPayoutRouter());

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

// Serve discovery document at /.well-known/x402 (x402scan compatible)
// Lists all x402 APIs (unversioned paths only).
const X402_BASE = "https://api.syraa.fun";
app.get("/.well-known/x402", (req, res) => {
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

  const resources = X402_DISCOVERY_RESOURCE_PATHS.map((p) => `${X402_BASE}/${p}`);

  res.json({
    version: 1, // Discovery document version (not x402 protocol version)
    resources,
    // IMPORTANT: Generate ownership proofs by running: node scripts/generateOwnershipProof.js
    // Sign "https://api.syraa.fun" with both EVM_PRIVATE_KEY and SVM_PRIVATE_KEY
    // Set X402_OWNERSHIP_PROOF_EVM and X402_OWNERSHIP_PROOF_SVM environment variables
    ownershipProofs: ownershipProofs,
    instructions: `# SYRA API Documentation

Visit https://docs.syraa.fun for full documentation.

## Supported Payment Networks

- **Base Mainnet (EVM)**: \`eip155:8453\` - USDC payments
- **Solana Mainnet (SVM)**: \`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp\` - USDC payments

## Rate Limits

- 1000 requests/hour per IP
- Rate limits apply across all endpoints

## Authentication

No API key required. All endpoints use x402 protocol (HTTP 402) for payment.

## Support

- Documentation: https://docs.syraa.fun
- Twitter: @syraa_ai`,
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

// Connect to MongoDB (Mongoose) for prediction game
connectMongoose().then(() => {}).catch(() => {});

// Eager-init x402 V2 Corbits bundle (default facilitator) so first paid request doesn't wait for /supported
import("./utils/x402ResourceServer.js").then(({ ensureX402CorbitsResourceServerInitialized }) => {
  ensureX402CorbitsResourceServerInitialized().catch(() => {});
});

app.listen(PORT, () => {
  const legacyMs = Number(process.env.TRADING_EXPERIMENT_CRON_MS || 0);
  const signalMs = Number(process.env.TRADING_EXPERIMENT_SIGNAL_CRON_MS || 0);
  const validateMs = Number(process.env.TRADING_EXPERIMENT_VALIDATE_CRON_MS || 0);

  const runValidate = () =>
    import("./libs/tradingExperimentService.js")
      .then(({ resolveOpenExperimentRunsIncremental1m }) => resolveOpenExperimentRunsIncremental1m())
      .then((out) => {
        if (out.errors?.length) {
          console.warn("[Trading experiment] validate errors:", out.errors.slice(0, 3));
        }
      })
      .catch((err) => console.warn("[Trading experiment] validate failed:", err?.message || err));

  const runSignal = () =>
    Promise.all([
      import("./libs/tradingExperimentService.js").then(({ runAllExperimentSignalCycles }) =>
        runAllExperimentSignalCycles(),
      ),
      import("./libs/userCustomStrategyService.js").then(({ runUserCustomSignalCycle }) =>
        runUserCustomSignalCycle(),
      ),
    ])
      .then(([out, userOut]) => {
        if (out.errors?.length) {
          console.warn("[Trading experiment] signal errors:", out.errors.slice(0, 3));
        }
        if (userOut.errors?.length) {
          console.warn("[Trading experiment] user custom signal errors:", userOut.errors.slice(0, 3));
        }
      })
      .catch((err) => console.warn("[Trading experiment] signal failed:", err?.message || err));

  const runFull = () =>
    import("./libs/tradingExperimentService.js")
      .then(({ runFullExperimentCycle }) => runFullExperimentCycle())
      .then((out) => {
        if (out.errors?.length) {
          console.warn("[Trading experiment] cycle errors:", out.errors.slice(0, 5));
        }
      })
      .catch((err) => console.warn("[Trading experiment] cycle failed:", err?.message || err));

  if (validateMs >= 1_000) {
    setInterval(runValidate, validateMs);
  }
  if (signalMs >= 60_000) {
    setInterval(runSignal, signalMs);
  }
  if (legacyMs >= 60_000 && validateMs < 1_000 && signalMs < 60_000) {
    setInterval(runFull, legacyMs);
  }

  const scheduleArenaTicks =
    process.env.ARENA_SCHEDULE_TICKS === "1" ||
    process.env.ARENA_SCHEDULE_TICKS === "true";
  const rawArenaMs = process.env.ARENA_TICK_INTERVAL_MS;
  const arenaIntervalMs = scheduleArenaTicks
    ? rawArenaMs != null && String(rawArenaMs).trim() !== ""
      ? Number(rawArenaMs)
      : 600_000
    : 0;

  if (scheduleArenaTicks && !isArenaPaused() && arenaIntervalMs >= 60_000) {
    import("./scripts/devfun-arena/arenaTickRunner.mjs").then(({ startArenaWorkerInterval }) => {
      startArenaWorkerInterval({ intervalMs: arenaIntervalMs, runImmediately: false });
    });
  }

  const testerSchedule = TESTER_AGENT_CONFIG.inProcessScheduleEnabled === true;
  const testerIntervalMs = testerSchedule ? TESTER_AGENT_CONFIG.scheduleIntervalMs : 0;
  if (testerSchedule && testerIntervalMs >= 60_000) {
    const runTesterAgentCron = async () => {
      try {
        const { runTesterAgentSuite, computeTesterAgentSuiteTimeoutMs } = await import(
          "./libs/testerAgent/tests.js"
        );
        const baseUrl = (process.env.BASE_URL || "").trim().replace(/\/+$/, "");
        if (!baseUrl) {
          console.warn("[tester-agent-schedule] skipped: set BASE_URL");
          return;
        }
        const timeoutMs = computeTesterAgentSuiteTimeoutMs();
        const signal =
          typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
            ? AbortSignal.timeout(timeoutMs)
            : undefined;
        const report = await runTesterAgentSuite(baseUrl, { signal });
        if (!report.success) {
          const bad = report.results?.find((r) => !r.ok);
          console.warn("[tester-agent-schedule] first failure:", bad?.id, bad?.error || bad?.failedIds);
        }
      } catch (e) {
        console.warn("[tester-agent-schedule]", e instanceof Error ? e.message : e);
      }
    };
    if (TESTER_AGENT_CONFIG.scheduleRunOnStart === true) {
      runTesterAgentCron();
    }
    setInterval(runTesterAgentCron, testerIntervalMs);
  }
});
