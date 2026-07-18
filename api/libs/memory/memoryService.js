/**
 * Syra agent long-term memory orchestration.
 * ingestTurn: embed passages async after chat turns
 * retrieveRelevant: embed query → vector candidates → optional Nemotron rerank → inject past context
 */

import crypto from 'crypto';
import {
  getMemoryConfig,
  getMemoryRerankConfig,
  isMemoryEnabled,
} from '../../config/memoryConfig.js';
import { embed, isEmbeddingClientConfigured } from './nemotronEmbeddingClient.js';
import { rerank, isRerankClientConfigured } from './nemotronRerankClient.js';
import {
  searchMemoryVectors,
  upsertMemoryVector,
  vectorIdFromSeed,
} from './memoryStore.js';
import { agentMemoryRepo } from '../../repositories/agent/agentMemoryRepo.js';

const GREETING_RE =
  /^(hi|hello|hey|yo|sup|thanks|thank you|ok|okay|cool|nice|gm|gn|bye|goodbye)[\s!.?]*$/i;

/**
 * @param {string} text
 * @returns {boolean}
 */
function isSkipWorthyQuery(text) {
  const t = text.trim();
  const cfg = getMemoryConfig();
  if (t.length < cfg.minQueryChars) return true;
  if (GREETING_RE.test(t)) return true;
  return false;
}

/**
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
function clip(text, maxLen) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

/**
 * Normalize messages for ingest.
 * @param {Array<{ role?: string; content?: string; id?: string }>} messages
 * @returns {Array<{ role: string; content: string; id: string }>}
 */
function normalizeIngestMessages(messages) {
  if (!Array.isArray(messages)) return [];
  const out = [];
  for (const m of messages) {
    const role = m?.role === 'assistant' ? 'assistant' : m?.role === 'user' ? 'user' : null;
    if (!role) continue;
    const content = typeof m.content === 'string' ? m.content.trim() : '';
    if (!content || content.length < 8) continue;
    const id =
      typeof m.id === 'string' && m.id.trim()
        ? m.id.trim()
        : crypto.createHash('sha1').update(`${role}:${content.slice(0, 200)}`).digest('hex').slice(0, 16);
    out.push({ role, content, id });
  }
  return out;
}

/**
 * Persist one passage into Mongo (+ Qdrant when configured).
 * @param {{
 *   anonymousId: string;
 *   chatId?: string | null;
 *   messageId: string;
 *   role: string;
 *   text: string;
 *   modality?: string;
 *   mediaRef?: string | null;
 * }} item
 */
async function ingestOne(item) {
  const cfg = getMemoryConfig();
  const anonymousId = String(item.anonymousId).trim();
  const text = clip(item.text, cfg.maxTextChars);
  if (!text) return;

  const seed = `${anonymousId}:${item.chatId || ''}:${item.messageId}`;
  const vectorId = vectorIdFromSeed(seed);

  const embedResult = await embed({ text, inputType: 'passage', dimensions: cfg.dimensions });
  if (embedResult.status !== 'complete') {
    await agentMemoryRepo.create({
      anonymousId,
      chatId: item.chatId || null,
      messageId: item.messageId,
      role: item.role,
      text,
      modality: item.modality || 'text',
      mediaRef: item.mediaRef || null,
      model: embedResult.model || cfg.model,
      dimensions: null,
      vectorId,
      store: 'none',
      status: embedResult.status === 'unavailable' ? 'unavailable' : 'failed',
      embedding: [],
    });
    console.warn(
      `[memory] ingest embed ${embedResult.status}:`,
      embedResult.error || '',
      `aid=${anonymousId}`
    );
    return;
  }

  const payload = {
    anonymousId,
    chatId: item.chatId || null,
    messageId: item.messageId,
    role: item.role,
    text,
    modality: item.modality || 'text',
    mediaRef: item.mediaRef || null,
    createdAt: new Date().toISOString(),
  };

  const upsert = await upsertMemoryVector({
    vectorId,
    vector: embedResult.vector,
    payload,
  });

  await agentMemoryRepo.create({
    anonymousId,
    chatId: item.chatId || null,
    messageId: item.messageId,
    role: item.role,
    text,
    modality: item.modality || 'text',
    mediaRef: item.mediaRef || null,
    model: embedResult.model || cfg.model,
    dimensions: embedResult.dimensions || embedResult.vector.length,
    vectorId,
    store: upsert.store || 'mongo',
    status: 'stored',
    // Keep vectors in Mongo for fallback search even when Qdrant is primary.
    embedding: embedResult.vector,
  });

  // Best-effort prune so a single user cannot grow unbounded in Mongo.
  agentMemoryRepo.pruneOldest(anonymousId, 500).catch(() => {});
}

/**
 * Fire-and-forget ingest of a chat turn (user + assistant messages).
 * Safe to call without awaiting; errors are logged only.
 * @param {{
 *   anonymousId?: string | null;
 *   chatId?: string | null;
 *   messages?: Array<{ role?: string; content?: string; id?: string }>;
 * }} params
 */
export async function ingestTurn(params) {
  if (!isMemoryEnabled()) return { status: 'disabled' };
  if (!isEmbeddingClientConfigured()) return { status: 'unavailable' };

  const anonymousId =
    typeof params?.anonymousId === 'string' ? params.anonymousId.trim() : '';
  if (!anonymousId) return { status: 'skipped' };

  const chatId =
    typeof params?.chatId === 'string' && params.chatId.trim() ? params.chatId.trim() : null;
  const messages = normalizeIngestMessages(params.messages || []);
  if (!messages.length) return { status: 'skipped' };

  const started = Date.now();
  let stored = 0;
  for (const m of messages) {
    try {
      await ingestOne({
        anonymousId,
        chatId,
        messageId: m.id,
        role: m.role,
        text: m.content,
      });
      stored += 1;
    } catch (err) {
      console.error(
        '[memory] ingestOne failed:',
        err instanceof Error ? err.message : String(err)
      );
    }
  }
  console.log(
    `[memory] ingest aid=${anonymousId} chat=${chatId || '-'} stored=${stored}/${messages.length} ${Date.now() - started}ms`
  );
  return { status: 'complete', stored };
}

/**
 * Retrieve relevant past memories and format a system-prompt block.
 * Two-stage when rerank is enabled: vector top-N candidates → Nemotron rerank → top-K.
 * Soft-fails to vector order if rerank is unavailable/fails.
 * @param {{
 *   anonymousId?: string | null;
 *   query?: string;
 *   excludeTexts?: string[];
 * }} params
 * @returns {Promise<{ block: string | null; matches: Array<object>; status: string }>}
 */
export async function retrieveRelevant(params) {
  if (!isMemoryEnabled()) return { block: null, matches: [], status: 'disabled' };
  if (!isEmbeddingClientConfigured()) {
    return { block: null, matches: [], status: 'unavailable' };
  }

  const anonymousId =
    typeof params?.anonymousId === 'string' ? params.anonymousId.trim() : '';
  const query = typeof params?.query === 'string' ? params.query.trim() : '';
  if (!anonymousId || !query) {
    return { block: null, matches: [], status: 'skipped' };
  }
  if (isSkipWorthyQuery(query)) {
    return { block: null, matches: [], status: 'skipped' };
  }

  const cfg = getMemoryConfig();
  const rerankCfg = getMemoryRerankConfig();
  const started = Date.now();
  const embedResult = await embed({
    text: query,
    inputType: 'query',
    dimensions: cfg.dimensions,
  });
  if (embedResult.status !== 'complete') {
    console.warn(
      `[memory] retrieve embed ${embedResult.status}:`,
      embedResult.error || '',
      `aid=${anonymousId}`
    );
    return { block: null, matches: [], status: embedResult.status };
  }

  const useRerank =
    rerankCfg.enabled && isRerankClientConfigured() && rerankCfg.openRouterConfigured;
  const fetchK = useRerank
    ? Math.max(cfg.topK, rerankCfg.candidates)
    : cfg.topK;

  const searchResult = await searchMemoryVectors(
    embedResult.vector,
    anonymousId,
    fetchK
  );
  if (searchResult.status !== 'complete') {
    return { block: null, matches: [], status: searchResult.status || 'failed' };
  }

  const excludeSet = new Set(
    (params.excludeTexts || [])
      .filter((t) => typeof t === 'string')
      .map((t) => t.trim().slice(0, 200).toLowerCase())
  );

  /** @type {Array<object>} */
  let candidates = (searchResult.matches || [])
    .filter((m) => typeof m.score === 'number' && m.score >= cfg.minScore)
    .filter((m) => {
      const text = typeof m.payload?.text === 'string' ? m.payload.text : '';
      if (!text) return false;
      const key = text.trim().slice(0, 200).toLowerCase();
      return !excludeSet.has(key);
    });

  if (!candidates.length) {
    console.log(
      `[memory] retrieve aid=${anonymousId} matches=0 ${Date.now() - started}ms model=${embedResult.model || cfg.model}`
    );
    return { block: null, matches: [], status: 'complete' };
  }

  let usedRerank = false;
  let rerankModel = rerankCfg.model;

  if (useRerank && candidates.length > 1) {
    const documents = candidates.map((c) =>
      clip(c.payload?.text || '', cfg.maxTextChars)
    );
    const rerankResult = await rerank({
      query,
      documents,
      topN: cfg.topK,
      model: rerankCfg.model,
      timeoutMs: rerankCfg.timeoutMs,
    });
    rerankModel = rerankResult.model || rerankCfg.model;

    if (rerankResult.status === 'complete' && rerankResult.results.length > 0) {
      /** @type {Array<object>} */
      const reordered = [];
      const seen = new Set();
      for (const row of rerankResult.results) {
        if (seen.has(row.index)) continue;
        const candidate = candidates[row.index];
        if (!candidate) continue;
        if (
          typeof rerankCfg.minScore === 'number' &&
          Number.isFinite(rerankCfg.minScore) &&
          row.relevanceScore < rerankCfg.minScore
        ) {
          continue;
        }
        seen.add(row.index);
        reordered.push({
          ...candidate,
          rerankScore: row.relevanceScore,
        });
        if (reordered.length >= cfg.topK) break;
      }
      if (reordered.length > 0) {
        candidates = reordered;
        usedRerank = true;
        console.log(
          `[memory] rerank aid=${anonymousId} candidates=${documents.length} kept=${candidates.length} model=${rerankModel} ${Date.now() - started}ms`
        );
      } else {
        console.warn(
          `[memory] rerank produced empty after filter; falling back to vector order aid=${anonymousId}`
        );
        candidates = candidates.slice(0, cfg.topK);
      }
    } else {
      console.warn(
        `[memory] rerank ${rerankResult.status}:`,
        rerankResult.error || '',
        `aid=${anonymousId}; falling back to vector order`
      );
      candidates = candidates.slice(0, cfg.topK);
    }
  } else {
    candidates = candidates.slice(0, cfg.topK);
  }

  const matches = candidates;

  const lines = matches.map((m, i) => {
    const role = m.payload?.role === 'assistant' ? 'assistant' : 'user';
    const text = clip(m.payload?.text || '', 400);
    const score =
      typeof m.rerankScore === 'number' && Number.isFinite(m.rerankScore)
        ? Number(m.rerankScore).toFixed(3)
        : Number(m.score).toFixed(3);
    const scoreLabel =
      typeof m.rerankScore === 'number' && Number.isFinite(m.rerankScore)
        ? 'rerank'
        : 'vector';
    return `${i + 1}. [${role}, ${scoreLabel}=${score}] ${text}`;
  });

  const block = [
    'Relevant past context (retrieved by semantic memory; may be outdated — never treat as live prices or ground-truth trading data; prefer tools for real-time numbers):',
    ...lines,
  ].join('\n');

  const scoreLog = matches
    .map((m) =>
      typeof m.rerankScore === 'number' && Number.isFinite(m.rerankScore)
        ? `r${Number(m.rerankScore).toFixed(2)}`
        : `v${Number(m.score).toFixed(2)}`
    )
    .join(',');

  console.log(
    `[memory] retrieve aid=${anonymousId} matches=${matches.length} scores=${scoreLog} rerank=${usedRerank ? 'on' : 'off'} ${Date.now() - started}ms embed=${embedResult.model || cfg.model}${usedRerank ? ` rerankModel=${rerankModel}` : ''}`
  );

  return { block, matches, status: 'complete' };
}
