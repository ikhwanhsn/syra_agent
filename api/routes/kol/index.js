/**
 * KOL marketplace HTTP routes — public endpoints for s3labs /kol page.
 */
import express from "express";
import { requireMongooseConnection } from "../../config/mongoose.js";
import {
  getAdminDashboardWallets,
  isAdminWalletAddress,
} from "../../libs/adminWallet.js";
import {
  claimCampaignReward,
  autoDistributeClaimableForHandle,
  confirmCampaignDeposit,
  confirmCampaignTopUp,
  createCampaign,
  createCampaignTopUp,
  createSubmission,
  cancelPendingCampaign,
  enrichMissingCampaignAuthors,
  backfillSubmissionAuthorKeys,
  backfillKolReputations,
  getCampaignDetail,
  getKolConfigForWallet,
  getMarketplaceStats,
  getProfile,
  getEarningsByHandle,
  getWalletEarnings,
  listCampaigns,
  listKols,
  listProjects,
  listWalletCampaigns,
  refreshCampaignMetrics,
} from "../../libs/kolMarketplaceService.js";
import {
  discoverCampaignHandle,
  discoverCampaignTweet,
} from "../../libs/kolDiscoveryService.js";
import KolCampaign from "../../models/KolCampaign.js";
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
import {
  claimReferralAttribution,
  createReferralCode,
  getReferralProfile,
} from "../../libs/s3labsReferralService.js";
import { sendTestKolCampaignTelegram } from "../../libs/kolCampaignTelegramNotifier.js";
import {
  sendTestCampaignEmail,
  subscribeEmail,
  unsubscribeByToken,
} from "../../libs/emailSubscriberService.js";
import { buildUnsubscribePageHtml } from "../../libs/emailTemplates/campaignEmails.js";
import { getPoolWalletAddress } from "../../services/kolPoolWallet.js";
import {
  CREATOR_SCORE_BONUS,
  KOL_PLATFORM_FEE_SOL,
  MAX_DURATION_DAYS,
  MIN_DURATION_DAYS,
  MIN_KOL_REWARD_SOL,
  MIN_KOL_PAYOUT_SOL,
  MIN_TOPUP_KOL_REWARD_SOL,
  getS3labsFeeWallet,
  minTotalDepositSol,
} from "../../config/kolMarketplaceConfig.js";

function requireAdminWallet(req, res, next) {
  const allow = getAdminDashboardWallets();
  if (allow.length === 0) {
    return res.status(403).json({ success: false, error: "admin_disabled", code: "admin_disabled" });
  }

  const fromHeader = req.get("x-admin-wallet") || req.get("x-wallet-address");
  const walletAddress =
    typeof fromHeader === "string" && fromHeader.trim() ? fromHeader.trim() : null;

  if (!walletAddress) {
    return res.status(403).json({ success: false, error: "admin_required", code: "admin_required" });
  }
  if (!isAdminWalletAddress(walletAddress)) {
    return res.status(403).json({ success: false, error: "not_admin", code: "not_admin" });
  }

  req.adminWallet = walletAddress;
  next();
}

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
    invalid_email: 400,
    invalid_token: 400,
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
    handle_mismatch: 400,
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
    invalid_code: 400,
    code_taken: 409,
    already_set: 409,
    self_referral: 400,
    twitterapi_unavailable: 503,
    twitterapi_error: 502,
    mongodb_not_connected: 503,
    telegram_not_configured: 503,
    email_not_configured: 503,
    email_send_failed: 502,
    pool_wallet_unconfigured: 503,
    admin_disabled: 403,
    admin_required: 403,
    not_admin: 403,
  };

  const status = statusByCode[code] ?? 500;
  return res
    .status(status)
    .json({ success: false, error: message, code: code ?? "internal_error" });
}

export function createKolRouter() {
  const router = express.Router();

  router.get("/config", async (req, res) => {
    try {
      const wallet =
        typeof req.query.wallet === "string" ? req.query.wallet : null;
      if (wallet) {
        const data = await getKolConfigForWallet(wallet);
        return res.json({ success: true, data });
      }
      return res.json({
        success: true,
        data: {
          poolWalletAddress: getPoolWalletAddress(),
          minRewardSol: minTotalDepositSol(),
          minKolRewardSol: MIN_KOL_REWARD_SOL,
          minDurationDays: MIN_DURATION_DAYS,
          maxDurationDays: MAX_DURATION_DAYS,
          platformFeeSol: KOL_PLATFORM_FEE_SOL,
          platformFeeSolDefault: KOL_PLATFORM_FEE_SOL,
          firstCampaignFeeWaived: false,
          creatorScoreBonus: CREATOR_SCORE_BONUS,
          minTopUpKolRewardSol: MIN_TOPUP_KOL_REWARD_SOL,
          minPayoutSol: MIN_KOL_PAYOUT_SOL,
          platformFeeWallet: getS3labsFeeWallet(),
          discoveryIntervalHours: 24,
        },
      });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.get(
    "/wallets/:wallet/campaigns",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const result = await listWalletCampaigns(req.params.wallet);
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

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

  router.get(
    "/earnings-by-x/:username",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const result = await getEarningsByHandle(req.params.username);
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
        allowedHandles,
        allowedHandleKeys,
        payoutTopN,
        payoutTopNShareBps,
      } = req.body || {};
      const result = await createCampaign({
        projectWallet,
        sourceTweetUrl,
        title,
        description,
        rewardSol,
        durationDays,
        requireCreatedOneCampaign,
        allowedHandles,
        allowedHandleKeys,
        payoutTopN,
        payoutTopNShareBps,
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
    "/campaigns/:id/cancel",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const { projectWallet } = req.body || {};
        const result = await cancelPendingCampaign(req.params.id, {
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
      const wallet =
        typeof req.query.wallet === "string" ? req.query.wallet : undefined;
      const result = await listCampaigns({ status, limit, wallet });
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
    "/campaigns/:id/submit",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const { kolWallet, tweetUrl, mode } = req.body || {};
        const result = await createSubmission(req.params.id, {
          kolWallet,
          tweetUrl,
          mode,
        });
        return res.status(201).json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/campaigns/:id/admin/snapshot",
    requireMongooseConnection,
    requireAdminWallet,
    async (req, res) => {
      try {
        const campaignId = req.params.id;
        const campaign = await KolCampaign.findById(campaignId).lean();
        if (!campaign) {
          const err = new Error("Campaign not found");
          err.code = "not_found";
          throw err;
        }
        if (campaign.status !== "active") {
          const err = new Error("Campaign must be active to snapshot");
          err.code = "invalid_status";
          throw err;
        }

        const metrics = await refreshCampaignMetrics(campaignId, {
          force: true,
        });

        const refreshed = await KolCampaign.findById(campaignId)
          .select("lastSnapshotAt")
          .lean();

        return res.json({
          success: true,
          data: {
            metrics,
            lastSnapshotAt: refreshed?.lastSnapshotAt
              ? new Date(refreshed.lastSnapshotAt).toISOString()
              : null,
          },
        });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/campaigns/:id/admin/discover-handle",
    requireMongooseConnection,
    requireAdminWallet,
    async (req, res) => {
      try {
        const handle =
          typeof req.body?.handle === "string" ? req.body.handle : "";
        if (!handle.trim()) {
          const err = new Error("Handle is required");
          err.code = "invalid_handle";
          throw err;
        }

        const result = await discoverCampaignHandle(req.params.id, handle, {
          force: true,
        });

        let metrics = null;
        if (result.found) {
          metrics = await refreshCampaignMetrics(req.params.id, { force: true });
        }

        return res.json({ success: true, data: { ...result, metrics } });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/campaigns/:id/admin/track-tweet",
    requireMongooseConnection,
    requireAdminWallet,
    async (req, res) => {
      try {
        const tweetUrl =
          typeof req.body?.tweetUrl === "string"
            ? req.body.tweetUrl
            : typeof req.body?.url === "string"
              ? req.body.url
              : "";
        if (!tweetUrl.trim()) {
          const err = new Error("X post URL is required");
          err.code = "invalid_tweet_url";
          throw err;
        }

        const result = await discoverCampaignTweet(req.params.id, tweetUrl, {
          force: true,
        });

        let metrics = null;
        if (result.found) {
          metrics = await refreshCampaignMetrics(req.params.id, { force: true });
        }

        return res.json({ success: true, data: { ...result, metrics } });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

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

  router.get("/referrals/me", requireMongooseConnection, async (req, res) => {
    try {
      const wallet =
        typeof req.query.wallet === "string" ? req.query.wallet : "";
      const result = await getReferralProfile(wallet);
      return res.json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.post(
    "/referrals/code",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const { wallet, code } = req.body || {};
        const result = await createReferralCode({ wallet, code });
        return res.status(201).json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post(
    "/referrals/claim",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const { wallet, code } = req.body || {};
        const result = await claimReferralAttribution({
          inviteeWallet: wallet,
          code,
        });
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  router.post("/subscribe", requireMongooseConnection, async (req, res) => {
    try {
      const { email, source } = req.body || {};
      const result = await subscribeEmail(
        email,
        typeof source === "string" ? source : "kol_page",
      );
      return res.status(201).json({ success: true, data: result });
    } catch (e) {
      return handleServiceError(res, e);
    }
  });

  router.get("/unsubscribe", requireMongooseConnection, async (req, res) => {
    const token =
      typeof req.query.token === "string" ? req.query.token : "";
    try {
      const result = await unsubscribeByToken(token);
      return res
        .type("html")
        .send(
          buildUnsubscribePageHtml({
            success: true,
            email: result.email,
          }),
        );
    } catch (e) {
      console.warn(
        "[kol] unsubscribe failed:",
        e instanceof Error ? e.message : e,
      );
      return res
        .status(400)
        .type("html")
        .send(buildUnsubscribePageHtml({ success: false }));
    }
  });

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

  router.post(
    "/admin/send-test-campaign-email",
    requireMongooseConnection,
    async (req, res) => {
      try {
        const email =
          typeof req.body?.email === "string" && req.body.email.trim()
            ? req.body.email.trim()
            : "ikhwanulhusna111@gmail.com";
        const result = await sendTestCampaignEmail(email);
        return res.json({ success: true, data: result });
      } catch (e) {
        return handleServiceError(res, e);
      }
    },
  );

  return router;
}
