/**
 * Macro Intelligence Pipeline — orchestrates the full analysis chain.
 */

import { randomUUID } from "node:crypto";
import { isMongooseConnected } from "../../config/mongoose.js";
import { BTC3_MACRO_ARTICLE_BATCH_SIZE } from "../../config/btc3MacroConfig.js";
import {
  agentStateRepo,
  articleRepo,
  macroEventRepo,
  systemLogRepo,
} from "../../repositories/btc3/index.js";
import { collectNewsFromProviders, hashContent } from "./newsService.js";
import { translateToEnglish } from "./translationService.js";
import { computeContentHash, deduplicateAndCluster } from "./deduplicationService.js";
import { persistEntitiesForEvent } from "./entityExtractionService.js";
import { classifyMacroEvent } from "./classificationService.js";
import { generateEmbeddingAndRetrieveSimilar } from "./historicalRetrievalService.js";
import { generateReasoning } from "./reasoningAgent.js";
import { estimateMacroImpact } from "./macroImpactAgent.js";
import { optimizePortfolio } from "./portfolioOptimizer.js";
import { prepareExecutionQuote } from "./executionService.js";
import { recordDecisionOnchain } from "./onchainRecorder.js";
import {
  applyPaperRebalance,
  getPaperPortfolioForOptimizer,
  markPaperPortfolioToMarket,
} from "./btc3PaperTradingService.js";
import { log } from "../../utils/log.js";

/**
 * @param {string} step
 * @param {string} pipelineRunId
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 * @template T
 */
async function runStep(step, pipelineRunId, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    await systemLogRepo.append({
      step,
      level: "info",
      message: `${step} completed`,
      pipelineRunId,
      durationMs: Date.now() - start,
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await systemLogRepo.append({
      step,
      level: "error",
      message: `${step} failed: ${message}`,
      pipelineRunId,
      durationMs: Date.now() - start,
    });
    throw err;
  }
}

function inferMacroRegime(categories) {
  const riskOff = ["Bank Crisis", "War", "Inflation", "Interest Rates"];
  const riskOn = ["ETF", "Liquidity", "Crypto"];
  if (categories.some((c) => riskOff.includes(c))) return "risk_off";
  if (categories.some((c) => riskOn.includes(c))) return "risk_on";
  return "neutral";
}

function inferMarketRegime(expectedReturn) {
  if (expectedReturn == null) return "unknown";
  if (expectedReturn > 0.03) return "bull";
  if (expectedReturn < -0.03) return "bear";
  return "range";
}

export async function runMacroIntelligencePipeline() {
  if (!isMongooseConnected()) {
    return { success: false, error: "database_unavailable" };
  }

  const pipelineRunId = randomUUID();
  const errors = [];

  await agentStateRepo.updateState({
    lastPipelineStatus: "running",
    lastPipelineRunId: pipelineRunId,
  });

  try {
    await markPaperPortfolioToMarket().catch(() => null);

    const collectResult = await runStep("collect_news", pipelineRunId, () =>
      collectNewsFromProviders(),
    );

    const savedArticles = [];
    for (const raw of collectResult.articles.slice(0, BTC3_MACRO_ARTICLE_BATCH_SIZE)) {
      const translated = await translateToEnglish({
        title: raw.title,
        summary: raw.summary,
        language: raw.language,
      });

      const contentHash = computeContentHash(translated.title, translated.summary);
      const existing = await articleRepo.findByExternalId(raw.providerId, raw.externalId);
      if (existing) continue;

      const doc = await articleRepo.upsertArticle({
        externalId: raw.externalId,
        providerId: raw.providerId,
        title: raw.title,
        summary: raw.summary,
        body: raw.body,
        url: raw.url,
        language: translated.language,
        translatedTitle: translated.translated ? translated.title : null,
        translatedSummary: translated.translated ? translated.summary : null,
        contentHash,
        publishedAt: raw.publishedAt,
        status: translated.translated ? "translated" : "raw",
      });
      savedArticles.push(doc);
    }

    await runStep("translate", pipelineRunId, async () => ({
      processed: savedArticles.length,
    }));

    const { macroEvents } = await runStep("deduplicate", pipelineRunId, () =>
      deduplicateAndCluster(savedArticles.map((a) => a.toObject ? a.toObject() : a)),
    );

    let predictionsCount = 0;
    await markPaperPortfolioToMarket();
    const portfolio = await getPaperPortfolioForOptimizer();

    for (const event of macroEvents.slice(0, 5)) {
      const eventObj = event.toObject ? event.toObject() : event;

      const { categories, status: classStatus } = await classifyMacroEvent(eventObj);
      await macroEventRepo.updateById(eventObj._id, {
        categories,
        status: classStatus === "complete" ? "classified" : "clustered",
      });
      eventObj.categories = categories;

      await runStep("extract_entities", pipelineRunId, () =>
        persistEntitiesForEvent(eventObj),
      );

      const { similarEvents, status: histStatus } = await runStep(
        "historical_retrieval",
        pipelineRunId,
        () => generateEmbeddingAndRetrieveSimilar(eventObj),
      );

      if (histStatus !== "unavailable") {
        await macroEventRepo.updateById(eventObj._id, { status: "embedded" });
      }

      const reasoningDoc = await runStep("reasoning", pipelineRunId, () =>
        generateReasoning({ macroEvent: eventObj, similarEvents }),
      );

      const predictionDoc = await runStep("macro_impact", pipelineRunId, () =>
        estimateMacroImpact({
          macroEvent: eventObj,
          reasoning: reasoningDoc,
          similarEvents,
        }),
      );
      predictionsCount += 1;

      const optimization = await runStep("portfolio_optimize", pipelineRunId, () =>
        optimizePortfolio({
          currentPortfolio: portfolio,
          reasoningDoc,
          predictionDoc,
          macroEvent: eventObj,
        }),
      );

      await runStep("paper_rebalance", pipelineRunId, () =>
        applyPaperRebalance({
          decisionId: optimization.decision._id,
          macroEventId: eventObj._id,
          targetAllocation: optimization.targetAllocation,
          headline: eventObj.headline,
          confidence: optimization.confidence,
        }),
      );

      const updatedPortfolio = await getPaperPortfolioForOptimizer();

      await prepareExecutionQuote({
        decisionId: optimization.decision._id,
        currentAllocation: optimization.currentAllocation,
        targetAllocation: optimization.targetAllocation,
      });

      await recordDecisionOnchain({
        decisionId: optimization.decision._id,
        headlineHash: optimization.decision.headlineHash,
        allocation: optimization.targetAllocation,
        confidence: optimization.confidence,
        reasonHash: optimization.decision.reasonHash,
      });

      await macroEventRepo.updateById(eventObj._id, {
        status: "complete",
        reasoningId: reasoningDoc._id,
        predictionId: predictionDoc._id,
      });

      const expectedReturn7d = predictionDoc?.horizons?.d7?.expectedReturn;
      await agentStateRepo.updateState({
        macroRegime: inferMacroRegime(categories),
        marketRegime: inferMarketRegime(expectedReturn7d),
        currentConfidence: reasoningDoc.confidence ?? 0,
        currentRecommendation: optimization.targetAllocation,
        targetPortfolio: optimization.targetAllocation,
        portfolio: updatedPortfolio,
        latestDecisionId: optimization.decision._id,
        latestReasoningId: reasoningDoc._id,
        latestPredictionId: predictionDoc._id,
      });

      Object.assign(portfolio, updatedPortfolio);
    }

    const state = await agentStateRepo.getState();
    const articlesTotal = await articleRepo.countAll();
    await agentStateRepo.updateState({
      lastScanAt: new Date(),
      lastPipelineStatus: errors.length ? "partial" : "success",
      articlesProcessed: savedArticles.length,
      articlesTotal,
      predictionsGenerated: (state.predictionsGenerated || 0) + predictionsCount,
    });

    log.info(
      { event: "btc3_macro_pipeline_complete", pipelineRunId, articles: savedArticles.length },
      "Macro intelligence pipeline completed",
    );

    return {
      success: true,
      pipelineRunId,
      articlesCollected: collectResult.articles.length,
      articlesSaved: savedArticles.length,
      eventsProcessed: macroEvents.length,
      predictionsGenerated: predictionsCount,
      providerStats: collectResult.providerStats,
      errors,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(message);
    await agentStateRepo.updateState({ lastPipelineStatus: "failed" });
    log.warn({ event: "btc3_macro_pipeline_failed", pipelineRunId, error: message });
    return { success: false, pipelineRunId, error: message, errors };
  }
}
