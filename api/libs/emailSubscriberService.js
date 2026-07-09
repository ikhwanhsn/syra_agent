/**
 * Email subscriber management — subscribe, unsubscribe, campaign notifications.
 */
import crypto from "crypto";
import pLimit from "p-limit";
import { isMongooseConnected } from "../config/mongoose.js";
import {
  buildUnsubscribeUrl,
  isEmailConfigured,
} from "../config/emailConfig.js";
import EmailSubscriber from "../models/EmailSubscriber.js";
import { sendEmail } from "./emailService.js";
import {
  buildCampaignLiveEmail,
  buildWelcomeEmail,
} from "./emailTemplates/campaignEmails.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOTIFY_CONCURRENCY = 5;

function assertMongo() {
  if (!isMongooseConnected()) {
    const err = new Error("mongodb_not_connected");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

/**
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * @returns {string}
 */
function generateUnsubscribeToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * @param {string} email
 * @param {string} unsubscribeToken
 * @param {Record<string, unknown>} campaign
 */
async function sendCampaignEmailToSubscriber(email, unsubscribeToken, campaign) {
  const unsubscribeUrl = buildUnsubscribeUrl(unsubscribeToken);
  const template = buildCampaignLiveEmail({ campaign, unsubscribeUrl });

  const result = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (result.sent) {
    await EmailSubscriber.updateOne(
      { email },
      { $set: { lastNotifiedAt: new Date() } },
    );
  }

  return result;
}

/**
 * @param {string} email
 * @param {string} [source]
 */
export async function subscribeEmail(email, source = "kol_page") {
  assertMongo();

  const normalized = normalizeEmail(email);
  if (!normalized || !EMAIL_RE.test(normalized)) {
    const err = new Error("Invalid email address");
    err.code = "invalid_email";
    throw err;
  }

  const emailKey = normalized;
  const safeSource = String(source || "kol_page").slice(0, 64);

  let subscriber = await EmailSubscriber.findOne({ emailKey }).lean();
  let isNew = false;
  let token = subscriber?.unsubscribeToken;

  if (!subscriber) {
    token = generateUnsubscribeToken();
    subscriber = await EmailSubscriber.create({
      email: normalized,
      emailKey,
      status: "active",
      source: safeSource,
      unsubscribeToken: token,
    });
    isNew = true;
  } else if (subscriber.status === "unsubscribed") {
    token = subscriber.unsubscribeToken || generateUnsubscribeToken();
    await EmailSubscriber.updateOne(
      { emailKey },
      { $set: { status: "active", source: safeSource, unsubscribeToken: token } },
    );
    isNew = true;
  } else {
    token = subscriber.unsubscribeToken;
  }

  const unsubscribeUrl = buildUnsubscribeUrl(token);
  let welcomeEmailSent = false;

  if (isNew) {
    if (!isEmailConfigured()) {
      console.warn(
        "[email] Welcome email skipped — set GMAIL_APP_PASSWORD to enable delivery",
      );
    } else {
      const welcome = buildWelcomeEmail({ unsubscribeUrl });
      const welcomeResult = await sendEmail({
        to: normalized,
        subject: welcome.subject,
        html: welcome.html,
        text: welcome.text,
      });
      welcomeEmailSent = welcomeResult.sent === true;
      if (!welcomeEmailSent) {
        console.warn(
          "[email] Welcome email failed:",
          welcomeResult.reason ?? "unknown",
        );
      }
    }
  }

  return {
    subscribed: true,
    email: normalized,
    isNew,
    welcomeEmailSent,
    emailConfigured: isEmailConfigured(),
  };
}

/**
 * @param {string} token
 */
export async function unsubscribeByToken(token) {
  assertMongo();

  const safeToken = String(token || "").trim();
  if (!safeToken) {
    const err = new Error("Invalid unsubscribe token");
    err.code = "invalid_token";
    throw err;
  }

  const subscriber = await EmailSubscriber.findOne({ unsubscribeToken: safeToken });
  if (!subscriber) {
    const err = new Error("Subscriber not found");
    err.code = "not_found";
    throw err;
  }

  if (subscriber.status !== "unsubscribed") {
    subscriber.status = "unsubscribed";
    await subscriber.save();
  }

  return {
    unsubscribed: true,
    email: subscriber.email,
  };
}

/**
 * @param {Record<string, unknown>} campaign Serialized campaign from kolMarketplaceService
 */
export async function notifyNewCampaign(campaign) {
  if (!isMongooseConnected()) {
    console.warn("[email] Skipped campaign notify — MongoDB not connected");
    return { sent: false, reason: "mongodb_not_connected" };
  }

  if (!isEmailConfigured()) {
    console.warn(
      "[email] Skipped campaign notify — email not configured (set GMAIL_APP_PASSWORD)",
    );
    return { sent: false, reason: "not_configured" };
  }

  try {
    const subscribers = await EmailSubscriber.find({ status: "active" })
      .select("email unsubscribeToken")
      .lean();

    if (subscribers.length === 0) {
      return { sent: false, reason: "no_subscribers", count: 0 };
    }

    const campaignId = String(campaign.id || "");
    const limit = pLimit(NOTIFY_CONCURRENCY);
    const results = await Promise.all(
      subscribers.map((subscriber) =>
        limit(async () => {
          try {
            const result = await sendCampaignEmailToSubscriber(
              subscriber.email,
              subscriber.unsubscribeToken,
              campaign,
            );
            return {
              email: subscriber.email,
              sent: result.sent === true,
              reason: result.reason ?? null,
            };
          } catch (e) {
            return {
              email: subscriber.email,
              sent: false,
              reason: e instanceof Error ? e.message : String(e),
            };
          }
        }),
      ),
    );

    const notifiedCount = results.filter((r) => r.sent).length;
    const failed = results.filter((r) => !r.sent);

    if (failed.length > 0) {
      console.warn(
        `[email] Campaign notify partial failure campaign=${campaignId} failed=${failed.length}:`,
        failed.slice(0, 3).map((r) => `${r.email}: ${r.reason}`).join("; "),
      );
    }

    console.log(
      `[email] Campaign notify campaign=${campaignId} subscribers=${subscribers.length} sent=${notifiedCount}`,
    );

    return {
      sent: notifiedCount > 0,
      count: notifiedCount,
      failed: failed.length,
      total: subscribers.length,
    };
  } catch (e) {
    console.warn(
      "[email] Campaign notify failed:",
      e instanceof Error ? e.message : e,
    );
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Send a test campaign notification email (admin / diagnostics).
 * @param {string} email
 */
export async function sendTestCampaignEmail(email) {
  assertMongo();

  const normalized = normalizeEmail(email);
  if (!normalized || !EMAIL_RE.test(normalized)) {
    const err = new Error("Invalid email address");
    err.code = "invalid_email";
    throw err;
  }

  if (!isEmailConfigured()) {
    const err = new Error(
      "Email not configured — set GMAIL_USER and GMAIL_APP_PASSWORD",
    );
    err.code = "email_not_configured";
    throw err;
  }

  let subscriber = await EmailSubscriber.findOne({ emailKey: normalized });
  if (!subscriber) {
    subscriber = await EmailSubscriber.create({
      email: normalized,
      emailKey: normalized,
      status: "active",
      source: "test_email",
      unsubscribeToken: generateUnsubscribeToken(),
    });
  } else if (subscriber.status === "unsubscribed") {
    subscriber.status = "active";
    await subscriber.save();
  }

  const mockCampaign = {
    id: "test-campaign-email",
    title: "Test Campaign — S3Labs Email Alert",
    description:
      "This is a test email to confirm your campaign notification subscription is working.",
    rewardSol: 0.015,
    kolRewardPoolSol: 0.01,
    durationDays: 7,
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    sourceAuthorHandle: "s3labs_",
  };

  const unsubscribeUrl = buildUnsubscribeUrl(subscriber.unsubscribeToken);
  const template = buildCampaignLiveEmail({
    campaign: mockCampaign,
    unsubscribeUrl,
  });

  const result = await sendEmail({
    to: normalized,
    subject: `[TEST] ${template.subject}`,
    html: template.html,
    text: template.text,
  });

  if (!result.sent) {
    const err = new Error(result.reason ?? "Failed to send test email");
    err.code = "email_send_failed";
    throw err;
  }

  await EmailSubscriber.updateOne(
    { emailKey: normalized },
    { $set: { lastNotifiedAt: new Date() } },
  );

  return {
    sent: true,
    email: normalized,
    messageId: result.messageId ?? null,
    subscribed: true,
  };
}
