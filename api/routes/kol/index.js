/**
 * KOL marketplace HTTP routes — public endpoints for s3labs /kol page.
 */
import express from "express";
import { requireMongooseConnection } from "../../config/mongoose.js";
import {
  confirmCampaignDeposit,
  createCampaign,
  createSubmission,
  getCampaignDetail,
  getWalletEarnings,
  listCampaigns,
} from "../../libs/kolMarketplaceService.js";
import { getPoolWalletAddress } from "../../services/kolPoolWallet.js";
import {
  KOL_PLATFORM_FEE_BPS,
  KOL_USER_REWARD_BPS,
  getS3labsFeeWallet,
} from "../../config/kolMarketplaceConfig.js";

function handleServiceError(res, error) {
  const code = error?.code;
  const message = error instanceof Error ? error.message : String(error);

  const statusByCode = {
    invalid_wallet: 400,
    invalid_title: 400,
    invalid_reward: 400,
    invalid_duration: 400,
    reward_too_low: 400,
    invalid_tweet_url: 400,
    invalid_tx: 400,
    invalid_id: 400,
    wallet_mismatch: 400,
    invalid_status: 400,
    campaign_ended: 400,
    duplicate_submission: 409,
    submission_not_related: 400,
    deposit_tx_invalid: 400,
    deposit_sender_mismatch: 400,
    deposit_recipient_mismatch: 400,
    deposit_amount_insufficient: 400,
    deposit_amount_mismatch: 400,
    tweet_not_found: 404,
    not_found: 404,
    twitterapi_unavailable: 503,
    mongodb_not_connected: 503,
    pool_wallet_unconfigured: 503,
  };

  const status = statusByCode[code] ?? 500;
  return res.status(status).json({ success: false, error: message, code: code ?? "internal_error" });
}

export function createKolRouter() {
  const router = express.Router();

  router.get("/config", (_req, res) => {
    return res.json({
      success: true,
      data: {
        poolWalletAddress: getPoolWalletAddress(),
        minRewardSol: 0.01,
        maxDurationDays: 90,
        kolRewardPercent: KOL_USER_REWARD_BPS / 100,
        platformFeePercent: KOL_PLATFORM_FEE_BPS / 100,
        platformFeeWallet: getS3labsFeeWallet(),
      },
    });
  });

  router.post("/campaigns", requireMongooseConnection, async (req, res) => {
    try {
      const { projectWallet, sourceTweetUrl, title, description, rewardSol, durationDays } =
        req.body || {};
      const result = await createCampaign({
        projectWallet,
        sourceTweetUrl,
        title,
        description,
        rewardSol,
        durationDays,
      });
      return res.status(201).json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.post("/campaigns/:id/confirm-deposit", requireMongooseConnection, async (req, res) => {
    try {
      const { txSignature, projectWallet } = req.body || {};
      const result = await confirmCampaignDeposit(req.params.id, { txSignature, projectWallet });
      return res.json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.get("/campaigns", requireMongooseConnection, async (req, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
      const result = await listCampaigns({ status, limit });
      return res.json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.get("/campaigns/:id", requireMongooseConnection, async (req, res) => {
    try {
      const result = await getCampaignDetail(req.params.id);
      return res.json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.post("/campaigns/:id/submissions", requireMongooseConnection, async (req, res) => {
    try {
      const { kolWallet, tweetUrl } = req.body || {};
      const result = await createSubmission(req.params.id, { kolWallet, tweetUrl });
      return res.status(201).json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.get("/wallets/:wallet/earnings", requireMongooseConnection, async (req, res) => {
    try {
      const result = await getWalletEarnings(req.params.wallet);
      return res.json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  return router;
}
