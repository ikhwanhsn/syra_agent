import cors from "cors";
import express from "express";
import rateLimit from "./utils/rateLimit.js";
import path from "path";
import { fileURLToPath } from "url";
import { createNewsRouter } from "./routes/news.js";
import { express as faremeter } from "@faremeter/middleware";
import { solana } from "@faremeter/info";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import dotenv from "dotenv";
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
import { createRegularNewsRouter } from "./routes/regular/news.js";
import { createRegularSentimentRouter } from "./routes/regular/sentiment.js";
import { createRegularSignalRouter } from "./routes/regular/signal.js";
import { createPredictionGameRouter } from "./routes/prediction-game/index.js";
import connectMongoose from "./config/mongoose.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// x402 Payment Configuration
const evmAddress = process.env.EVM_ADDRESS;
const svmAddress = process.env.SVM_ADDRESS;
if (!evmAddress || !svmAddress) {
  console.error("Missing required environment variables: EVM_ADDRESS, SVM_ADDRESS");
  process.exit(1);
}

const facilitatorUrl = process.env.FACILITATOR_URL_PAYAI;
if (!facilitatorUrl) {
  console.error("❌ FACILITATOR_URL_PAYAI environment variable is required");
  process.exit(1);
}
const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

// Helper function to create accepts array for both EVM and SVM networks
// Using @x402/express format with "price" (library handles conversion internally)
const createAccepts = (price) => [
  {
    scheme: "exact",
    price: price, // @x402/express uses "price" format like "$0.001"
    network: "eip155:8453", // Base Mainnet
    payTo: evmAddress,
  },
  {
    scheme: "exact",
    price: price, // @x402/express uses "price" format like "$0.001"
    network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", // Solana Mainnet
    payTo: svmAddress,
  },
];

const app = express();

// Centralized x402 payment middleware for all paid API routes using @x402/express
app.use(
  paymentMiddleware(
    {
      // Weather API (example endpoint)
      "GET /weather-paid": {
        accepts: createAccepts("$0.001"),
        description: "Weather data",
        mimeType: "application/json",
      },
      // News API
      "GET /news": {
        accepts: createAccepts("$0.1"),
        description: "News information service",
        mimeType: "application/json",
      },
      "POST /news": {
        accepts: createAccepts("$0.1"),
        description: "News information service",
        mimeType: "application/json",
      },
      // Signal API
      "GET /signal": {
        accepts: createAccepts("$0.15"),
        description: "Trading signal service",
        mimeType: "application/json",
      },
      "POST /signal": {
        accepts: createAccepts("$0.15"),
        description: "Trading signal service",
        mimeType: "application/json",
      },
      // X Search API
      "GET /x-search": {
        accepts: createAccepts("$0.1"),
        description: "X/Twitter search service",
        mimeType: "application/json",
      },
      "POST /x-search": {
        accepts: createAccepts("$0.1"),
        description: "X/Twitter search service",
        mimeType: "application/json",
      },
      // X KOL API
      "GET /x-kol": {
        accepts: createAccepts("$0.1"),
        description: "X/Twitter KOL service",
        mimeType: "application/json",
      },
      "POST /x-kol": {
        accepts: createAccepts("$0.1"),
        description: "X/Twitter KOL service",
        mimeType: "application/json",
      },
      // Browse API
      "GET /browse": {
        accepts: createAccepts("$0.1"),
        description: "Web browsing service",
        mimeType: "application/json",
      },
      "POST /browse": {
        accepts: createAccepts("$0.1"),
        description: "Web browsing service",
        mimeType: "application/json",
      },
      // Research API
      "GET /research": {
        accepts: createAccepts("$0.15"),
        description: "Research service",
        mimeType: "application/json",
      },
      "POST /research": {
        accepts: createAccepts("$0.15"),
        description: "Research service",
        mimeType: "application/json",
      },
      // Gems API
      "GET /gems": {
        accepts: createAccepts("$0.1"),
        description: "Gems discovery service",
        mimeType: "application/json",
      },
      "POST /gems": {
        accepts: createAccepts("$0.1"),
        description: "Gems discovery service",
        mimeType: "application/json",
      },
      // Crypto KOL API
      "GET /crypto-kol": {
        accepts: createAccepts("$0.1"),
        description: "Crypto KOL service",
        mimeType: "application/json",
      },
      "POST /crypto-kol": {
        accepts: createAccepts("$0.1"),
        description: "Crypto KOL service",
        mimeType: "application/json",
      },
      // Check Status API
      "GET /check-status": {
        accepts: createAccepts("$0.05"),
        description: "Transaction status check",
        mimeType: "application/json",
      },
      "POST /check-status": {
        accepts: createAccepts("$0.05"),
        description: "Transaction status check",
        mimeType: "application/json",
      },
      // Smart Money API
      "GET /smart-money": {
        accepts: createAccepts("$0.15"),
        description: "Smart money tracking service",
        mimeType: "application/json",
      },
      "POST /smart-money": {
        accepts: createAccepts("$0.15"),
        description: "Smart money tracking service",
        mimeType: "application/json",
      },
      // Dexscreener API
      "GET /dexscreener": {
        accepts: createAccepts("$0.1"),
        description: "Dexscreener data service",
        mimeType: "application/json",
      },
      "POST /dexscreener": {
        accepts: createAccepts("$0.1"),
        description: "Dexscreener data service",
        mimeType: "application/json",
      },
      // Token God Mode API
      "GET /token-god-mode": {
        accepts: createAccepts("$0.15"),
        description: "Token analysis service",
        mimeType: "application/json",
      },
      "POST /token-god-mode": {
        accepts: createAccepts("$0.15"),
        description: "Token analysis service",
        mimeType: "application/json",
      },
      // Solana Agent API
      "GET /solana-agent": {
        accepts: createAccepts("$0.1"),
        description: "Solana agent service",
        mimeType: "application/json",
      },
      "POST /solana-agent": {
        accepts: createAccepts("$0.1"),
        description: "Solana agent service",
        mimeType: "application/json",
      },
      // Pump API
      "GET /pump": {
        accepts: createAccepts("$0.1"),
        description: "Pump.fun data service",
        mimeType: "application/json",
      },
      "POST /pump": {
        accepts: createAccepts("$0.1"),
        description: "Pump.fun data service",
        mimeType: "application/json",
      },
      // Trending Jupiter API
      "GET /trending-jupiter": {
        accepts: createAccepts("$0.1"),
        description: "Jupiter trending tokens",
        mimeType: "application/json",
      },
      "POST /trending-jupiter": {
        accepts: createAccepts("$0.1"),
        description: "Jupiter trending tokens",
        mimeType: "application/json",
      },
      // Token Report API
      "GET /token-report": {
        accepts: createAccepts("$0.1"),
        description: "Token report service",
        mimeType: "application/json",
      },
      "POST /token-report": {
        accepts: createAccepts("$0.1"),
        description: "Token report service",
        mimeType: "application/json",
      },
      // Token Statistic API
      "GET /token-statistic": {
        accepts: createAccepts("$0.1"),
        description: "Token statistics service",
        mimeType: "application/json",
      },
      "POST /token-statistic": {
        accepts: createAccepts("$0.1"),
        description: "Token statistics service",
        mimeType: "application/json",
      },
      // Sentiment API
      "GET /sentiment": {
        accepts: createAccepts("$0.1"),
        description: "Market sentiment analysis",
        mimeType: "application/json",
      },
      "POST /sentiment": {
        accepts: createAccepts("$0.1"),
        description: "Market sentiment analysis",
        mimeType: "application/json",
      },
      // Event API
      "GET /event": {
        accepts: createAccepts("$0.1"),
        description: "Crypto events service",
        mimeType: "application/json",
      },
      "POST /event": {
        accepts: createAccepts("$0.1"),
        description: "Crypto events service",
        mimeType: "application/json",
      },
      // Trending Headline API
      "GET /trending-headline": {
        accepts: createAccepts("$0.1"),
        description: "Trending headlines service",
        mimeType: "application/json",
      },
      "POST /trending-headline": {
        accepts: createAccepts("$0.1"),
        description: "Trending headlines service",
        mimeType: "application/json",
      },
      // Sundown Digest API
      "GET /sundown-digest": {
        accepts: createAccepts("$0.1"),
        description: "Sundown digest service",
        mimeType: "application/json",
      },
      "POST /sundown-digest": {
        accepts: createAccepts("$0.1"),
        description: "Sundown digest service",
        mimeType: "application/json",
      },
      // Create Signal API
      "GET /create-signal": {
        accepts: createAccepts("$0.15"),
        description: "Create trading signal",
        mimeType: "application/json",
      },
      "POST /create-signal": {
        accepts: createAccepts("$0.15"),
        description: "Create trading signal",
        mimeType: "application/json",
      },
      // Bubblemaps API
      "GET /bubblemaps/maps": {
        accepts: createAccepts("$0.1"),
        description: "Bubblemaps visualization",
        mimeType: "application/json",
      },
      "POST /bubblemaps/maps": {
        accepts: createAccepts("$0.1"),
        description: "Bubblemaps visualization",
        mimeType: "application/json",
      },
      // Binance Correlation API
      "GET /binance/correlation-matrix": {
        accepts: createAccepts("$0.1"),
        description: "Correlation matrix data",
        mimeType: "application/json",
      },
      "POST /binance/correlation-matrix": {
        accepts: createAccepts("$0.1"),
        description: "Correlation matrix data",
        mimeType: "application/json",
      },
      "GET /binance/correlation": {
        accepts: createAccepts("$0.1"),
        description: "Correlation data",
        mimeType: "application/json",
      },
      "POST /binance/correlation": {
        accepts: createAccepts("$0.1"),
        description: "Correlation data",
        mimeType: "application/json",
      },
      // Memecoin APIs
      "GET /memecoin/fastest-holder-growth": {
        accepts: createAccepts("$0.1"),
        description: "Fastest holder growth memecoins",
        mimeType: "application/json",
      },
      "POST /memecoin/fastest-holder-growth": {
        accepts: createAccepts("$0.1"),
        description: "Fastest holder growth memecoins",
        mimeType: "application/json",
      },
      "GET /memecoin/most-mentioned-by-smart-money-x": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins mentioned by smart money on X",
        mimeType: "application/json",
      },
      "POST /memecoin/most-mentioned-by-smart-money-x": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins mentioned by smart money on X",
        mimeType: "application/json",
      },
      "GET /memecoin/accumulating-before-CEX-rumors": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins accumulating before CEX rumors",
        mimeType: "application/json",
      },
      "POST /memecoin/accumulating-before-CEX-rumors": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins accumulating before CEX rumors",
        mimeType: "application/json",
      },
      "GET /memecoin/strong-narrative-low-market-cap": {
        accepts: createAccepts("$0.1"),
        description: "Strong narrative low market cap memecoins",
        mimeType: "application/json",
      },
      "POST /memecoin/strong-narrative-low-market-cap": {
        accepts: createAccepts("$0.1"),
        description: "Strong narrative low market cap memecoins",
        mimeType: "application/json",
      },
      "GET /memecoin/by-experienced-devs": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins by experienced developers",
        mimeType: "application/json",
      },
      "POST /memecoin/by-experienced-devs": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins by experienced developers",
        mimeType: "application/json",
      },
      "GET /memecoin/unusual-whale-behavior": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins with unusual whale behavior",
        mimeType: "application/json",
      },
      "POST /memecoin/unusual-whale-behavior": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins with unusual whale behavior",
        mimeType: "application/json",
      },
      "GET /memecoin/trending-on-x-not-dex": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins trending on X but not DEX",
        mimeType: "application/json",
      },
      "POST /memecoin/trending-on-x-not-dex": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins trending on X but not DEX",
        mimeType: "application/json",
      },
      "GET /memecoin/organic-traction": {
        accepts: createAccepts("$0.1"),
        description: "AI memecoins with organic traction",
        mimeType: "application/json",
      },
      "POST /memecoin/organic-traction": {
        accepts: createAccepts("$0.1"),
        description: "AI memecoins with organic traction",
        mimeType: "application/json",
      },
      "GET /memecoin/surviving-market-dumps": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins surviving market dumps",
        mimeType: "application/json",
      },
      "POST /memecoin/surviving-market-dumps": {
        accepts: createAccepts("$0.1"),
        description: "Memecoins surviving market dumps",
        mimeType: "application/json",
      },
    },
    new x402ResourceServer(facilitatorClient)
      .register("eip155:8453", new ExactEvmScheme())
      .register("solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", new ExactSvmScheme()),
  ),
);

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
    max: 100, // max 100 requests in 1 minute
    skip: (req) => {
      // Skip rate limiting for .well-known routes (x402scan verification)
      return req.path.startsWith("/.well-known");
    },
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

// Regular routes
app.use("/v1/regular/news", await createRegularNewsRouter());
app.use("/v1/regular/sentiment", await createRegularSentimentRouter());
app.use("/v1/regular/signal", await createRegularSignalRouter());

// x402 routes
app.use("/info", await createInfoRouter());
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

// Prediction Game API routes
app.use("/prediction-game", createPredictionGameRouter());

// X402 Jobs verification
app.get("/.well-known/x402-verification.json", (req, res) => {
  res.json({ x402: "8ab3d1b3906d" });
});

// Serve discovery document at /.well-known/x402
// NOTE: Only list endpoints that use requirePayment middleware (return 402 without payment)
app.get("/.well-known/x402", (req, res) => {
  res.json({
    version: 1,
    resources: [
      // Core endpoints (with requirePayment)
      "https://api.syraa.fun/news",
      "https://api.syraa.fun/signal",
      "https://api.syraa.fun/sentiment",
      "https://api.syraa.fun/event",
      "https://api.syraa.fun/trending-headline",
      "https://api.syraa.fun/sundown-digest",
      "https://api.syraa.fun/check-status",
      // Binance endpoints (with requirePayment)
      "https://api.syraa.fun/binance/correlation-matrix",
      "https://api.syraa.fun/binance/correlation",
      // X/Twitter endpoints (with requirePayment)
      "https://api.syraa.fun/x-search",
      "https://api.syraa.fun/x-kol",
      "https://api.syraa.fun/crypto-kol",
      // Research & Analysis endpoints (with requirePayment)
      "https://api.syraa.fun/browse",
      "https://api.syraa.fun/research",
      "https://api.syraa.fun/gems",
      // Partner endpoints (with requirePayment)
      "https://api.syraa.fun/smart-money",
      "https://api.syraa.fun/dexscreener",
      "https://api.syraa.fun/token-god-mode",
      "https://api.syraa.fun/solana-agent",
      "https://api.syraa.fun/trending-jupiter",
      "https://api.syraa.fun/token-report",
      "https://api.syraa.fun/token-statistic",
      "https://api.syraa.fun/bubblemaps/maps",
      // NOTE: /pump removed - GET endpoint has requirePayment commented out
      // Memecoin endpoints (with requirePayment)
      "https://api.syraa.fun/memecoin/fastest-holder-growth",
      "https://api.syraa.fun/memecoin/most-mentioned-by-smart-money-x",
      "https://api.syraa.fun/memecoin/accumulating-before-CEX-rumors",
      "https://api.syraa.fun/memecoin/strong-narrative-low-market-cap",
      "https://api.syraa.fun/memecoin/by-experienced-devs",
      "https://api.syraa.fun/memecoin/unusual-whale-behavior",
      "https://api.syraa.fun/memecoin/trending-on-x-not-dex",
      "https://api.syraa.fun/memecoin/organic-traction",
      "https://api.syraa.fun/memecoin/surviving-market-dumps",
    ],
    // IMPORTANT: Generate ownership proof by running: node scripts/generateOwnershipProof.js
    // Sign "https://api.syraa.fun" with your ADDRESS_PAYAI private key
    ownershipProofs: process.env.X402_OWNERSHIP_PROOF
      ? [process.env.X402_OWNERSHIP_PROOF]
      : [],
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


app.get("/weather-paid", (req, res) => {
  res.send({
    report: {
      weather: "sunny",
      temperature: 70,
    },
  });
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

// Connect to MongoDB (Mongoose) for prediction game
connectMongoose().then(() => {
  console.log('MongoDB (Mongoose) connected for prediction game');
}).catch(err => {
  console.error('Failed to connect MongoDB (Mongoose):', err);
});

app.listen(PORT, () => {
  console.log(`SYRA API running at http://localhost:${PORT}`);
});
