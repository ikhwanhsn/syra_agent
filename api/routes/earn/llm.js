/**
 * Earn LLM Exchange — seller CRUD, public marketplace, payout claim.
 * Mounted at /earn/llm
 */
import express from 'express';
import LlmProvider from '../../models/LlmProvider.js';
import { requireSession, optionalWalletSession } from '../../utils/requireSession.js';
import { isMongooseConnected } from '../../config/mongoose.js';
import { baseAnonymousIdFrom, ownsAgentWalletSibling } from '../../libs/agentWalletPurpose.js';
import { resolveCreatorEarnPayTo } from '../../libs/skillService.js';
import {
  claimLlmProviderPayout,
  encryptLlmApiKey,
  getLlmEarningsSummary,
  normalizePricing,
  serializeLlmProvider,
  slugifyLlmTitle,
  testLlmProviderConnection,
  validateLlmBaseUrl,
} from '../../libs/llmService.js';
import {
  normalizeAuthConfig,
  normalizeLlmProtocol,
} from '../../libs/llmAdapters.js';
import { LLM_PROTOCOLS } from '../../models/LlmProvider.js';
import { LLM_EXCHANGE_STAKER_MIN_SYRA } from '../../config/x402Pricing.js';

const router = express.Router();

function requireDb(_req, res, next) {
  if (!isMongooseConnected()) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }
  return next();
}

function assertCreator(req, res, creatorAnonymousId) {
  const sessionAid = req.user?.anonymousId;
  if (!sessionAid) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return false;
  }
  if (!ownsAgentWalletSibling(sessionAid, creatorAnonymousId)) {
    res.status(403).json({ success: false, error: 'You can only manage your own LLM listings' });
    return false;
  }
  return true;
}

function parseModels(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const models = [];
  for (const m of raw) {
    if (typeof m === 'string' && m.trim()) {
      models.push({ id: m.trim(), displayName: m.trim() });
      continue;
    }
    if (m && typeof m === 'object' && typeof m.id === 'string' && m.id.trim()) {
      models.push({
        id: m.id.trim(),
        displayName: typeof m.displayName === 'string' && m.displayName.trim()
          ? m.displayName.trim()
          : m.id.trim(),
      });
    }
  }
  return models.length > 0 ? models : null;
}

function parseCapabilities(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  return {
    contextWindow: Math.max(1, Number(c.contextWindow) || 8192),
    streaming: Boolean(c.streaming),
    tools: Boolean(c.tools),
    modalities: Array.isArray(c.modalities) && c.modalities.length > 0
      ? c.modalities.map(String)
      : ['text'],
  };
}

/**
 * @param {unknown} raw
 */
function parseProtocol(raw) {
  if (raw == null || raw === '') return { ok: true, protocol: 'openai' };
  const protocol = normalizeLlmProtocol(raw);
  if (!LLM_PROTOCOLS.includes(protocol)) {
    return {
      ok: false,
      error: `protocol must be one of: ${LLM_PROTOCOLS.join(', ')}`,
    };
  }
  return { ok: true, protocol };
}

/**
 * @param {unknown} raw
 * @param {string} protocol
 */
function parseAuthConfig(raw, protocol) {
  const authConfig = normalizeAuthConfig(raw);
  if (protocol === 'openai_custom') {
    if (!authConfig.chatPath) {
      authConfig.chatPath = '/chat/completions';
    }
    if (!authConfig.authHeader) {
      authConfig.authHeader = 'Authorization';
    }
    if (!authConfig.authScheme) {
      authConfig.authScheme = 'bearer';
    }
  }
  return authConfig;
}

async function resolveFeatured(payoutWallet) {
  const wallet = typeof payoutWallet === 'string' ? payoutWallet.trim() : '';
  if (!wallet || wallet.startsWith('0x')) return false;
  try {
    const { getSyraBalance } = await import('../../libs/syraToken.js');
    const { getActiveStakedSyra } = await import('../../libs/syraStakingEligibility.js');
    const [bal, staked] = await Promise.all([
      getSyraBalance(wallet).catch(() => 0),
      getActiveStakedSyra(wallet).catch(() => 0),
    ]);
    return Math.max(Number(bal) || 0, Number(staked) || 0) >= LLM_EXCHANGE_STAKER_MIN_SYRA;
  } catch {
    return false;
  }
}

/**
 * GET /earn/llm/marketplace — public active listings
 */
router.get('/marketplace', requireDb, async (req, res) => {
  try {
    const limitNum = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const skipNum = Math.max(Number(req.query.skip) || 0, 0);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const filter = { status: 'active', isSystemFallback: { $ne: true } };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { 'models.id': { $regex: q, $options: 'i' } },
      ];
    }

    const docs = await LlmProvider.find(filter)
      .sort({ featured: -1, 'health.callabilityScore': -1, useCount: -1, updatedAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    return res.json({
      success: true,
      data: docs.map((d) => serializeLlmProvider(d)),
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

/**
 * GET /earn/llm/mine
 */
router.get('/mine', requireSession(), requireDb, async (req, res) => {
  try {
    const anonymousId = req.user?.anonymousId;
    if (!anonymousId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const base = baseAnonymousIdFrom(anonymousId);
    const docs = await LlmProvider.find({
      creatorAnonymousId: base,
      isSystemFallback: { $ne: true },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: docs.map((d) => serializeLlmProvider(d, { includeOwnerFields: true })),
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

/**
 * GET /earn/llm/earnings
 */
router.get('/earnings', requireSession(), requireDb, async (req, res) => {
  try {
    const anonymousId = req.user?.anonymousId;
    if (!anonymousId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const data = await getLlmEarningsSummary(baseAnonymousIdFrom(anonymousId));
    return res.json({ success: true, data });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

/**
 * POST /earn/llm/payouts/claim
 */
router.post('/payouts/claim', requireSession(), requireDb, async (req, res) => {
  try {
    const anonymousId = req.user?.anonymousId;
    if (!anonymousId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const result = await claimLlmProviderPayout({
      creatorAnonymousId: baseAnonymousIdFrom(anonymousId),
      maxPayoutUsd: Number(req.body?.maxPayoutUsd) || undefined,
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

/**
 * POST /earn/llm/test-connection — validate URL + key before/while listing
 */
router.post('/test-connection', requireSession(), requireDb, async (req, res) => {
  try {
    const { baseUrl, apiKey, modelId, providerId, protocol: rawProtocol, authConfig } =
      req.body || {};

    if (providerId) {
      const doc = await LlmProvider.findById(providerId).lean();
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Provider not found' });
      }
      if (!assertCreator(req, res, doc.creatorAnonymousId)) return;
      const result = await testLlmProviderConnection(doc, { modelId });
      return res.json({ success: result.ok, data: result });
    }

    const protocolParsed = parseProtocol(rawProtocol);
    if (!protocolParsed.ok) {
      return res.status(400).json({ success: false, error: protocolParsed.error });
    }
    const protocol = protocolParsed.protocol;
    const parsedAuth = parseAuthConfig(authConfig, protocol);

    const urlCheck = await validateLlmBaseUrl(baseUrl, { protocol });
    if (!urlCheck.ok) {
      return res.status(400).json({ success: false, error: urlCheck.error });
    }
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ success: false, error: 'apiKey is required for test' });
    }

    const result = await testLlmProviderConnection(
      {
        baseUrl: urlCheck.url,
        protocol,
        authConfig: parsedAuth,
        apiKeyEnc: encryptLlmApiKey(apiKey),
        models: modelId ? [{ id: String(modelId) }] : [],
      },
      { modelId },
    );
    return res.json({ success: result.ok, data: result });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

/**
 * POST /earn/llm — create draft listing
 */
router.post('/', requireSession(), requireDb, async (req, res) => {
  try {
    const anonymousId = req.user?.anonymousId;
    if (!anonymousId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const {
      title,
      description,
      baseUrl,
      apiKey,
      models,
      pricing,
      capabilities,
      slug: requestedSlug,
      activate,
      protocol: rawProtocol,
      authConfig,
    } = req.body || {};

    if (!title?.trim()) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }

    const protocolParsed = parseProtocol(rawProtocol);
    if (!protocolParsed.ok) {
      return res.status(400).json({ success: false, error: protocolParsed.error });
    }
    const protocol = protocolParsed.protocol;
    const parsedAuth = parseAuthConfig(authConfig, protocol);

    const urlCheck = await validateLlmBaseUrl(baseUrl, { protocol });
    if (!urlCheck.ok) {
      return res.status(400).json({ success: false, error: urlCheck.error });
    }

    const parsedModels = parseModels(models);
    if (!parsedModels) {
      return res.status(400).json({ success: false, error: 'models must be a non-empty array' });
    }

    const pricingNorm = normalizePricing(pricing);
    if (!pricingNorm.ok) {
      return res.status(400).json({ success: false, error: pricingNorm.error });
    }

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ success: false, error: 'apiKey is required' });
    }

    const base = baseAnonymousIdFrom(anonymousId);
    const slug = requestedSlug?.trim()
      ? String(requestedSlug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : slugifyLlmTitle(title);

    const existing = await LlmProvider.findOne({ slug }).lean();
    if (existing) {
      return res.status(409).json({ success: false, error: 'slug already taken' });
    }

    let payoutWallet = null;
    try {
      const resolved = await resolveCreatorEarnPayTo(base);
      payoutWallet = resolved.payToAddress;
    } catch {
      payoutWallet = null;
    }

    const featured = await resolveFeatured(payoutWallet);
    const shouldActivate = Boolean(activate);

    if (shouldActivate) {
      const probe = await testLlmProviderConnection(
        {
          baseUrl: urlCheck.url,
          protocol,
          authConfig: parsedAuth,
          apiKeyEnc: encryptLlmApiKey(apiKey),
          models: parsedModels,
        },
        { modelId: parsedModels[0].id },
      );
      if (!probe.ok) {
        return res.status(400).json({
          success: false,
          error: `Connection test failed: ${probe.error || 'unknown'}`,
          data: probe,
        });
      }
    }

    const doc = await LlmProvider.create({
      creatorAnonymousId: base,
      slug,
      title: String(title).trim(),
      description: description != null ? String(description).trim() : '',
      baseUrl: urlCheck.url,
      protocol,
      authConfig: parsedAuth,
      apiKeyEnc: encryptLlmApiKey(apiKey),
      models: parsedModels,
      pricing: pricingNorm.pricing,
      capabilities: parseCapabilities(capabilities),
      payoutWallet,
      status: shouldActivate ? 'active' : 'draft',
      featured,
      isSystemFallback: false,
    });

    return res.status(201).json({
      success: true,
      data: serializeLlmProvider(doc.toObject(), { includeOwnerFields: true }),
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

/**
 * GET /earn/llm/:id
 */
router.get('/:id', optionalWalletSession(), requireDb, async (req, res) => {
  try {
    const doc = await LlmProvider.findById(req.params.id).lean();
    if (!doc || doc.isSystemFallback) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }

    const sessionAid = req.user?.anonymousId;
    const isOwner =
      sessionAid && ownsAgentWalletSibling(sessionAid, doc.creatorAnonymousId);

    if (doc.status !== 'active' && !isOwner) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }

    return res.json({
      success: true,
      data: serializeLlmProvider(doc, { includeOwnerFields: Boolean(isOwner) }),
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

/**
 * PATCH /earn/llm/:id
 */
router.patch('/:id', requireSession(), requireDb, async (req, res) => {
  try {
    const doc = await LlmProvider.findById(req.params.id);
    if (!doc || doc.isSystemFallback) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    if (!assertCreator(req, res, doc.creatorAnonymousId)) return;

    const {
      title,
      description,
      baseUrl,
      apiKey,
      models,
      pricing,
      capabilities,
      payoutWallet,
      protocol: rawProtocol,
      authConfig,
    } = req.body || {};

    if (title !== undefined) doc.title = String(title).trim();
    if (description !== undefined) doc.description = String(description).trim();

    let nextProtocol = normalizeLlmProtocol(doc.protocol);
    if (rawProtocol !== undefined) {
      const protocolParsed = parseProtocol(rawProtocol);
      if (!protocolParsed.ok) {
        return res.status(400).json({ success: false, error: protocolParsed.error });
      }
      nextProtocol = protocolParsed.protocol;
      doc.protocol = nextProtocol;
    }

    if (authConfig !== undefined) {
      doc.authConfig = parseAuthConfig(authConfig, nextProtocol);
    } else if (rawProtocol !== undefined) {
      doc.authConfig = parseAuthConfig(doc.authConfig, nextProtocol);
    }

    if (baseUrl !== undefined || rawProtocol !== undefined) {
      const urlCheck = await validateLlmBaseUrl(
        baseUrl !== undefined ? baseUrl : doc.baseUrl,
        { protocol: nextProtocol },
      );
      if (!urlCheck.ok) {
        return res.status(400).json({ success: false, error: urlCheck.error });
      }
      doc.baseUrl = urlCheck.url;
    }

    if (apiKey !== undefined) {
      if (typeof apiKey !== 'string' || !apiKey.trim()) {
        return res.status(400).json({ success: false, error: 'apiKey must be a non-empty string' });
      }
      doc.apiKeyEnc = encryptLlmApiKey(apiKey);
    }

    if (models !== undefined) {
      const parsedModels = parseModels(models);
      if (!parsedModels) {
        return res.status(400).json({ success: false, error: 'models must be a non-empty array' });
      }
      doc.models = parsedModels;
    }

    if (pricing !== undefined) {
      const pricingNorm = normalizePricing(pricing);
      if (!pricingNorm.ok) {
        return res.status(400).json({ success: false, error: pricingNorm.error });
      }
      doc.pricing = pricingNorm.pricing;
    }

    if (capabilities !== undefined) {
      doc.capabilities = parseCapabilities(capabilities);
    }

    if (payoutWallet !== undefined) {
      const w = typeof payoutWallet === 'string' ? payoutWallet.trim() : '';
      doc.payoutWallet = w || doc.payoutWallet;
    }

    doc.featured = await resolveFeatured(doc.payoutWallet);
    await doc.save();

    return res.json({
      success: true,
      data: serializeLlmProvider(doc.toObject(), { includeOwnerFields: true }),
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

/**
 * POST /earn/llm/:id/activate
 */
router.post('/:id/activate', requireSession(), requireDb, async (req, res) => {
  try {
    const doc = await LlmProvider.findById(req.params.id);
    if (!doc || doc.isSystemFallback) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    if (!assertCreator(req, res, doc.creatorAnonymousId)) return;

    if (!doc.payoutWallet) {
      try {
        const resolved = await resolveCreatorEarnPayTo(doc.creatorAnonymousId);
        doc.payoutWallet = resolved.payToAddress;
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: e instanceof Error ? e.message : 'Earn wallet required before activate',
        });
      }
    }

    const probe = await testLlmProviderConnection(doc.toObject(), {
      modelId: doc.models?.[0]?.id,
    });
    if (!probe.ok) {
      return res.status(400).json({
        success: false,
        error: `Connection test failed: ${probe.error || 'unknown'}`,
        data: probe,
      });
    }

    doc.status = 'active';
    doc.featured = await resolveFeatured(doc.payoutWallet);
    doc.health = {
      ...(doc.health?.toObject?.() ?? doc.health ?? {}),
      consecutiveFailures: 0,
      lastProbeAt: new Date(),
      lastSuccessAt: new Date(),
      callabilityScore: Math.max(Number(doc.health?.callabilityScore) || 0, 0.8),
      lastError: null,
    };
    await doc.save();

    return res.json({
      success: true,
      data: serializeLlmProvider(doc.toObject(), { includeOwnerFields: true }),
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

/**
 * POST /earn/llm/:id/pause
 */
router.post('/:id/pause', requireSession(), requireDb, async (req, res) => {
  try {
    const doc = await LlmProvider.findById(req.params.id);
    if (!doc || doc.isSystemFallback) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    if (!assertCreator(req, res, doc.creatorAnonymousId)) return;

    doc.status = 'paused';
    await doc.save();
    return res.json({
      success: true,
      data: serializeLlmProvider(doc.toObject(), { includeOwnerFields: true }),
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

/**
 * DELETE /earn/llm/:id — soft delist
 */
router.delete('/:id', requireSession(), requireDb, async (req, res) => {
  try {
    const doc = await LlmProvider.findById(req.params.id);
    if (!doc || doc.isSystemFallback) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    if (!assertCreator(req, res, doc.creatorAnonymousId)) return;

    const hard = req.query.hard === '1' || req.body?.hard === true;
    if (hard) {
      await LlmProvider.findByIdAndDelete(doc._id);
      return res.json({ success: true });
    }

    doc.status = 'delisted';
    await doc.save();
    return res.json({
      success: true,
      data: serializeLlmProvider(doc.toObject(), { includeOwnerFields: true }),
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
});

export function createEarnLlmRouter() {
  return router;
}

export default router;
