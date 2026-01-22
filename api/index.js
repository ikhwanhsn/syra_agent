import cors from "cors";
import express from "express";
import rateLimit from "./utils/rateLimit.js";
import path from "path";
import { fileURLToPath } from "url";
import { createWeatherRouter } from "./routes/weather.js";
import { createNewsRouter } from "./routes/news.js";
import { express as faremeter } from "@faremeter/middleware";
import { solana } from "@faremeter/info";
import { paymentMiddleware } from "x402-express";
import dotenv from "dotenv";
import { createTestRouter } from "./routes/test.js";
import { createSignalRouter } from "./routes/signal.js";
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
import { createDexscreenerRouter } from "./routes/partner/dexscreener.js";
import { createTokenGodModeRouter } from "./routes/partner/nansen/token-god-mode.js";
import { createInfoRouter } from "./routes/info.js";
import { createSolanaAgentRouter } from "./agents/solana-agent.js";
import { createPumpRouter } from "./routes/partner/workfun/pump.js";
import { createTrendingJupiterRouter } from "./routes/partner/jupiter/trending.js";
import { createTokenReportRouter } from "./routes/partner/rugcheck/token-report.js";
import { createTokenStatisticRouter } from "./routes/partner/rugcheck/token-statistic.js";
import { createSentimentRouter } from "./routes/sentiment.js";
import { createEventRouter } from "./routes/event.js";
import { createTrendingHeadlineRouter } from "./routes/trending-headline.js";
import { createSundownDigestRouter } from "./routes/sundown-digest.js";
import { createAgentSignalRouter } from "./agents/create-signal.js";
import { createLeaderboardRouter } from "./routes/leaderboard.js";
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// app.use(
//   cors({
//     origin: [
//       "http://localhost:8080",
//       "https://api.syraa.fun",
//       "https://syraa.fun",
//       "https://www.syraa.fun",
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//   }),
// );

app.use(
  cors({
    origin: "*", // Allows any website to access your API
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const paywalledMiddleware = await faremeter.createMiddleware({
  facilitatorURL: "https://facilitator.corbits.dev",
  accepts: [
    {
      ...solana.x402Exact({
        network: "devnet",
        asset: "USDC",
        amount: 10000,
        payTo: "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t",
      }),
      resource: `${BASE_URL}/api/premium`, // Now a full URL
      description: "Premium API access",
    },
  ],
});

// Serve static files (OG image, favicon, etc)
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Favicon explicit route (important for bots)
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "favicon.ico"));
});

app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // max 50 requests in 1 minute
  }),
);

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

app.use("/info", await createInfoRouter());
app.use("/weather", await createWeatherRouter());
app.use("/binance/ohlc", await createBinanceOHLCRouter());
app.use("/binance", await createBinanceCorrelationRouter());
app.use("/news", await createNewsRouter());
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

// X402 Jobs verification
app.get("/.well-known/x402-verification.json", (req, res) => {
  res.json({ x402: "8ab3d1b3906d" });
});

// Serve discovery document at /.well-known/x402
app.get("/.well-known/x402", (req, res) => {
  res.json({
    version: 1,
    resources: [
      "https://api.syraa.fun/binance/correlation-matrix",
      "https://api.syraa.fun/binance/correlation",
      "https://api.syraa.fun/news",
      "https://api.syraa.fun/signal",
      "https://api.syraa.fun/x-search",
      "https://api.syraa.fun/x-kol",
      "https://api.syraa.fun/browse",
      "https://api.syraa.fun/research",
      "https://api.syraa.fun/gems",
      "https://api.syraa.fun/crypto-kol",
      "https://api.syraa.fun/smart-money",
      "https://api.syraa.fun/dexscreener",
      "https://api.syraa.fun/token-god-mode",
      "https://api.syraa.fun/solana-agent",
      "https://api.syraa.fun/pump",
      "https://api.syraa.fun/trending-jupiter",
      "https://api.syraa.fun/token-report",
      "https://api.syraa.fun/token-statistic",
      "https://api.syraa.fun/sentiment",
      "https://api.syraa.fun/event",
      "https://api.syraa.fun/trending-headline",
      "https://api.syraa.fun/sundown-digest",
    ],
    ownershipProofs: [
      // Generated using your private key
      // "SljGbtrXsBTy1j4md8afmL8CMiBFpaXf2WhQkxhPfud3G/iO/Pw0RKp3kbyneWi+7bsr0Jh/poT8nb0etqHCCA==",
      "0xe0985219dc79d1dbde08309b92c11152b542b758e3ea0459b1af238a49d644ce8782d5c1591fe55946b8f5ad4ec2bdd3f986339d4cf60369f156cea765aa5f03",
    ],
    instructions:
      "# API Documentation\n\nVisit https://docs.syraa.fun for full documentation.\n\n## Rate Limits\n- 1000 requests/hour",
  });
});

// Free endpoint
app.get("/api/free", (req, res) => {
  res.json({ data: "free content" });
});

// Premium endpoint with payment required
app.get("/api/premium", paywalledMiddleware, (req, res) => {
  res.json({ data: "premium content" });
});

app.use(
  paymentMiddleware(
    "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t",
    {
      "/protected-route": {
        price: "$0.10",
        network: "solana",
        config: {
          description: "Access to premium content",
        },
      },
    },
    { url: "https://facilitator.payai.network" },
  ),
);

// Implement your route
app.get("/protected-route", (req, res) => {
  res.json({ message: "This content is behind a paywall" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
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
app.listen(PORT, () => {
  console.log(`SYRA API running at http://localhost:${PORT}`);
});
