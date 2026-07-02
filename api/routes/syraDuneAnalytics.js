/**
 * Public Syra on-chain analytics (proxied from Dune).
 * GET /syra-analytics
 */
import express from 'express';
import { getSyraDuneAnalytics } from '../libs/duneAnalyticsService.js';
import { SYRA_DUNE_PUBLIC_BASE, SYRA_DUNE_QUERIES } from '../config/syraDuneAnalytics.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const force = req.query.refresh === '1' || req.query.refresh === 'true';
    const data = await getSyraDuneAnalytics(force);
    res.json({
      success: true,
      data: {
        ...data,
        links: {
          duneOverview: `${SYRA_DUNE_PUBLIC_BASE}/${SYRA_DUNE_QUERIES.overview}`,
          duneQueries: Object.fromEntries(
            Object.entries(SYRA_DUNE_QUERIES).map(([k, id]) => [k, `${SYRA_DUNE_PUBLIC_BASE}/${id}`]),
          ),
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message === 'dune_api_key_missing' ? 503 : 502;
    console.error('[syra-analytics]', message);
    res.status(status).json({
      success: false,
      error: message === 'dune_api_key_missing' ? 'Analytics temporarily unavailable' : 'Failed to load analytics',
    });
  }
});

export function createSyraDuneAnalyticsRouter() {
  return router;
}
