import cors from "cors";
import express from "express";
import rateLimit from "./utils/rateLimit.js";
import path from "path";
import { fileURLToPath } from "url";
import { createNewsRouter, createNewsRouterRegular } from "./routes/news.js";
import { createSignalRouter, createSignalRouterRegular } from "./routes/signal.js";
import { createXSearchRouter } from "./routes/xSearch.js";
import { createXKOLRouter } from "./routes/kol.js";
import { createBrowseRouter } from "./routes/browse.js";
import { createResearchRouter } from "./routes/research.js";
import { createGemsRouter } from "./routes/gems.js";
import { createCryptoKOLRouter } from "./routes/crypto-kol.js";
import { createSmartMoneyRouter } from "./routes/partner/nansen/smart-money.js";
import { createCheckStatusRouter } from "./routes/check-status.js";
import { createCheckStatusAgentRouter } from "./agents/check-status.js";
import { createJatevoRouter } from "./routes/jatevo.js";
import { createAgentChatRouter } from "./routes/agent/chat.js";
import { createAgentWalletRouter } from "./routes/agent/wallet.js";
import { createAgentToolsRouter } from "./routes/agent/tools.js";
import { createAgentMarketplaceRouter } from "./routes/agent/marketplace.js";
import { createUserPromptsRouter } from "./routes/agent/userPrompts.js";
import { createDexscreenerRouter } from "./routes/partner/dexscreener.js";
import { createTokenGodModeRouter } from "./routes/partner/nansen/token-god-mode.js";
import { createInfoRouter } from "./routes/info.js";
import { createCoingeckoRouter } from "./routes/coingecko.js";
import { createSolanaAgentRouter } from "./agents/solana-agent.js";
import { createPumpRouter } from "./routes/partner/workfun/pump.js";
import { createTrendingJupiterRouter } from "./routes/partner/jupiter/trending.js";
import { createTokenReportRouter } from "./routes/partner/rugcheck/token-report.js";
import { createTokenStatisticRouter } from "./routes/partner/rugcheck/token-statistic.js";
import { createSentimentRouter, createSentimentRouterRegular } from "./routes/sentiment.js";
import { createEventRouter } from "./routes/event.js";
import { createTrendingHeadlineRouter } from "./routes/trending-headline.js";
import { createSundownDigestRouter } from "./routes/sundown-digest.js";
import { createAgentSignalRouter } from "./agents/create-signal.js";
import { createLeaderboardRouter } from "./routes/leaderboard.js";
import { createAnalyticsRouter } from "./routes/analytics.js";
import { createDashboardSummaryRouterRegular } from "./routes/dashboardSummary.js";
import { createBubblemapsMapsRouter } from "./routes/partner/bubblemaps/maps.js";
import { createFastestHolderGrowthMemecoinsRouter } from "./routes/memecoin/fastestHolderGrowthMemecoins.js";
import { createMemecoinsAccumulatingBeforeCEXRumorsRouter } from "./routes/memecoin/memecoinsAccumulatingBeforeCEXRumors.js";
import { createMemecoinsMostMentionedBySmartMoneyXRouter } from "./routes/memecoin/memecoinsMostMentionedBySmartMoneyX.js";
import { createMemecoinsStrongNarrativeLowMarketCapRouter } from "./routes/memecoin/memecoinsStrongNarrativeLowMarketCap.js";
import { createMemecoinsByExperiencedDevsRouter } from "./routes/memecoin/memecoinsByExperiencedDevs.js";
import { createMemecoinsUnusualWhaleBehaviorRouter } from "./routes/memecoin/memecoinsUnusualWhaleBehavior.js";
import { createMemecoinsTrendingOnXNotDEXRouter } from "./routes/memecoin/memecoinsTrendingOnXNotDEX.js";
import { createMemecoinsOrganicTractionRouter } from "./routes/memecoin/aiMemecoinsOrganicTraction.js";
import { createMemecoinsSurvivingMarketDumpsRouter } from "./routes/memecoin/memecoinsSurvivingMarketDumps.js";
import { createBinanceOHLCRouter } from "./routes/partner/binance/ohlc.js";
import { createBinanceCorrelationRouter } from "./routes/partner/binance/correlation.js";
// V2 route imports
import { createNewsRouter as createV2NewsRouter } from "./v2/routes/news.js";
import { createSignalRouter as createV2SignalRouter } from "./v2/routes/signal.js";
import { createSentimentRouter as createV2SentimentRouter } from "./v2/routes/sentiment.js";
import { createEventRouter as createV2EventRouter } from "./v2/routes/event.js";
import { createBrowseRouter as createV2BrowseRouter } from "./v2/routes/browse.js";
import { createXSearchRouter as createV2XSearchRouter } from "./v2/routes/xSearch.js";
import { createResearchRouter as createV2ResearchRouter } from "./v2/routes/research.js";
import { createExaSearchRouter as createV2ExaSearchRouter } from "./v2/routes/exa-search.js";
import { createGemsRouter as createV2GemsRouter } from "./v2/routes/gems.js";
import { createXKOLRouter as createV2XKOLRouter } from "./v2/routes/kol.js";
import { createCryptoKOLRouter as createV2CryptoKOLRouter } from "./v2/routes/crypto-kol.js";
import { createCheckStatusRouter as createV2CheckStatusRouter } from "./v2/routes/check-status.js";
import { createTrendingHeadlineRouter as createV2TrendingHeadlineRouter } from "./v2/routes/trending-headline.js";
import { createSundownDigestRouter as createV2SundownDigestRouter } from "./v2/routes/sundown-digest.js";
import { createSmartMoneyRouter as createV2SmartMoneyRouter } from "./v2/routes/partner/nansen/smart-money.js";
import { createDexscreenerRouter as createV2DexscreenerRouter } from "./v2/routes/partner/dexscreener.js";
import { createTokenGodModeRouter as createV2TokenGodModeRouter } from "./v2/routes/partner/nansen/token-god-mode.js";
import { createPumpRouter as createV2PumpRouter } from "./v2/routes/partner/workfun/pump.js";
import { createTrendingJupiterRouter as createV2TrendingJupiterRouter } from "./v2/routes/partner/jupiter/trending.js";
import { createJupiterSwapOrderRouter as createV2JupiterSwapOrderRouter } from "./v2/routes/partner/jupiter/swap-order.js";
import { createTokenReportRouter as createV2TokenReportRouter } from "./v2/routes/partner/rugcheck/token-report.js";
import { createTokenStatisticRouter as createV2TokenStatisticRouter } from "./v2/routes/partner/rugcheck/token-statistic.js";
import { createTokenRiskAlertsRouter as createV2TokenRiskAlertsRouter } from "./v2/routes/partner/rugcheck/token-risk-alerts.js";
import { createBubblemapsMapsRouter as createV2BubblemapsMapsRouter } from "./v2/routes/partner/bubblemaps/maps.js";
import { createBinanceCorrelationRouter as createV2BinanceCorrelationRouter } from "./v2/routes/partner/binance/correlation.js";
import { createV2CoingeckoOnchainRouter } from "./v2/routes/partner/coingecko/onchain.js";
import { createV2CoingeckoSimplePriceRouter } from "./v2/routes/partner/coingecko/simple-price.js";
import { createAnalyticsRouter as createV2AnalyticsRouter } from "./v2/routes/analytics.js";
import { createFastestHolderGrowthMemecoinsRouter as createV2FastestHolderGrowthMemecoinsRouter } from "./v2/routes/memecoin/fastestHolderGrowthMemecoins.js";
import { createMemecoinsAccumulatingBeforeCEXRumorsRouter as createV2MemecoinsAccumulatingBeforeCEXRumorsRouter } from "./v2/routes/memecoin/memecoinsAccumulatingBeforeCEXRumors.js";
import { createMemecoinsMostMentionedBySmartMoneyXRouter as createV2MemecoinsMostMentionedBySmartMoneyXRouter } from "./v2/routes/memecoin/memecoinsMostMentionedBySmartMoneyX.js";
import { createMemecoinsStrongNarrativeLowMarketCapRouter as createV2MemecoinsStrongNarrativeLowMarketCapRouter } from "./v2/routes/memecoin/memecoinsStrongNarrativeLowMarketCap.js";
import { createMemecoinsByExperiencedDevsRouter as createV2MemecoinsByExperiencedDevsRouter } from "./v2/routes/memecoin/memecoinsByExperiencedDevs.js";
import { createMemecoinsUnusualWhaleBehaviorRouter as createV2MemecoinsUnusualWhaleBehaviorRouter } from "./v2/routes/memecoin/memecoinsUnusualWhaleBehavior.js";
import { createMemecoinsTrendingOnXNotDEXRouter as createV2MemecoinsTrendingOnXNotDEXRouter } from "./v2/routes/memecoin/memecoinsTrendingOnXNotDEX.js";
import { createMemecoinsOrganicTractionRouter as createV2MemecoinsOrganicTractionRouter } from "./v2/routes/memecoin/aiMemecoinsOrganicTraction.js";
import { createMemecoinsSurvivingMarketDumpsRouter as createV2MemecoinsSurvivingMarketDumpsRouter } from "./v2/routes/memecoin/memecoinsSurvivingMarketDumps.js";
// NOTE: @x402/express imports disabled - using custom V1-compatible middleware instead
// import { paymentMiddleware, x402ResourceServer } from "@x402/express";
// import { HTTPFacilitatorClient } from "@x402/core/server";
// import { ExactEvmScheme } from "@x402/evm/exact/server";
// import { ExactSvmScheme } from "@x402/svm/exact/server";
import dotenv from "dotenv";
import { zauthProvider } from "@zauthx402/sdk/middleware";
import { createPredictionGameRouter } from "./routes/prediction-game/index.js";
import connectMongoose from "./config/mongoose.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// x402 Payment Configuration
// NOTE: Individual routes use requirePayment() from utils/x402Payment.js
// which handles V1-compatible payment verification and 402 responses.
// See utils/x402Payment.js for configuration details.

const app = express();

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
const CORS_ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "https://api.syraa.fun",
  "https://syraa.fun",
  "https://www.syraa.fun",
  "https://agent.syraa.fun",
  "https://www.agent.syraa.fun",
];
const CORS_OPTIONS_X402 = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "api-key",
    "Api-Key",
    "API-KEY",
    "Payment-Signature",
    "PAYMENT-SIGNATURE",
    "Payment-Required",
    "PAYMENT-REQUIRED",
    "Payment-Response",
    "PAYMENT-RESPONSE",
    "X-Payment",
    "x-payment",
  ],
};
const CORS_OPTIONS_REGULAR = {
  origin: CORS_ALLOWED_ORIGINS,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "api-key",
    "Api-Key",
    "API-KEY",
    "Payment-Signature",
    "PAYMENT-SIGNATURE",
    "Payment-Required",
    "PAYMENT-REQUIRED",
    "Payment-Response",
    "PAYMENT-RESPONSE",
    "X-Payment",
    "x-payment",
  ],
};

// COMMAND: x402 API — only v2 is used for other websites; v1 is not x402.
// All v1 API (e.g. /v1/regular/*) is internal/free preview; only v2 endpoints get x402 CORS and skip rate limit.
function isX402Route(p) {
  if (!p) return false;
  if (p.startsWith("/.well-known")) return true;
  if (p.startsWith("/v2/")) return true;
  if (p.startsWith("/news")) return true;
  if (p.startsWith("/signal")) return true;
  if (p.startsWith("/x-search")) return true;
  if (p.startsWith("/x-kol")) return true;
  if (p.startsWith("/browse")) return true;
  if (p.startsWith("/research")) return true;
  if (p.startsWith("/exa-search")) return true;
  if (p.startsWith("/gems")) return true;
  if (p.startsWith("/crypto-kol")) return true;
  if (p.startsWith("/check-status") && !p.startsWith("/check-status-agent")) return true;
  if (p.startsWith("/smart-money")) return true;
  if (p.startsWith("/dexscreener")) return true;
  if (p.startsWith("/token-god-mode")) return true;
  if (p.startsWith("/solana-agent")) return true;
  if (p.startsWith("/pump")) return true;
  if (p.startsWith("/trending-jupiter")) return true;
  if (p.startsWith("/token-report")) return true;
  if (p.startsWith("/token-statistic")) return true;
  if (p.startsWith("/token-risk")) return true;
  if (p.startsWith("/sentiment")) return true;
  if (p.startsWith("/event")) return true;
  if (p.startsWith("/trending-headline")) return true;
  if (p.startsWith("/sundown-digest")) return true;
  if (p.startsWith("/bubblemaps")) return true;
  if (p.startsWith("/memecoin/")) return true;
  if (p === "/binance" || (p.startsWith("/binance/") && !p.startsWith("/binance/ohlc"))) return true;
  return false;
}

/** Agent routes (ai-agent website) need permissive CORS so the frontend can call from any origin (e.g. localhost:5173). */
function isAgentRoute(p) {
  return p && (p === "/agent" || p.startsWith("/agent/"));
}

/** Playground proxy: allows api-playground (playground.syraa.fun) to call other x402 APIs without CORS issues. */
function isPlaygroundProxyRoute(p) {
  return p === "/api/playground-proxy";
}

app.use((req, res, next) => {
  const options =
    isX402Route(req.path) || isAgentRoute(req.path) || isPlaygroundProxyRoute(req.path)
      ? CORS_OPTIONS_X402
      : CORS_OPTIONS_REGULAR;
  cors(options)(req, res, next);
});

// Serve static files (OG image, favicon, etc)
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Favicon explicit route (important for bots)
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "favicon.ico"));
});

// Playground CORS proxy: forward requests to external x402 APIs so the playground can call them from the browser
app.post("/api/playground-proxy", async (req, res) => {
  const { url: targetUrl, method = "GET", body: forwardBody, headers: forwardHeaders = {} } = req.body || {};
  if (!targetUrl || typeof targetUrl !== "string") {
    res.status(400).json({ error: "Missing or invalid url in body" });
    return;
  }
  const allowedMethods = ["GET", "POST", "HEAD"];
  const forwardMethod = (method || "GET").toUpperCase();
  if (!allowedMethods.includes(forwardMethod)) {
    res.status(400).json({ error: "Method not allowed. Use GET or POST." });
    return;
  }
  try {
    const fetchOpts = {
      method: forwardMethod,
      headers: { ...forwardHeaders },
    };
    if (forwardBody != null && forwardBody !== "" && forwardMethod !== "GET" && forwardMethod !== "HEAD") {
      fetchOpts.body = typeof forwardBody === "string" ? forwardBody : JSON.stringify(forwardBody);
    }
    const proxyRes = await fetch(targetUrl, fetchOpts);
    const responseText = await proxyRes.text();
    // Forward safe response headers (exclude hop-by-hop and encoding)
    const skipHeaders = ["content-encoding", "transfer-encoding", "content-length", "connection"];
    proxyRes.headers.forEach((value, key) => {
      if (!skipHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    res.status(proxyRes.status).send(responseText);
  } catch (err) {
    res.status(502).json({
      error: "Proxy fetch failed",
      message: err.message || String(err),
    });
  }
});

// Rate limit only non-x402 routes (free/regular APIs) to avoid spam; x402, agent, playground-proxy skip
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // max 100 requests per minute per IP on free routes
    skip: (req) =>
      isX402Route(req.path) || isAgentRoute(req.path) || isPlaygroundProxyRoute(req.path),
  }),
);

// ZAuth x402 monitoring (before x402 routes) – telemetry & optional validation/refunds via zauthx402.com
const ZAUTH_API_KEY = (process.env.ZAUTH_API_KEY || "").trim();
if (ZAUTH_API_KEY) {
  app.use(
    zauthProvider(ZAUTH_API_KEY, {
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

// COMMAND: Legacy (unversioned) API disabled — paths that have v2 are blocked; code kept for reference. Use /v2/* only.
const LEGACY_PATHS_WITH_V2 = [
  "/news", "/signal", "/sentiment", "/event", "/browse", "/x-search", "/research", "/gems",
  "/x-kol", "/crypto-kol", "/check-status", "/smart-money", "/dexscreener", "/token-god-mode",
  "/pump", "/trending-jupiter", "/token-report", "/token-statistic", "/trending-headline",
  "/sundown-digest", "/analytics", "/bubblemaps", "/coingecko", "/binance", "/memecoin",
];
function isLegacyPathWithV2(path) {
  if (!path || path.startsWith("/v2")) return false;
  if (path.startsWith("/check-status-agent")) return false;
  return LEGACY_PATHS_WITH_V2.some((p) => path === p || path.startsWith(p + "/"));
}
app.use((req, res, next) => {
  if (isLegacyPathWithV2(req.path)) {
    return res.status(410).json({
      success: false,
      error: "This API is no longer available. Please use v2.",
      migration: "https://api.syraa.fun/v2/",
      docs: "https://docs.syraa.fun",
    });
  }
  next();
});

// x402 routes (V1 format - x402scan compatible); kept for reference; blocked by middleware above
app.use("/info", await createInfoRouter());
app.use("/coingecko", await createCoingeckoRouter());
app.use("/binance/ohlc", await createBinanceOHLCRouter());
app.use("/binance", await createBinanceCorrelationRouter());
app.use("/news", await createNewsRouter());

// COMMAND: v1 API disabled for users — block all /v1/* requests; code kept for reference. Use /v2/* only.
app.use("/v1", (req, res) => {
  res.status(410).json({
    success: false,
    error: "v1 API is no longer available. Please use v2.",
    migration: "https://api.syraa.fun/v2/",
    docs: "https://docs.syraa.fun",
  });
});
// v1/regular (no x402) – kept for reference; blocked by /v1 handler above
app.use("/v1/regular/news", await createNewsRouterRegular());
app.use("/v1/regular/sentiment", await createSentimentRouterRegular());
app.use("/v1/regular/signal", await createSignalRouterRegular());
app.use("/v1/regular/dashboard-summary", await createDashboardSummaryRouterRegular());

// x402 V2 routes (V2 format - CAIP-2, PAYMENT-SIGNATURE header)
app.use("/v2/news", await createV2NewsRouter());
app.use("/v2/signal", await createV2SignalRouter());
app.use("/v2/sentiment", await createV2SentimentRouter());
app.use("/v2/event", await createV2EventRouter());
app.use("/v2/browse", await createV2BrowseRouter());
app.use("/v2/x-search", await createV2XSearchRouter());
app.use("/v2/research", await createV2ResearchRouter());
app.use("/v2/exa-search", await createV2ExaSearchRouter());
app.use("/v2/gems", await createV2GemsRouter());
app.use("/v2/x-kol", await createV2XKOLRouter());
app.use("/v2/crypto-kol", await createV2CryptoKOLRouter());
app.use("/v2/check-status", await createV2CheckStatusRouter());
app.use("/v2/trending-headline", await createV2TrendingHeadlineRouter());
app.use("/v2/sundown-digest", await createV2SundownDigestRouter());
app.use("/v2/smart-money", await createV2SmartMoneyRouter());
app.use("/v2/dexscreener", await createV2DexscreenerRouter());
app.use("/v2/token-god-mode", await createV2TokenGodModeRouter());
app.use("/v2/pump", await createV2PumpRouter());
app.use("/v2/trending-jupiter", await createV2TrendingJupiterRouter());
app.use("/v2/jupiter/swap/order", await createV2JupiterSwapOrderRouter());
app.use("/v2/token-report", await createV2TokenReportRouter());
app.use("/v2/token-statistic", await createV2TokenStatisticRouter());
app.use("/v2/token-risk/alerts", await createV2TokenRiskAlertsRouter());
app.use("/v2/bubblemaps/maps", await createV2BubblemapsMapsRouter());
app.use("/v2/binance", await createV2BinanceCorrelationRouter());
app.use("/v2/coingecko/simple-price", await createV2CoingeckoSimplePriceRouter());
app.use("/v2/coingecko/onchain", await createV2CoingeckoOnchainRouter());
app.use("/v2/analytics", await createV2AnalyticsRouter());
app.use("/v2/memecoin/fastest-holder-growth", await createV2FastestHolderGrowthMemecoinsRouter());
app.use("/v2/memecoin/most-mentioned-by-smart-money-x", await createV2MemecoinsMostMentionedBySmartMoneyXRouter());
app.use("/v2/memecoin/accumulating-before-CEX-rumors", await createV2MemecoinsAccumulatingBeforeCEXRumorsRouter());
app.use("/v2/memecoin/strong-narrative-low-market-cap", await createV2MemecoinsStrongNarrativeLowMarketCapRouter());
app.use("/v2/memecoin/by-experienced-devs", await createV2MemecoinsByExperiencedDevsRouter());
app.use("/v2/memecoin/unusual-whale-behavior", await createV2MemecoinsUnusualWhaleBehaviorRouter());
app.use("/v2/memecoin/trending-on-x-not-dex", await createV2MemecoinsTrendingOnXNotDEXRouter());
app.use("/v2/memecoin/organic-traction", await createV2MemecoinsOrganicTractionRouter());
app.use("/v2/memecoin/surviving-market-dumps", await createV2MemecoinsSurvivingMarketDumpsRouter());
// app.use("/test", await createTestRouter());
app.use("/signal", await createSignalRouter());
app.use("/x-search", await createXSearchRouter());
app.use("/x-kol", await createXKOLRouter());
app.use("/browse", await createBrowseRouter());
app.use("/research", await createResearchRouter());
app.use("/gems", await createGemsRouter());
app.use("/crypto-kol", await createCryptoKOLRouter());
app.use("/check-status", await createCheckStatusRouter());
app.use("/check-status-agent", await createCheckStatusAgentRouter());
app.use("/smart-money", await createSmartMoneyRouter());
app.use("/jatevo", await createJatevoRouter());
app.use("/agent/chat", await createAgentChatRouter());
app.use("/agent/wallet", await createAgentWalletRouter());
app.use("/agent/tools", await createAgentToolsRouter());
app.use("/agent/marketplace/prompts", await createUserPromptsRouter());
app.use("/agent/marketplace", await createAgentMarketplaceRouter());
app.use("/dexscreener", await createDexscreenerRouter());
app.use("/token-god-mode", await createTokenGodModeRouter());
app.use("/solana-agent", await createSolanaAgentRouter());
app.use("/pump", await createPumpRouter());
app.use("/trending-jupiter", await createTrendingJupiterRouter());
app.use("/token-report", await createTokenReportRouter());
app.use("/token-statistic", await createTokenStatisticRouter());
app.use("/sentiment", await createSentimentRouter());
app.use("/event", await createEventRouter());
app.use("/trending-headline", await createTrendingHeadlineRouter());
app.use("/sundown-digest", await createSundownDigestRouter());
app.use("/create-signal", await createAgentSignalRouter());
app.use("/leaderboard", await createLeaderboardRouter());
app.use("/analytics", await createAnalyticsRouter());
app.use("/bubblemaps/maps", await createBubblemapsMapsRouter());
app.use(
  "/memecoin/fastest-holder-growth",
  await createFastestHolderGrowthMemecoinsRouter(),
);
app.use(
  "/memecoin/most-mentioned-by-smart-money-x",
  await createMemecoinsMostMentionedBySmartMoneyXRouter(),
);
app.use(
  "/memecoin/accumulating-before-CEX-rumors",
  await createMemecoinsAccumulatingBeforeCEXRumorsRouter(),
);
app.use(
  "/memecoin/strong-narrative-low-market-cap",
  await createMemecoinsStrongNarrativeLowMarketCapRouter(),
);
app.use(
  "/memecoin/by-experienced-devs",
  await createMemecoinsByExperiencedDevsRouter(),
);
app.use(
  "/memecoin/unusual-whale-behavior",
  await createMemecoinsUnusualWhaleBehaviorRouter(),
);
app.use(
  "/memecoin/trending-on-x-not-dex",
  await createMemecoinsTrendingOnXNotDEXRouter(),
);
app.use(
  "/memecoin/organic-traction",
  await createMemecoinsOrganicTractionRouter(),
);
app.use(
  "/memecoin/surviving-market-dumps",
  await createMemecoinsSurvivingMarketDumpsRouter(),
);

// Prediction Game API routes
app.use("/prediction-game", createPredictionGameRouter());

// X402 Jobs verification
app.get("/.well-known/x402-verification.json", (req, res) => {
  res.json({ x402: "8ab3d1b3906d" });
});

// Serve discovery document at /.well-known/x402 (x402scan compatible)
// COMMAND: x402 discovery lists only v2 URLs; v1 is not used on other websites — call https://api.syraa.fun/v2/* for x402.
// NOTE: Only list endpoints that use paymentMiddleware (return 402 without payment)
// Discovery document version is 1, but 402 responses use x402Version: 2
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

  res.json({
    version: 1, // Discovery document version (not x402 protocol version)
    resources: [
      // V2 Core endpoints
      "https://api.syraa.fun/v2/news",
      "https://api.syraa.fun/v2/signal",
      "https://api.syraa.fun/v2/sentiment",
      "https://api.syraa.fun/v2/event",
      "https://api.syraa.fun/v2/trending-headline",
      "https://api.syraa.fun/v2/sundown-digest",
      "https://api.syraa.fun/v2/check-status",
      // V2 X/Twitter endpoints
      "https://api.syraa.fun/v2/x-search",
      "https://api.syraa.fun/v2/x-kol",
      "https://api.syraa.fun/v2/crypto-kol",
      // V2 Research & Analysis endpoints (exa-search omitted: internal/agent only, not for other websites)
      "https://api.syraa.fun/v2/browse",
      "https://api.syraa.fun/v2/research",
      "https://api.syraa.fun/v2/gems",
      // V2 Partner endpoints
      "https://api.syraa.fun/v2/smart-money",
      "https://api.syraa.fun/v2/dexscreener",
      "https://api.syraa.fun/v2/token-god-mode",
      // "https://api.syraa.fun/v2/pump",
      "https://api.syraa.fun/v2/trending-jupiter",
      "https://api.syraa.fun/v2/jupiter/swap/order",
      "https://api.syraa.fun/v2/token-report",
      "https://api.syraa.fun/v2/token-statistic",
      "https://api.syraa.fun/v2/token-risk/alerts",
      "https://api.syraa.fun/v2/bubblemaps/maps",
      "https://api.syraa.fun/v2/binance/correlation",
      "https://api.syraa.fun/v2/coingecko/simple-price",
      "https://api.syraa.fun/v2/coingecko/onchain/token-price",
      "https://api.syraa.fun/v2/coingecko/onchain/search-pools",
      "https://api.syraa.fun/v2/coingecko/onchain/trending-pools",
      "https://api.syraa.fun/v2/coingecko/onchain/token",
      // V2 Memecoin endpoints
      "https://api.syraa.fun/v2/memecoin/fastest-holder-growth",
      "https://api.syraa.fun/v2/memecoin/most-mentioned-by-smart-money-x",
      "https://api.syraa.fun/v2/memecoin/accumulating-before-CEX-rumors",
      "https://api.syraa.fun/v2/memecoin/strong-narrative-low-market-cap",
      "https://api.syraa.fun/v2/memecoin/by-experienced-devs",
      "https://api.syraa.fun/v2/memecoin/unusual-whale-behavior",
      "https://api.syraa.fun/v2/memecoin/trending-on-x-not-dex",
      "https://api.syraa.fun/v2/memecoin/organic-traction",
      "https://api.syraa.fun/v2/memecoin/surviving-market-dumps",
    ],
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

// Eager-init x402 V2 resource server so first paid request doesn't wait for facilitator /supported
import("./v2/utils/x402ResourceServer.js").then(({ ensureX402ResourceServerInitialized }) => {
  ensureX402ResourceServerInitialized().catch(() => {});
});

app.listen(PORT, () => {});
