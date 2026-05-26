/**
 * GET /agent/chains — supported execution chains (Solana, Base, BNB).
 */
import express from 'express';
import { getSyraChainsStatus } from '../../libs/syraChains.js';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({ success: true, data: getSyraChainsStatus() });
});

export function createAgentChainsRouter() {
  return router;
}
