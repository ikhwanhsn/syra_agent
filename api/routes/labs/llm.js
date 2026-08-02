/**
 * Admin-gated LLM playground API — proxies OpenRouter modalities for internal team testing.
 * Mounted at /labs/llm. Uses OPENROUTER_API_KEY (no x402 payment).
 */
import express from 'express';
import { getAdminDashboardWallets, isAdminWalletAddress } from '../../libs/adminWallet.js';
import { requireSession } from '../../utils/requireSession.js';
import { isLlmModality, LLM_MODALITIES } from '../../config/openrouterLlmModels.js';
import {
  listModelsForModality,
  generateImage,
  submitVideo,
  getVideoStatus,
  createEmbeddings,
  rerankDocuments,
  synthesizeSpeech,
  transcribeAudio,
} from '../../libs/labs/llmPlaygroundService.js';

/**
 * Admin gate (SECURITY): previous `x-admin-wallet` / `x-wallet-address` header fallback was
 * spoofable. Require a Syra session JWT whose verified wallet is on the admin allowlist.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAdminWallet(req, res, next) {
  const allow = getAdminDashboardWallets();
  if (allow.length === 0) {
    return res.status(403).json({ success: false, error: 'admin_disabled' });
  }

  if (!req.user || req.user.guest || !req.user.walletAddress) {
    return res.status(401).json({ success: false, error: 'auth_required' });
  }
  if (!isAdminWalletAddress(req.user.walletAddress)) {
    return res.status(403).json({ success: false, error: 'not_admin' });
  }
  next();
}

/**
 * @param {unknown} err
 * @param {import('express').Response} res
 * @param {string} fallback
 */
function sendError(err, res, fallback) {
  const status =
    typeof err?.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 502;
  const message = err instanceof Error ? err.message : fallback;
  console.warn('[labs/llm]', status, message);
  return res.status(status).json({
    success: false,
    error: message,
    ...(err?.raw && { details: err.raw }),
  });
}

export function createLlmPlaygroundRouter() {
  const router = express.Router();
  router.use(requireSession(), requireAdminWallet);

  router.get('/models', async (req, res) => {
    try {
      const modality = typeof req.query?.modality === 'string' ? req.query.modality.trim() : '';
      if (!isLlmModality(modality)) {
        return res.status(400).json({
          success: false,
          error: `modality is required and must be one of: ${LLM_MODALITIES.join(', ')}`,
        });
      }
      const data = await listModelsForModality(modality);
      return res.json({ success: true, data });
    } catch (err) {
      return sendError(err, res, 'Failed to list models');
    }
  });

  router.post('/image', async (req, res) => {
    try {
      const data = await generateImage(req.body ?? {});
      return res.json({ success: true, data });
    } catch (err) {
      return sendError(err, res, 'Image generation failed');
    }
  });

  router.post('/video', async (req, res) => {
    try {
      const data = await submitVideo(req.body ?? {});
      return res.json({ success: true, data });
    } catch (err) {
      return sendError(err, res, 'Video generation failed');
    }
  });

  router.get('/video/:id', async (req, res) => {
    try {
      const data = await getVideoStatus(req.params.id);
      return res.json({ success: true, data });
    } catch (err) {
      return sendError(err, res, 'Video status failed');
    }
  });

  /**
   * Bandwidth: never pipe OpenRouter video bytes through Render (2× egress).
   * Prefer a public/direct URL from status; otherwise return JSON with redirect hint.
   */
  router.get('/video/:id/content', async (req, res) => {
    try {
      const data = await getVideoStatus(req.params.id);
      const directUrl =
        (typeof data?.url === 'string' && data.url.trim()) ||
        (typeof data?.video_url === 'string' && data.video_url.trim()) ||
        null;

      if (directUrl && !/unsigned|openrouter\.ai\/api\//i.test(directUrl)) {
        res.setHeader('Cache-Control', 'private, max-age=60');
        return res.redirect(302, directUrl);
      }

      return res.status(200).json({
        success: false,
        error: 'video_proxy_disabled',
        message:
          'Video byte proxying through Syra is disabled to reduce Render egress. Use a direct video URL from GET /labs/llm/video/:id when the provider returns one.',
        data: {
          url: directUrl,
          content_proxy_disabled: true,
        },
      });
    } catch (err) {
      return sendError(err, res, 'Video content failed');
    }
  });

  router.post('/embeddings', async (req, res) => {
    try {
      const data = await createEmbeddings(req.body ?? {});
      return res.json({ success: true, data });
    } catch (err) {
      return sendError(err, res, 'Embeddings failed');
    }
  });

  router.post('/rerank', async (req, res) => {
    try {
      const data = await rerankDocuments(req.body ?? {});
      return res.json({ success: true, data });
    } catch (err) {
      return sendError(err, res, 'Rerank failed');
    }
  });

  router.post('/speech', async (req, res) => {
    try {
      const data = await synthesizeSpeech(req.body ?? {});
      return res.json({ success: true, data });
    } catch (err) {
      return sendError(err, res, 'Speech synthesis failed');
    }
  });

  router.post('/transcription', async (req, res) => {
    try {
      const data = await transcribeAudio(req.body ?? {});
      return res.json({ success: true, data });
    } catch (err) {
      return sendError(err, res, 'Transcription failed');
    }
  });

  return router;
}


