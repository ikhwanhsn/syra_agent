import express from 'express';
import { buildPillarsDiscovery, PILLARS, PILLAR_ORDER } from '../config/pillars.js';

export function createPillarsRouter() {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    try {
      const pillars = await buildPillarsDiscovery();
      res.json({
        success: true,
        data: {
          narrative: 'Machine Money for Agents',
          notice: [
            'x402 becomes one module (Spend)',
            'Payments become one feature',
            'Wealth becomes the narrative',
          ],
          pillars,
        },
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get('/:pillarId', (req, res) => {
    const pillarId = String(req.params.pillarId || '').toLowerCase();
    if (!PILLAR_ORDER.includes(/** @type {import('../config/pillars.js').PillarId} */ (pillarId))) {
      return res.status(404).json({ success: false, error: 'Unknown pillar' });
    }
    const def = PILLARS[/** @type {import('../config/pillars.js').PillarId} */ (pillarId)];
    return res.json({
      success: true,
      data: {
        id: def.id,
        label: def.label,
        tagline: def.tagline,
        order: def.order,
        routePrefixes: def.routePrefixes,
      },
    });
  });

  return router;
}
