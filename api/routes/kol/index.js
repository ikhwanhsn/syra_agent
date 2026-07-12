/**
 * KOL marketplace HTTP routes — public endpoints for s3labs /kol page.
 */
import express from "express";
import { requireMongooseConnection } from "../../config/mongoose.js";
import {
  claimCampaignReward,
  autoDistributeClaimableForHandle,
  confirmCampaignDeposit,
  confirmCampaignTopUp,
  createCampaign,
  createCampaignTopUp,
  enrichMissingCampaignAuthors,
  backfillSubmissionAuthorKeys,
  backfillKolReputations,
  getCampaignDetail,
  getMarketplaceStats,
  getProfile,
  getWalletEarnings,
  listCampaigns,
  listKols,
  listProjects,
} from "../../libs/kolMarketplaceService.js";
import {
  confirmXVerification,
  getWalletVerification,
  requestXVerification,
} from "../../libs/kolXVerificationService.js";
import { refreshAllMarketplaceXProfiles } from "../../libs/kolXProfileCache.js";
import {
  getWalletPoints,
  getPointsLeaderboard,
} from "../../libs/s3labsPointsService.js";
import {
  claimDailyPoints,
  getDailyClaimStatus,
} from "../../libs/s3labsDailyClaimService.js";
import { sendTestKolCampaignTelegram } from "../../libs/kolCampaignTelegramNotifier.js";
import { getPoolWalletAddress } from "../../services/kolPoolWallet.js";
import {
  KOL_PLATFORM_FEE_SOL,
  MAX_DURATION_DAYS,
  MIN_DURATION_DAYS,
  MIN_KOL_REWARD_SOL,
  MIN_KOL_PAYOUT_SOL,
  MIN_TOPUP_KOL_REWARD_SOL,
  getS3labsFeeWallet,
  minTotalDepositSol,
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
    invalid_handle: 400,
    wallet_mismatch: 400,
    invalid_status: 400,
    campaign_ended: 400,
    require_created_campaign: 403,
    topup_pending: 409,
    pending_deposit_limit: 409,
    duplicate_submission: 409,
    duplicate_kol_handle: 409,
    duplicate_post: 409,
    already_claimed: 409,
    handle_already_verified: 409,
    x_not_verified: 403,
    verification_expired: 400,
    verification_code_not_found: 400,
    submission_not_related: 400,
    deposit_tx_invalid: 400,
    deposit_sender_mismatch: 400,
    deposit_recipient_mismatch: 400,
    deposit_amount_insufficient: 400,
    deposit_amount_mismatch: 400,
    tweet_not_found: 404,
    not_found: 404,
    twitterapi_unavailable: 503,
    twitterapi_error: 502,
    mongodb_not_connected: 503,
    telegram_not_configured: 503,
    pool_wallet_unconfigured: 503,
  };

  const status = statusByCode[code] ?? 500;
  return res
    .status(status)
    .json({ success: false, error: message, code: code ?? "internal_error" });
}

export function createKolRouter() {
  const router = express.Router();

  router.get("/config", (_req, res) => {
    return res.json({
      success: true,
      data: {
        poolWalletAddress: getPoolWalletAddress(),
        minRewardSol: minTotalDepositSol(),
        minKolRewardSol: MIN_KOL_REWARD_SOL,
        minDurationDays: MIN_DURATION_DAYS,
        maxDurationDays: MAX_DURATION_DAYS,
        platformFeeSol: KOL_PLATFORM_FEE_SOL,
        minTopUpKolRewardSol: MIN_TOPUP_KOL_REWARD_SOL,
        minPayoutSol: MIN_KOL_PAYOUT_SOL,
        platformFeeWallet: getS3labsFeeWallet(),
      },
    });
  });

  router.get("/stats", requireMongooseConnection, async (_req, res) => {
    try {
      const result = await getMarketplaceStats();
      return res.json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.get("/projects", requireMongooseConnection, async (req, res) => {
    try {
      const limit =
        typeof req.query.limit === "string"
          ? Number(req.query.limit)
          : undefined;
      const sort =
        typeof req.query.sort === "string" ? req.query.sort : undefined;
      const result = await listProjects({ limit, sort });
      return res.json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.get("/kols", requireMongooseConnection, async (req, res) => {
    try {
      const limit =
        typeof req.query.limit === "string"
          ? Number(req.query.limit)
          : undefined;
      const sort =
        typeof req.query.sort === "string" ? req.query.sort : undefined;
      const result = await listKols({ limit, sort });
      return res.json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.get(
    "/profiles/:username",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const result = await getProfile(req.params.username);
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/admin/enrich-authors",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const limit =
          typeof req.body?.limit === "number" ? req.body.limit : undefined;
        const result = await enrichMissingCampaignAuthors({ limit });
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/admin/backfill-submission-keys",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const limit =
          typeof req.body?.limit === "number" ? req.body.limit : undefined;
        const result = await backfillSubmissionAuthorKeys({ limit });
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/admin/backfill-reputations",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const limit =
          typeof req.body?.limit === "number" ? req.body.limit : undefined;
        const result = await backfillKolReputations({ limit });
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/admin/refresh-x-profiles",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const force = Boolean(req.body?.force);
        const limit =
          typeof req.body?.limit === "number" ? req.body.limit : undefined;
        const result = await refreshAllMarketplaceXProfiles({ force, limit });
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post("/campaigns", requireMongooseConnection, async (req, res) => {
    try {
      const {
        projectWallet,
        sourceTweetUrl,
        title,
        description,
        rewardSol,
        durationDays,
        requireCreatedOneCampaign,
      } = req.body || {};
      const result = await createCampaign({
        projectWallet,
        sourceTweetUrl,
        title,
        description,
        rewardSol,
        durationDays,
        requireCreatedOneCampaign,
      });
      return res.status(201).json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.post(
    "/campaigns/:id/confirm-deposit",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const { txSignature, projectWallet } = req.body || {};
        const result = await confirmCampaignDeposit(req.params.id, {
          txSignature,
          projectWallet,
        });
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/campaigns/:id/top-ups",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const { projectWallet, kolRewardSol } = req.body || {};
        const result = await createCampaignTopUp(req.params.id, {
          projectWallet,
          kolRewardSol,
        });
        return res.status(201).json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/campaigns/:id/top-ups/:topUpId/confirm-deposit",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const { txSignature, projectWallet } = req.body || {};
        const result = await confirmCampaignTopUp(
          req.params.id,
          req.params.topUpId,
          {
            txSignature,
            projectWallet,
          },
        );
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.get("/campaigns", requireMongooseConnection, async (req, res) => {
    try {
      const status =
        typeof req.query.status === "string" ? req.query.status : undefined;
      const limit =
        typeof req.query.limit === "string"
          ? Number(req.query.limit)
          : undefined;
      const result = await listCampaigns({ status, limit });
      return res.json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.get("/campaigns/:id", requireMongooseConnection, async (req, res) => {
    try {
      const wallet =
        typeof req.query.wallet === "string" ? req.query.wallet : undefined;
      const result = await getCampaignDetail(req.params.id, { wallet });
      return res.json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.post(
    "/verify/request",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const { wallet, xHandle } = req.body || {};
        const result = await requestXVerification({ wallet, xHandle });
        return res.status(201).json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/verify/confirm",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const { wallet, xHandle } = req.body || {};
        const result = await confirmXVerification({ wallet, xHandle });
        let autoDistributed = { distributed: [] };
        if (result.verified && result.xHandleKey && result.wallet) {
          try {
            autoDistributed = await autoDistributeClaimableForHandle(
              result.xHandleKey,
              result.wallet,
            );
          } catch (e) {
            console.warn(
              "[kol] auto-distribute after verify failed:",
              e instanceof Error ? e.message : e,
            );
          }
        }
        return res.json({
          success: true,
          data: { ...result, autoDistributed },
        });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.get(
    "/wallets/:wallet/verification",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const result = await getWalletVerification(req.params.wallet);
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/campaigns/:id/claim",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const { wallet } = req.body || {};
        const result = await claimCampaignReward(req.params.id, { wallet });
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.get(
    "/wallets/:wallet/earnings",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const result = await getWalletEarnings(req.params.wallet);
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.get(
    "/wallets/:wallet/points",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const result = await getWalletPoints(req.params.wallet);
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.get(
    "/wallets/:wallet/daily-claim",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const result = await getDailyClaimStatus(req.params.wallet);
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/wallets/:wallet/daily-claim",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const result = await claimDailyPoints(req.params.wallet);
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.get(
    "/points/leaderboard",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const limit =
          typeof req.query.limit === "string"
            ? Number(req.query.limit)
            : undefined;
        const result = await getPointsLeaderboard({ limit });
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/admin/send-test-campaign-telegram",
    requireMongooseConnection,
    async (_req, res) => {
      try {
        const result = await sendTestKolCampaignTelegram();
        if (!result.sent) {
          return res.status(503).json({
            success: false,
            error: result.reason ?? "telegram_send_failed",
            code: "telegram_not_configured",
          });
        }
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  return router;
}
