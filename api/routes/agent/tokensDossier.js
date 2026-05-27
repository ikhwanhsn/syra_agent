import express from 'express';
import { buildMintDossier } from '../../libs/tokensDossierService.js';

/**
 * Dashboard Mint Dossier — free aggregated Tokens.xyz read (server API key).
 * GET /agent/tokens/dossier?ref=btc | ?mint=<solana> | ?assetId=bitcoin
 */
export function createTokensDossierRouter() {
  const router = express.Router();

  router.get('/dossier', async (req, res) => {
    try {
      const ref = typeof req.query.ref === 'string' ? req.query.ref : undefined;
      const mint = typeof req.query.mint === 'string' ? req.query.mint : undefined;
      const assetId = typeof req.query.assetId === 'string' ? req.query.assetId : undefined;
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

      let input = { ref, mint, assetId };
      if (!ref && !mint && !assetId && q) {
        if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q)) {
          input = { mint: q };
        } else if (q.includes('-') && q.startsWith('solana-')) {
          input = { assetId: q };
        } else {
          input = { ref: q };
        }
      }

      const result = await buildMintDossier(input);
      if (!result.ok) {
        return res.status(result.status ?? 502).json({
          success: false,
          error: result.error,
          ...(result.requestId && { requestId: result.requestId }),
        });
      }
      return res.json({ success: true, data: result.data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Dossier request failed';
      return res.status(500).json({ success: false, error: message });
    }
  });

  return router;
}
