/**
 * Email subscriber management — subscribe, unsubscribe, campaign notifications.
 */
import crypto from "crypto";
import { isMongooseConnected } from "../config/mongoose.js";
import {
  buildUnsubscribeUrl,
  EMAIL_BCC_BATCH_SIZE,
  GMAIL_USER,
} from "../config/emailConfig.js";
import EmailSubscriber from "../models/EmailSubscriber.js";
import { sendEmail } from "./emailService.js";
import {
  buildCampaignLiveEmail,
  buildWelcomeEmail,
} from "./emailTemplates/campaignEmails.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (isNew) {
    const welcome = buildWelcomeEmail({ unsubscribeUrl });
    sendEmail({
      to: normalized,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
    }).catch((e) => {
      console.warn(
        "[email] Welcome email failed:",
        e instanceof Error ? e.message : e,
      );
    });
  }

  return {
    subscribed: true,
    email: normalized,
    isNew,
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

  try {
    const subscribers = await EmailSubscriber.find({ status: "active" })
      .select("email unsubscribeToken")
      .lean();

    if (subscribers.length === 0) {
      return { sent: false, reason: "no_subscribers", count: 0 };
    }

    const campaignId = String(campaign.id || "");
    let sentBatches = 0;
    let notifiedCount = 0;

    for (let i = 0; i < subscribers.length; i += EMAIL_BCC_BATCH_SIZE) {
      const batch = subscribers.slice(i, i + EMAIL_BCC_BATCH_SIZE);
      const bcc = batch.map((s) => s.email);

      const unsubscribeUrl = buildUnsubscribeUrl(batch[0].unsubscribeToken);
      const template = buildCampaignLiveEmail({ campaign, unsubscribeUrl });

      const result = await sendEmail({
        to: GMAIL_USER,
        bcc,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (result.sent) {
        sentBatches += 1;
        notifiedCount += batch.length;
        const now = new Date();
        await EmailSubscriber.updateMany(
          { email: { $in: bcc } },
          { $set: { lastNotifiedAt: now } },
        );
      } else {
        console.warn(
          `[email] Campaign notify batch failed campaign=${campaignId}:`,
          result.reason,
        );
      }
    }

    console.log(
      `[email] Campaign notify campaign=${campaignId} batches=${sentBatches} subscribers=${notifiedCount}`,
    );

    return { sent: sentBatches > 0, batches: sentBatches, count: notifiedCount };
  } catch (e) {
    console.warn(
      "[email] Campaign notify failed:",
      e instanceof Error ? e.message : e,
    );
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
