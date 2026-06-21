import express from 'express';
import { getV2Payment } from '../utils/getV2Payment.js';
import { isMongooseConnected } from '../config/mongoose.js';
import {
  getPublishedSkillBySlug,
  listPublishedSkills,
  proxySkillUpstream,
} from '../libs/skillService.js';
import { recordDirectSkillEarning } from '../libs/earnService.js';
import Skill from '../models/agent/Skill.js';

const { requirePayment, settlePaymentAndSetResponse, usdToMicroUsdc } = await getV2Payment();

const router = express.Router();

function getBaseUrl() {
  return process.env.BASE_URL?.trim() || 'https://api.syraa.fun';
}

/**
 * GET /skills — discovery catalog of published creator skills.
 */
router.get('/', async (_req, res) => {
  try {
    if (!isMongooseConnected()) {
      return res.json({ success: true, data: [] });
    }
    const data = await listPublishedSkills({ limit: 100 });
    return res.json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * Load published skill onto req.skill before payment middleware runs.
 */
async function loadPublishedSkill(req, res, next) {
  try {
    if (!isMongooseConnected()) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }
    const slug = String(req.params.slug || '').trim().toLowerCase();
    if (!slug) {
      return res.status(404).json({ success: false, error: 'Skill not found' });
    }
    const skill = await getPublishedSkillBySlug(slug);
    if (!skill?.payToAddress) {
      return res.status(404).json({ success: false, error: 'Skill not found' });
    }
    req.skill = skill;
    return next();
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
}

const skillPaymentMiddleware = requirePayment({
  description: 'Creator skill endpoint (x402 direct to earn wallet)',
  discoverable: false,
  getPriceUsd: (req) => req.skill?.priceUsd ?? 0,
  getPayTo: (req) => ({ solanaPayTo: req.skill?.payToAddress ?? null }),
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: true,
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: { type: 'object' },
    },
  },
});

async function handleSkillInvocation(req, res) {
  const skill = req.skill;
  if (!skill) {
    return res.status(404).json({ success: false, error: 'Skill not found' });
  }

  let upstream;
  try {
    upstream = await proxySkillUpstream(skill, req);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(502).json({ success: false, error: `Upstream proxy failed: ${msg}` });
  }

  const settle = await settlePaymentAndSetResponse(res, req);
  const amountMicroUsdc = Number(usdToMicroUsdc(skill.priceUsd));

  await Skill.updateOne({ _id: skill._id }, { $inc: { useCount: 1 } });

  const payoutTxSignature =
    typeof settle?.transaction === 'string'
      ? settle.transaction
      : typeof settle?.txHash === 'string'
        ? settle.txHash
        : typeof settle?.signature === 'string'
          ? settle.signature
          : null;

  await recordDirectSkillEarning({
    skillId: String(skill._id),
    creatorAnonymousId: skill.creatorAnonymousId,
    paidPath: `/skills/${skill.slug}`,
    amountMicroUsdc,
    payoutTxSignature,
  });

  if (!upstream.ok) {
    return res.status(upstream.status >= 400 ? upstream.status : 502).json({
      success: false,
      error: 'Upstream returned an error',
      upstream: upstream.body,
    });
  }

  return res.json({
    success: true,
    data: upstream.body,
    skill: {
      slug: skill.slug,
      title: skill.title,
      endpointUrl: `${getBaseUrl().replace(/\/$/, '')}/skills/${skill.slug}`,
    },
  });
}

router.get('/:slug', loadPublishedSkill, skillPaymentMiddleware, handleSkillInvocation);
router.post('/:slug', loadPublishedSkill, skillPaymentMiddleware, handleSkillInvocation);

export async function createSkillsRouter() {
  return router;
}

export async function getPublishedSkillDiscoveryResources() {
  if (!isMongooseConnected()) return [];
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const skills = await listPublishedSkills({ limit: 200 });
  return skills.map((s) => ({
    url: `${baseUrl}/skills/${s.slug}`,
    name: s.title,
    description: s.description || `Creator skill: ${s.title}`,
    price: s.priceUsd,
    slug: s.slug,
    category: s.category,
    payToAddress: s.payToAddress,
  }));
}

export default router;
