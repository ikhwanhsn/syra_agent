/**
 * Historical retrieval — embeddings + vector similarity search.
 */

import axios from "axios";
import {
  getEmbeddingConfig,
  getQdrantConfig,
  BTC3_MACRO_SIMILARITY_TOP_K,
} from "../../config/btc3MacroConfig.js";
import {
  embeddingRepo,
  historicalEventRepo,
} from "../../repositories/btc3/index.js";

/** Seed historical events for similarity when DB is empty. */
const SEED_HISTORICAL_EVENTS = [
  {
    title: "Fed raises rates 75bps — June 2022",
    description: "Aggressive Fed tightening to combat inflation",
    categories: ["Interest Rates", "Monetary Policy"],
    eventDate: new Date("2022-06-15"),
    btcReturn24h: -0.05,
    btcReturn7d: -0.12,
    btcReturn30d: -0.18,
    durationDays: 30,
    confidence: 0.85,
    source: "seed",
  },
  {
    title: "Spot Bitcoin ETF approved — Jan 2024",
    description: "SEC approves spot Bitcoin ETFs",
    categories: ["ETF", "Regulation", "Crypto"],
    eventDate: new Date("2024-01-10"),
    btcReturn24h: 0.07,
    btcReturn7d: 0.05,
    btcReturn30d: 0.15,
    durationDays: 30,
    confidence: 0.9,
    source: "seed",
  },
  {
    title: "SVB bank collapse — March 2023",
    description: "Regional bank crisis triggers risk-off then BTC rally",
    categories: ["Bank Crisis", "Liquidity"],
    eventDate: new Date("2023-03-10"),
    btcReturn24h: 0.08,
    btcReturn7d: 0.22,
    btcReturn30d: 0.35,
    durationDays: 14,
    confidence: 0.8,
    source: "seed",
  },
  {
    title: "CPI hotter than expected — Aug 2023",
    description: "Inflation surprise leads to risk-off",
    categories: ["Inflation"],
    eventDate: new Date("2023-08-10"),
    btcReturn24h: -0.03,
    btcReturn7d: -0.08,
    btcReturn30d: -0.05,
    durationDays: 7,
    confidence: 0.75,
    source: "seed",
  },
];

/**
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
export function cosineSimilarity(a, b) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** EmbeddingProvider interface */
export const embeddingProvider = {
  isConfigured() {
    return getEmbeddingConfig().configured;
  },

  /** @param {string} text */
  async embed(text) {
    const cfg = getEmbeddingConfig();
    if (!cfg.configured) {
      return { vector: [], status: "unavailable" };
    }

    try {
      const res = await axios.post(
        `${cfg.baseUrl}/embeddings`,
        { model: cfg.model, input: text.slice(0, 8000) },
        {
          headers: {
            Authorization: `Bearer ${cfg.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30_000,
        },
      );
      const vector = res.data?.data?.[0]?.embedding;
      if (!Array.isArray(vector)) {
        return { vector: [], status: "failed", error: "Invalid embedding response" };
      }
      return { vector, status: "complete", model: cfg.model, provider: "openai" };
    } catch (err) {
      return {
        vector: [],
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};

/** VectorStore — Qdrant adapter */
export const qdrantVectorStore = {
  isConfigured() {
    return getQdrantConfig().configured;
  },

  /** @param {string} id @param {number[]} vector @param {object} payload */
  async upsert(id, vector, payload) {
    const cfg = getQdrantConfig();
    if (!cfg.configured) return { status: "unavailable" };

    const headers = { "Content-Type": "application/json" };
    if (cfg.apiKey) headers["api-key"] = cfg.apiKey;

    try {
      await axios.put(
        `${cfg.url}/collections/${cfg.collection}/points`,
        { points: [{ id, vector, payload }] },
        { headers, timeout: 15_000 },
      );
      return { status: "stored", vectorId: id };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },

  /** @param {number[]} vector */
  async search(vector, topK = BTC3_MACRO_SIMILARITY_TOP_K) {
    const cfg = getQdrantConfig();
    if (!cfg.configured) return { matches: [], status: "unavailable" };

    const headers = { "Content-Type": "application/json" };
    if (cfg.apiKey) headers["api-key"] = cfg.apiKey;

    try {
      const res = await axios.post(
        `${cfg.url}/collections/${cfg.collection}/points/search`,
        { vector, limit: topK, with_payload: true },
        { headers, timeout: 15_000 },
      );
      const matches = (res.data?.result || []).map((r) => ({
        id: r.id,
        score: r.score,
        payload: r.payload,
      }));
      return { matches, status: "complete" };
    } catch (err) {
      return { matches: [], status: "failed", error: err instanceof Error ? err.message : String(err) };
    }
  },
};

/** Mongo fallback vector search */
export const mongoVectorStore = {
  /** @param {number[]} queryVector @param {number} topK */
  async search(queryVector, topK = BTC3_MACRO_SIMILARITY_TOP_K) {
    const refs = await embeddingRepo.findAllWithVectors();
    const scored = refs
      .map((ref) => ({
        ref,
        score: cosineSimilarity(queryVector, ref.embedding || []),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return {
      matches: scored.map((s) => ({
        id: String(s.ref.macroEventId),
        score: s.score,
        payload: { macroEventId: s.ref.macroEventId },
      })),
      status: "complete",
    };
  },
};

export async function ensureHistoricalSeed() {
  await historicalEventRepo.seedDefaults(SEED_HISTORICAL_EVENTS);
}

/**
 * @param {{ _id: import('mongoose').Types.ObjectId; headline: string; summary?: string; categories?: string[] }} macroEvent
 */
export async function generateEmbeddingAndRetrieveSimilar(macroEvent) {
  await ensureHistoricalSeed();

  const text = `${macroEvent.headline}\n${macroEvent.summary || ""}\n${(macroEvent.categories || []).join(", ")}`;
  const embedResult = await embeddingProvider.embed(text);

  if (embedResult.status !== "complete") {
    const ref = await embeddingRepo.create({
      macroEventId: macroEvent._id,
      status: embedResult.status,
      store: "none",
    });
    return {
      embeddingRef: ref,
      similarEvents: [],
      status: embedResult.status,
      error: embedResult.error,
    };
  }

  const vectorId = String(macroEvent._id);
  let store = "mongo";
  let vectorStoreStatus = "stored";

  if (qdrantVectorStore.isConfigured()) {
    const qdrantResult = await qdrantVectorStore.upsert(vectorId, embedResult.vector, {
      headline: macroEvent.headline,
      macroEventId: String(macroEvent._id),
    });
    if (qdrantResult.status === "stored") {
      store = "qdrant";
    }
  }

  const embeddingRef = await embeddingRepo.create({
    macroEventId: macroEvent._id,
    provider: embedResult.provider,
    model: embedResult.model,
    vectorId,
    dimensions: embedResult.vector.length,
    store,
    status: vectorStoreStatus,
    embedding: embedResult.vector,
  });

  let searchResult;
  if (qdrantVectorStore.isConfigured()) {
    searchResult = await qdrantVectorStore.search(embedResult.vector);
  } else {
    searchResult = await mongoVectorStore.search(embedResult.vector);
  }

  const historical = await historicalEventRepo.list({ limit: 100 });
  /** @type {Array<{ event: object; similarityScore: number; historicalReturn: number | null; duration: number | null; confidence: number }>} */
  const similarEvents = [];

  for (const match of searchResult.matches || []) {
    const histEvent = historical.items.find(
      (h) =>
        String(h._id) === String(match.payload?.historicalEventId) ||
        h.title === match.payload?.title,
    );
    if (histEvent) {
      similarEvents.push({
        event: histEvent,
        similarityScore: match.score,
        historicalReturn: histEvent.btcReturn7d ?? histEvent.btcReturn24h,
        duration: histEvent.durationDays,
        confidence: histEvent.confidence,
      });
    }
  }

  if (similarEvents.length === 0) {
    for (const h of historical.items.slice(0, BTC3_MACRO_SIMILARITY_TOP_K)) {
      similarEvents.push({
        event: h,
        similarityScore: 0.3,
        historicalReturn: h.btcReturn7d ?? h.btcReturn24h,
        duration: h.durationDays,
        confidence: h.confidence,
      });
    }
  }

  return {
    embeddingRef,
    similarEvents,
    status: searchResult.status === "unavailable" ? "partial" : "complete",
  };
}
