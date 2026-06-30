/**
 * Smoke-test all route factories before deploy — catches bad import paths
 * and Express 5 / path-to-regexp invalid route patterns.
 */
import { createSignalRouterRegular } from "../routes/signal.js";
import { createCheckStatusAgentRouter } from "../agents/check-status.js";
import { createXProjectAnalyzerRouter } from "../agents/x-project-analyzer.js";
import { createXProjectsBatchAnalyzerRouter } from "../agents/x-projects-batch-analyzer.js";
import { createOpenRouterChatRouter } from "../routes/openrouterChat.js";
import { createChatCompletionsRouter } from "../routes/chatCompletions.js";
import { createImageGenerationsRouter } from "../routes/imageGenerations.js";
import { createVideoGenerationsRouter } from "../routes/videoGenerations.js";
import { createAgentChatRouter } from "../routes/agent/chat.js";
import { createAgentAuthRouter } from "../routes/agent/auth.js";
import { createAgentWalletIntentRouter } from "../routes/agent/walletIntent.js";
import { createAgentChartRouter } from "../routes/agent/chart.js";
import { createAgentPumpfunCoinRouter } from "../routes/agent/pumpfunCoin.js";
import { createTokensDossierRouter } from "../routes/agent/tokensDossier.js";
import { createAgentWalletRouter } from "../routes/agent/wallet.js";
import { createAgentBillingRouter } from "../routes/agent/billing.js";
import { createAgentToolsRouter } from "../routes/agent/tools.js";
import { createAgentPactRouter } from "../routes/agent/pact.js";
import { createAgentMarketplaceRouter } from "../routes/agent/marketplace.js";
import { createAgentLeaderboardRouter } from "../routes/agent/leaderboard.js";
import { createBnb8183Router } from "../routes/agent/bnb8183.js";
import { createAgentChainsRouter } from "../routes/agent/chains.js";
import { createUserPromptsRouter } from "../routes/agent/userPrompts.js";
import { createAgentSkillsRouter } from "../routes/agent/skills.js";
import { createSkillsRouter } from "../routes/skills.js";
import { createInfoRouter } from "../routes/info.js";
import { createWalletSolanaBalanceRouter } from "../routes/walletSolanaBalance.js";
import { createSolanaAgentRouter } from "../agents/solana-agent.js";
import { createAgentSignalRouter } from "../agents/create-signal.js";
import { createLeaderboardRouter } from "../routes/leaderboard.js";
import { createAnalyticsRouter } from "../routes/analytics.js";
import { createInternalResearchRouter } from "../routes/internalResearch.js";
import { createS3labsTelegramWebhookRouter } from "../routes/s3labsTelegramWebhook.js";
import { createInternalPartnershipScoutRouter } from "../routes/internalPartnershipScout.js";
import { createInternalHackathonsRouter } from "../routes/internalHackathons.js";
import { createInternalEventsRouter } from "../routes/internalEvents.js";
import { createInternalToolsRouter } from "../routes/internalTools.js";
import { createInternalAgentWalletsRouter } from "../routes/internalAgentWallets.js";
import { createInternalTesterAgentRouter } from "../routes/internalTesterAgent.js";
import { createBitgetVibeRouter } from "../routes/bitgetVibe.js";
import { createArenaRouter } from "../routes/arena.js";
import { createSpcxRouter, createEquityRouter } from "../routes/spcx.js";
import { createIndicatorRouter } from "../routes/indicator.js";
import { createBtcRouter } from "../routes/btc.js";
import { createSpcxExperimentRouter } from "../routes/experiment/spcx.js";
import { createSyraTradingTelegramWebhookRouter } from "../routes/syraTradingTelegramWebhook.js";
import { createSentinelDashboardRouter } from "../routes/sentinelDashboard.js";
import { createDashboardSummaryRouterRegular } from "../routes/dashboardSummary.js";
import {
  createUponlyRiseMarketRouter,
  createUponlyRiseMarketsRouter,
  createUponlyRisePortfolioRouter,
} from "../routes/uponlyRiseMarket.js";
import { createUponlyRiseCreateRouter } from "../routes/uponlyRiseCreate.js";
import { createXApiRouter } from "../routes/partner/x-api/index.js";
import { createBinanceTickerPriceRouter } from "../routes/partner/binance/ticker-price.js";
import {
  createCryptonewsRouter,
  createNewsRouterRegular,
  createSentimentRouterRegular,
} from "../routes/partner/cryptonews.js";
import { createSignalRouter as createV2SignalRouter } from "../routes/signal.js";
import { createArbitrageExperimentX402Router } from "../routes/arbitrageExperimentX402.js";
import { createJupiterQuoteRouter } from "../routes/jupiter/quote.js";
import { createJupiterSwapUiRouter } from "../routes/jupiter/swapUi.js";
import {
  createPumpfunTrendingRouter,
  createPumpfunMoversRouter,
} from "../routes/pumpfun/marketLists.js";
import { createPumpfunAnalyzerRouter } from "../routes/pumpfun/analyzer.js";
import { createPumpfunScoutRouter } from "../routes/pumpfun/scout.js";
import { createRiseScoutRouter } from "../routes/rise.js";
import { createCoingeckoScoutRouter } from "../routes/coingecko.js";
import { createAssetsX402Router } from "../routes/assets/index.js";
import { createAssetsDetailX402Router } from "../routes/assets/detail.js";
import { createBitcoinX402Router } from "../routes/bitcoin/index.js";
import { createLpAgentExperimentRouter } from "../routes/lpAgentExperiment.js";
import { createLpAgentRealRouter } from "../routes/lpAgentReal.js";
import { createShipLogStudioRouter } from "../routes/shipLogStudio.js";
import { createHealthRouter } from "../routes/health.js";
import { createMppV1Router } from "../routes/mpp/v1.js";
import { createMcpToolsRouter } from "../routes/mcp/tools.js";
import { createNansenEndpointsRouter } from "../routes/partner/nansen/nansenEndpoints.js";
import { createBinanceSpotRouter } from "../routes/partner/binance/spot.js";
import { createBinanceCorrelationRouter } from "../routes/partner/binance/correlation.js";
import { createBankrRouter } from "../routes/partner/bankr/index.js";
import { createGizaRouter } from "../routes/partner/giza/index.js";
import { createNeynarRouter } from "../routes/partner/neynar/index.js";
import { createSiwaRouter } from "../routes/partner/siwa/index.js";
import { createPredictionGameRouter } from "../routes/prediction-game/index.js";
import { create8004Router } from "../routes/8004.js";
import { createSaidRouter } from "../routes/said/index.js";
import { createAipRouter } from "../routes/aip/index.js";
import { createA2aRouter } from "../routes/a2a/index.js";
import { createBrainRouter } from "../routes/brain.js";
import { createPlaygroundShareRouter } from "../routes/playgroundShare.js";
import { createStreamflowLocksRouter } from "../routes/streamflowLocks.js";
import { createStakingAppRouter } from "../routes/stakingApp.js";
import { createTempoPayoutRouter } from "../routes/payouts/tempo.js";
import { createKolRouter } from "../routes/kol/index.js";
import { createAgentscoreRouter } from "../routes/agentscore/index.js";
import { createPillarsRouter } from "../routes/pillars.js";
import { createInvestRouter } from "../routes/invest.js";
import { createGrowRouter } from "../routes/grow.js";
import { createEarnRouter } from "../routes/earn.js";
import { createBtc3MacroRouter } from "../routes/btc3Macro.js";

/** @type {Array<[string, () => unknown | Promise<unknown>]>} */
const factories = [
  ["createSignalRouterRegular", createSignalRouterRegular],
  ["createCheckStatusAgentRouter", createCheckStatusAgentRouter],
  ["createXProjectAnalyzerRouter", createXProjectAnalyzerRouter],
  ["createXProjectsBatchAnalyzerRouter", createXProjectsBatchAnalyzerRouter],
  ["createOpenRouterChatRouter", createOpenRouterChatRouter],
  ["createChatCompletionsRouter", createChatCompletionsRouter],
  ["createImageGenerationsRouter", createImageGenerationsRouter],
  ["createVideoGenerationsRouter", createVideoGenerationsRouter],
  ["createAgentChatRouter", createAgentChatRouter],
  ["createAgentAuthRouter", createAgentAuthRouter],
  ["createAgentWalletIntentRouter", createAgentWalletIntentRouter],
  ["createAgentChartRouter", createAgentChartRouter],
  ["createAgentPumpfunCoinRouter", createAgentPumpfunCoinRouter],
  ["createTokensDossierRouter", createTokensDossierRouter],
  ["createAgentWalletRouter", createAgentWalletRouter],
  ["createAgentBillingRouter", createAgentBillingRouter],
  ["createAgentToolsRouter", createAgentToolsRouter],
  ["createAgentPactRouter", createAgentPactRouter],
  ["createAgentMarketplaceRouter", createAgentMarketplaceRouter],
  ["createAgentLeaderboardRouter", createAgentLeaderboardRouter],
  ["createBnb8183Router", createBnb8183Router],
  ["createAgentChainsRouter", createAgentChainsRouter],
  ["createUserPromptsRouter", createUserPromptsRouter],
  ["createAgentSkillsRouter", createAgentSkillsRouter],
  ["createSkillsRouter", createSkillsRouter],
  ["createInfoRouter", createInfoRouter],
  ["createWalletSolanaBalanceRouter", createWalletSolanaBalanceRouter],
  ["createSolanaAgentRouter", createSolanaAgentRouter],
  ["createAgentSignalRouter", createAgentSignalRouter],
  ["createLeaderboardRouter", createLeaderboardRouter],
  ["createAnalyticsRouter", createAnalyticsRouter],
  ["createInternalResearchRouter", createInternalResearchRouter],
  ["createS3labsTelegramWebhookRouter", createS3labsTelegramWebhookRouter],
  ["createInternalPartnershipScoutRouter", createInternalPartnershipScoutRouter],
  ["createInternalHackathonsRouter", createInternalHackathonsRouter],
  ["createInternalEventsRouter", createInternalEventsRouter],
  ["createInternalToolsRouter", createInternalToolsRouter],
  ["createInternalAgentWalletsRouter", createInternalAgentWalletsRouter],
  ["createInternalTesterAgentRouter", createInternalTesterAgentRouter],
  ["createBitgetVibeRouter", createBitgetVibeRouter],
  ["createArenaRouter", createArenaRouter],
  ["createSpcxRouter", createSpcxRouter],
  ["createEquityRouter", createEquityRouter],
  ["createIndicatorRouter", createIndicatorRouter],
  ["createBtcRouter", createBtcRouter],
  ["createSpcxExperimentRouter", createSpcxExperimentRouter],
  ["createSyraTradingTelegramWebhookRouter", createSyraTradingTelegramWebhookRouter],
  ["createSentinelDashboardRouter", createSentinelDashboardRouter],
  ["createDashboardSummaryRouterRegular", createDashboardSummaryRouterRegular],
  ["createUponlyRiseMarketRouter", createUponlyRiseMarketRouter],
  ["createUponlyRiseMarketsRouter", createUponlyRiseMarketsRouter],
  ["createUponlyRisePortfolioRouter", createUponlyRisePortfolioRouter],
  ["createUponlyRiseCreateRouter", createUponlyRiseCreateRouter],
  ["createXApiRouter", createXApiRouter],
  ["createBinanceTickerPriceRouter", createBinanceTickerPriceRouter],
  ["createCryptonewsRouter", createCryptonewsRouter],
  ["createNewsRouterRegular", createNewsRouterRegular],
  ["createSentimentRouterRegular", createSentimentRouterRegular],
  ["createV2SignalRouter", createV2SignalRouter],
  ["createArbitrageExperimentX402Router", createArbitrageExperimentX402Router],
  ["createJupiterQuoteRouter", createJupiterQuoteRouter],
  ["createJupiterSwapUiRouter", createJupiterSwapUiRouter],
  ["createPumpfunTrendingRouter", createPumpfunTrendingRouter],
  ["createPumpfunMoversRouter", createPumpfunMoversRouter],
  ["createPumpfunAnalyzerRouter", createPumpfunAnalyzerRouter],
  ["createPumpfunScoutRouter", createPumpfunScoutRouter],
  ["createRiseScoutRouter", createRiseScoutRouter],
  ["createCoingeckoScoutRouter", createCoingeckoScoutRouter],
  ["createAssetsX402Router", createAssetsX402Router],
  ["createAssetsDetailX402Router", createAssetsDetailX402Router],
  ["createBitcoinX402Router", createBitcoinX402Router],
  ["createLpAgentExperimentRouter", createLpAgentExperimentRouter],
  ["createLpAgentRealRouter", createLpAgentRealRouter],
  ["createShipLogStudioRouter", createShipLogStudioRouter],
  ["createHealthRouter", createHealthRouter],
  ["createMppV1Router", createMppV1Router],
  ["createMcpToolsRouter", createMcpToolsRouter],
  ["createNansenEndpointsRouter", createNansenEndpointsRouter],
  ["createBinanceSpotRouter", createBinanceSpotRouter],
  ["createBinanceCorrelationRouter", createBinanceCorrelationRouter],
  ["createBankrRouter", createBankrRouter],
  ["createGizaRouter", createGizaRouter],
  ["createNeynarRouter", createNeynarRouter],
  ["createSiwaRouter", createSiwaRouter],
  ["createPredictionGameRouter", createPredictionGameRouter],
  ["create8004Router", create8004Router],
  ["createSaidRouter", createSaidRouter],
  ["createAipRouter", createAipRouter],
  ["createA2aRouter", createA2aRouter],
  ["createBrainRouter", createBrainRouter],
  ["createPlaygroundShareRouter", createPlaygroundShareRouter],
  ["createStreamflowLocksRouter", createStreamflowLocksRouter],
  ["createStakingAppRouter", createStakingAppRouter],
  ["createTempoPayoutRouter", createTempoPayoutRouter],
  ["createKolRouter", createKolRouter],
  ["createAgentscoreRouter", createAgentscoreRouter],
  ["createPillarsRouter", createPillarsRouter],
  ["createInvestRouter", createInvestRouter],
  ["createGrowRouter", createGrowRouter],
  ["createEarnRouter", createEarnRouter],
  ["createBtc3MacroRouter", createBtc3MacroRouter],
];

let failed = 0;
for (const [name, factory] of factories) {
  try {
    await factory();
    console.log(`OK  ${name}`);
  } catch (err) {
    failed += 1;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`FAIL ${name}: ${message}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} route factory(ies) failed`);
  process.exit(1);
}

console.log(`\nAll ${factories.length} route factories OK`);
