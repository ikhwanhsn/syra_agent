/**
 * Agent memory vector store — Qdrant when configured, Mongo cosine fallback otherwise.
 * All searches are scoped by anonymousId (no cross-user leakage).
 */

import crypto from 'crypto';
import axios from 'axios';
import { getMemoryConfig, getMemoryQdrantConfig } from '../../config/memoryConfig.js';
import { agentMemoryRepo } from '../../repositories/agent/agentMemoryRepo.js';

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

/**
 * Deterministic UUID from a seed (Qdrant requires UUID or unsigned int point ids).
 * @param {string} seed
 * @returns {string}
 */
export function vectorIdFromSeed(seed) {
  const hash = crypto.createHash('sha256').update(String(seed)).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * @returns {Record<string, string>}
 */
function qdrantHeaders() {
  const cfg = getMemoryQdrantConfig();
  /** @type {Record<string, string>} */
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers['api-key'] = cfg.apiKey;
  return headers;
}

let collectionReady = false;
let collectionEnsurePromise = null;

/**
 * Ensure Qdrant collection exists with Cosine distance and configured dimensions.
 * @returns {Promise<boolean>}
 */
async function ensureQdrantCollection() {
  const cfg = getMemoryQdrantConfig();
  if (!cfg.configured) return false;
  if (collectionReady) return true;
  if (collectionEnsurePromise) return collectionEnsurePromise;

  collectionEnsurePromise = (async () => {
    const { dimensions } = getMemoryConfig();
    const headers = qdrantHeaders();
    try {
      const getRes = await axios.get(`${cfg.url}/collections/${cfg.collection}`, {
        headers,
        timeout: 10_000,
        validateStatus: (s) => s < 500,
      });
      if (getRes.status === 200) {
        collectionReady = true;
        return true;
      }
      await axios.put(
        `${cfg.url}/collections/${cfg.collection}`,
        {
          vectors: {
            size: dimensions,
            distance: 'Cosine',
          },
        },
        { headers, timeout: 15_000 }
      );
      collectionReady = true;
      return true;
    } catch (err) {
      console.warn(
        '[memory] qdrant ensureCollection failed:',
        err instanceof Error ? err.message : String(err)
      );
      return false;
    } finally {
      collectionEnsurePromise = null;
    }
  })();

  return collectionEnsurePromise;
}

export const qdrantMemoryStore = {
  isConfigured() {
    return getMemoryQdrantConfig().configured;
  },

  /**
   * @param {string} id - UUID point id
   * @param {number[]} vector
   * @param {object} payload
   */
  async upsert(id, vector, payload) {
    const cfg = getMemoryQdrantConfig();
    if (!cfg.configured) return { status: 'unavailable' };
    const ready = await ensureQdrantCollection();
    if (!ready) return { status: 'failed', error: 'Qdrant collection unavailable' };

    try {
      await axios.put(
        `${cfg.url}/collections/${cfg.collection}/points`,
        { points: [{ id, vector, payload }] },
        { headers: qdrantHeaders(), timeout: 15_000 }
      );
      return { status: 'stored', vectorId: id };
    } catch (err) {
      return {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },

  /**
   * @param {number[]} vector
   * @param {string} anonymousId
   * @param {number} [topK]
   */
  async search(vector, anonymousId, topK) {
    const cfg = getMemoryQdrantConfig();
    const memCfg = getMemoryConfig();
    const limit = topK ?? memCfg.topK;
    if (!cfg.configured) return { matches: [], status: 'unavailable' };

    try {
      const res = await axios.post(
        `${cfg.url}/collections/${cfg.collection}/points/search`,
        {
          vector,
          limit,
          with_payload: true,
          filter: {
            must: [{ key: 'anonymousId', match: { value: String(anonymousId).trim() } }],
          },
        },
        { headers: qdrantHeaders(), timeout: 15_000 }
      );
      const matches = (res.data?.result || []).map((r) => ({
        id: r.id,
        score: r.score,
        payload: r.payload || {},
      }));
      return { matches, status: 'complete' };
    } catch (err) {
      return {
        matches: [],
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};

export const mongoMemoryStore = {
  /**
   * @param {number[]} queryVector
   * @param {string} anonymousId
   * @param {number} [topK]
   */
  async search(queryVector, anonymousId, topK) {
    const memCfg = getMemoryConfig();
    const limit = topK ?? memCfg.topK;
    const refs = await agentMemoryRepo.findAllWithVectors(anonymousId);
    const scored = refs
      .map((ref) => ({
        ref,
        score: cosineSimilarity(queryVector, ref.embedding || []),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      matches: scored.map((s) => ({
        id: s.ref.vectorId || String(s.ref._id),
        score: s.score,
        payload: {
          anonymousId: s.ref.anonymousId,
          chatId: s.ref.chatId,
          messageId: s.ref.messageId,
          role: s.ref.role,
          text: s.ref.text,
          modality: s.ref.modality,
          createdAt: s.ref.createdAt,
        },
      })),
      status: 'complete',
    };
  },
};

/**
 * Upsert a memory vector into the preferred store.
 * @param {{
 *   vectorId: string;
 *   vector: number[];
 *   payload: object;
 * }} params
 */
export async function upsertMemoryVector(params) {
  if (qdrantMemoryStore.isConfigured()) {
    const result = await qdrantMemoryStore.upsert(params.vectorId, params.vector, params.payload);
    if (result.status === 'stored') {
      return { store: 'qdrant', ...result };
    }
  }
  // Mongo always keeps the vector on the AgentMemory document (caller persists).
  return { store: 'mongo', status: 'stored', vectorId: params.vectorId };
}

/**
 * Search memories for one user.
 * @param {number[]} vector
 * @param {string} anonymousId
 * @param {number} [topK]
 */
export async function searchMemoryVectors(vector, anonymousId, topK) {
  if (qdrantMemoryStore.isConfigured()) {
    const result = await qdrantMemoryStore.search(vector, anonymousId, topK);
    if (result.status === 'complete') return result;
  }
  return mongoMemoryStore.search(vector, anonymousId, topK);
}
