/**
 * Skill marketplace helpers — slug generation, earn wallet payTo, upstream proxy.
 */
import crypto from 'node:crypto';
import Skill from '../models/agent/Skill.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import { isMongooseConnected } from '../config/mongoose.js';
import {
  baseAnonymousIdFrom,
  siblingAnonymousId,
} from './agentWalletPurpose.js';
import { ensureAgentWalletSet } from './agentWalletProvision.js';
import {
  encryptAgentSecretForStorage,
  decryptAgentSecretFromStorage,
} from './agentWalletSecretCrypto.js';
import { validateUpstreamUrl } from './skillUpstreamGuard.js';

const UPSTREAM_TIMEOUT_MS = 30_000;
const MAX_UPSTREAM_BODY_BYTES = 512 * 1024;

/**
 * @param {string} title
 */
export function slugifyTitle(title) {
  const base = String(title || 'skill')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base || 'skill'}-${suffix}`;
}

/**
 * Resolve creator earn wallet agentAddress for direct x402 payTo.
 * @param {string} creatorAnonymousId
 */
export async function resolveCreatorEarnPayTo(creatorAnonymousId) {
  if (!isMongooseConnected()) {
    throw new Error('Database not connected');
  }

  const base = baseAnonymousIdFrom(creatorAnonymousId);
  if (!base) throw new Error('Invalid creator anonymousId');

  const earnId = siblingAnonymousId(base, 'earn');
  if (!earnId) throw new Error('Could not resolve earn wallet id');

  let wallet = await AgentWallet.findOne({ anonymousId: earnId, status: { $ne: 'retired' } }).lean();
  if (!wallet?.agentAddress) {
    await ensureAgentWalletSet({ baseAnonymousId: base, provisionedVia: 'skill_publish' });
    wallet = await AgentWallet.findOne({ anonymousId: earnId, status: { $ne: 'retired' } }).lean();
  }

  const payTo = wallet?.agentAddress?.trim();
  if (!payTo) {
    throw new Error('Earn wallet not provisioned — create agent wallets first');
  }

  return { payToAddress: payTo, earnAnonymousId: earnId };
}

/**
 * @param {Record<string, string> | null | undefined} headers
 */
export function encryptUpstreamHeaders(headers) {
  if (!headers || typeof headers !== 'object') return null;
  const cleaned = Object.fromEntries(
    Object.entries(headers)
      .filter(([k, v]) => k && typeof v === 'string' && v.trim())
      .map(([k, v]) => [String(k).trim(), String(v).trim()]),
  );
  if (Object.keys(cleaned).length === 0) return null;
  return encryptAgentSecretForStorage(JSON.stringify(cleaned));
}

/**
 * @param {string | null | undefined} stored
 * @returns {Record<string, string>}
 */
export function decryptUpstreamHeaders(stored) {
  if (!stored) return {};
  try {
    const json = decryptAgentSecretFromStorage(stored);
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([k, v]) => k && typeof v === 'string'),
    );
  } catch {
    return {};
  }
}

/**
 * @param {import('mongoose').Document | import('mongoose').LeanDocument} skill
 */
export function serializeSkill(skill, baseUrl = '') {
  const endpointUrl = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/skills/${skill.slug}`
    : `/skills/${skill.slug}`;

  return {
    id: String(skill._id),
    creatorAnonymousId: skill.creatorAnonymousId,
    slug: skill.slug,
    title: skill.title,
    description: skill.description ?? '',
    category: skill.category,
    upstreamUrl: skill.upstreamUrl,
    upstreamMethod: skill.upstreamMethod ?? 'GET',
    hasUpstreamHeaders: Boolean(skill.upstreamHeadersEnc),
    inputSchema: skill.inputSchema ?? {},
    outputSchema: skill.outputSchema ?? {},
    priceUsd: skill.priceUsd,
    payToAddress: skill.payToAddress ?? null,
    payToChain: skill.payToChain ?? 'solana',
    status: skill.status,
    useCount: skill.useCount ?? 0,
    endpointUrl,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
  };
}

/**
 * Proxy a paid skill call to the creator upstream.
 * @param {import('mongoose').LeanDocument} skill
 * @param {import('express').Request} req
 */
export async function proxySkillUpstream(skill, req) {
  const validated = await validateUpstreamUrl(skill.upstreamUrl);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  const upstream = validated.url;
  const method = (skill.upstreamMethod || 'GET').toUpperCase();
  const headers = {
    Accept: 'application/json',
    ...decryptUpstreamHeaders(skill.upstreamHeadersEnc),
  };

  if (method === 'GET') {
    for (const [key, value] of Object.entries(req.query || {})) {
      if (value != null && String(value).trim()) {
        upstream.searchParams.set(key, String(value));
      }
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const init = {
      method,
      headers,
      signal: controller.signal,
    };

    if (method === 'POST') {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(req.body ?? {});
    }

    const res = await fetch(upstream.toString(), init);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_UPSTREAM_BODY_BYTES) {
      throw new Error('Upstream response too large');
    }

    const contentType = res.headers.get('content-type') || 'application/json';
    let body;
    if (contentType.includes('application/json')) {
      try {
        body = JSON.parse(buf.toString('utf8'));
      } catch {
        body = { raw: buf.toString('utf8').slice(0, 4096) };
      }
    } else {
      body = { raw: buf.toString('utf8').slice(0, 4096) };
    }

    return {
      status: res.status,
      contentType,
      body,
      ok: res.ok,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * List published skills for discovery.
 * @param {{ limit?: number, skip?: number, category?: string }} opts
 */
export async function listPublishedSkills(opts = {}) {
  if (!isMongooseConnected()) return [];
  const filter = { status: 'published' };
  if (opts.category) filter.category = opts.category;
  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  const skip = Math.max(Number(opts.skip) || 0, 0);
  const baseUrl = process.env.BASE_URL?.trim() || 'https://api.syraa.fun';

  const rows = await Skill.find(filter)
    .sort({ useCount: -1, updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return rows.map((s) => serializeSkill(s, baseUrl));
}

/**
 * @param {string} slug
 */
export async function getPublishedSkillBySlug(slug) {
  if (!isMongooseConnected()) return null;
  return Skill.findOne({ slug: String(slug).trim().toLowerCase(), status: 'published' }).lean();
}
