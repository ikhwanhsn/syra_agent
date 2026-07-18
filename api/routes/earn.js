import express from 'express';
import multer from 'multer';
import { requireSession } from '../utils/requireSession.js';
import { getEarnSummary, processEarnPayout } from '../libs/earnService.js';
import {
  collectEarnPumpfunFees,
  getEarnPumpfunLaunchByMint,
  launchEarnPumpfunToken,
  listEarnPumpfunLaunches,
  listMarketplaceEarnPumpfunLaunches,
  resolveEarnWalletForSession,
  uploadPumpfunMetadata,
  verifyEarnTokenOnSaid,
  withSyraTokenNameSuffix,
} from '../libs/earnPumpfunService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export function createEarnRouter() {
  const router = express.Router();

  router.get('/summary', async (req, res) => {
    try {
      const wallet =
        (typeof req.query.wallet === 'string' && req.query.wallet.trim()) ||
        (typeof req.query.anonymousId === 'string' && req.query.anonymousId.trim()) ||
        null;
      if (!wallet) {
        return res.status(400).json({ success: false, error: 'wallet or anonymousId query param required' });
      }
      const data = await getEarnSummary(wallet);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/summary/:wallet', async (req, res) => {
    try {
      const data = await getEarnSummary(req.params.wallet);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/payout', requireSession(), async (req, res) => {
    try {
      const anonymousId = req.user?.anonymousId;
      if (!anonymousId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      const targetAnonymousId =
        (typeof req.body?.creatorAnonymousId === 'string' && req.body.creatorAnonymousId.trim()) ||
        anonymousId;
      const maxPayoutMicroUsdc =
        req.body?.maxPayoutMicroUsdc != null ? Number(req.body.maxPayoutMicroUsdc) : undefined;
      const result = await processEarnPayout({
        creatorAnonymousId: targetAnonymousId,
        maxPayoutMicroUsdc,
      });
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  /**
   * GET /earn/token/marketplace
   * Public discovery — recent pump.fun launches from all earn creators.
   */
  router.get('/token/marketplace', async (req, res) => {
    try {
      const limit = req.query.limit;
      const skip = req.query.skip;
      const launches = await listMarketplaceEarnPumpfunLaunches({ limit, skip });
      return res.json({ success: true, data: { launches } });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  /** GET /earn/token/launches — tokens launched from earn wallet */
  router.get('/token/launches', requireSession({ allowGuest: true }), async (req, res) => {
    try {
      const wallet =
        (typeof req.query.wallet === 'string' && req.query.wallet.trim()) ||
        req.user?.anonymousId ||
        null;
      if (!wallet) {
        return res.status(400).json({ success: false, error: 'wallet query param required' });
      }
      const resolved = await resolveEarnWalletForSession(wallet, req.user?.walletAddress || null);
      const launches = await listEarnPumpfunLaunches(resolved.earnAnonymousId);
      return res.json({
        success: true,
        data: {
          earnAnonymousId: resolved.earnAnonymousId,
          earnAgentAddress: resolved.earnAgentAddress,
          launches,
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = msg.includes('not_provisioned') || msg.includes('required') ? 400 : 500;
      return res.status(status).json({ success: false, error: msg });
    }
  });

  /** POST /earn/token/metadata — upload image + fields to pump.fun IPFS */
  router.post(
    '/token/metadata',
    requireSession({ allowGuest: false }),
    (req, res, next) => {
      upload.single('file')(req, res, (err) => {
        if (err) {
          const msg = err instanceof Error ? err.message : 'Upload failed';
          const code = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
          return res.status(code).json({ success: false, error: msg });
        }
        next();
      });
    },
    async (req, res) => {
      try {
        if (!req.file?.buffer?.length) {
          return res.status(400).json({ success: false, error: 'file is required (image)' });
        }
        const name = withSyraTokenNameSuffix(String(req.body?.name || '').trim());
        const symbol = String(req.body?.symbol || '').trim();
        if (!name || !symbol) {
          return res.status(400).json({ success: false, error: 'name and symbol are required' });
        }
        const fields = {
          name,
          symbol: symbol.toUpperCase(),
          description: String(req.body?.description || '').trim(),
          twitter: String(req.body?.twitter || '').trim(),
          telegram: String(req.body?.telegram || '').trim(),
          website: String(req.body?.website || '').trim(),
          showName: 'true',
        };
        const out = await uploadPumpfunMetadata(
          fields,
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname,
        );
        return res.json({ success: true, data: out });
      } catch (e) {
        return res.status(502).json({
          success: false,
          error: e instanceof Error ? e.message : 'metadata_upload_failed',
        });
      }
    },
  );

  /** POST /earn/token/launch — create coin on pump.fun via earn agent wallet */
  router.post('/token/launch', requireSession({ allowGuest: false }), async (req, res) => {
    try {
      const name = withSyraTokenNameSuffix(String(req.body?.name || '').trim());
      const symbol = String(req.body?.symbol || '').trim();
      const uri = String(req.body?.uri || req.body?.metadataUri || '').trim();
      const solLamports = String(req.body?.solLamports || '').trim();
      if (!name || !symbol || !uri || !solLamports) {
        return res.status(400).json({
          success: false,
          error: 'name, symbol, uri, and solLamports are required',
        });
      }

      const resolved = await resolveEarnWalletForSession(
        req.user?.anonymousId,
        req.user?.walletAddress || null,
      );

      const imageUri =
        typeof req.body?.imageUri === 'string' ? req.body.imageUri.trim() : null;
      const description =
        typeof req.body?.description === 'string' ? req.body.description.trim() : null;

      const result = await launchEarnPumpfunToken({
        earnAnonymousId: resolved.earnAnonymousId,
        earnAgentAddress: resolved.earnAgentAddress,
        name,
        symbol,
        uri,
        solLamports,
        imageUri,
        description,
        ctx: {
          host: req.get('host'),
          user: req.user,
          ip: req.ip,
          userAgent: req.get('user-agent') || undefined,
        },
      });

      if (!result.success) {
        if (result.limitReached) {
          return res.status(409).json({
            success: false,
            error: result.error || 'earn_token_limit_reached',
            existingMint: result.existingMint || null,
            limitReached: true,
          });
        }
        const status = result.insufficientBalance ? 402 : 400;
        return res.status(status).json(result);
      }

      return res.json({
        success: true,
        data: {
          mint: result.mint,
          signature: result.signature,
          imageUri: result.imageUri || null,
          submittedOnChain: result.submittedOnChain,
          submitError: result.submitError,
          confirmationRequired: result.confirmationRequired,
          intentId: result.intentId,
          earnAgentAddress: resolved.earnAgentAddress,
        },
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : 'launch_failed',
      });
    }
  });

  /** GET /earn/token/:mint — public token detail (after literal /token/* routes) */
  router.get('/token/:mint', async (req, res) => {
    try {
      const mint = String(req.params.mint || '').trim();
      if (!mint) {
        return res.status(400).json({ success: false, error: 'invalid_mint' });
      }
      const launch = await getEarnPumpfunLaunchByMint(mint);
      if (!launch) {
        return res.status(404).json({ success: false, error: 'token_not_found' });
      }
      return res.json({ success: true, data: { launch } });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  /** POST /earn/token/:mint/verify-said — register + verify token earn wallet on SAID Protocol */
  router.post('/token/:mint/verify-said', requireSession({ allowGuest: false }), async (req, res) => {
    try {
      const mint = String(req.params.mint || '').trim();
      if (!mint) {
        return res.status(400).json({ success: false, error: 'invalid_mint' });
      }

      const resolved = await resolveEarnWalletForSession(
        req.user?.anonymousId,
        req.user?.walletAddress || null,
      );

      const result = await verifyEarnTokenOnSaid({
        earnAnonymousId: resolved.earnAnonymousId,
        earnAgentAddress: resolved.earnAgentAddress,
        mint,
      });

      if (!result.success) {
        if (result.error === 'not_owner') {
          return res.status(403).json(result);
        }
        if (result.error === 'token_not_found') {
          return res.status(404).json(result);
        }
        if (result.insufficientBalance) {
          return res.status(402).json(result);
        }
        return res.status(400).json(result);
      }

      return res.json({
        success: true,
        data: {
          saidVerified: result.saidVerified,
          alreadyVerified: result.alreadyVerified,
          alreadyRegistered: result.alreadyRegistered,
          saidAgentWallet: result.saidAgentWallet,
          saidAgentPDA: result.saidAgentPDA,
          saidMetadataUri: result.saidMetadataUri,
          saidRegisterSignature: result.saidRegisterSignature,
          saidVerifySignature: result.saidVerifySignature,
          saidProfileUrl: result.saidProfileUrl,
        },
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : 'said_verify_failed',
      });
    }
  });

  /** POST /earn/token/collect-fees — claim pump.fun creator fees to earn wallet */
  router.post('/token/collect-fees', requireSession({ allowGuest: false }), async (req, res) => {
    try {
      const mint = String(req.body?.mint || '').trim();
      if (!mint) {
        return res.status(400).json({ success: false, error: 'mint is required' });
      }

      const resolved = await resolveEarnWalletForSession(
        req.user?.anonymousId,
        req.user?.walletAddress || null,
      );

      const result = await collectEarnPumpfunFees({
        earnAnonymousId: resolved.earnAnonymousId,
        earnAgentAddress: resolved.earnAgentAddress,
        mint,
        ctx: {
          host: req.get('host'),
          user: req.user,
          ip: req.ip,
          userAgent: req.get('user-agent') || undefined,
        },
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json({
        success: true,
        data: {
          mint,
          signature: result.signature,
          submittedOnChain: result.submittedOnChain,
          submitError: result.submitError,
          confirmationRequired: result.confirmationRequired,
          intentId: result.intentId,
        },
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : 'collect_failed',
      });
    }
  });

  return router;
}
