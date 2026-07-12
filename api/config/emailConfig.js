/** Email delivery configuration — Gmail SMTP via nodemailer. */

import {
  S3LABS_SITE_URL as RESOLVED_S3LABS_SITE_URL,
  buildS3labsSiteUrl,
} from "./s3labsSiteConfig.js";

export { buildS3labsSiteUrl } from "./s3labsSiteConfig.js";

export const GMAIL_USER = process.env.GMAIL_USER || "s3labs.company@gmail.com";

export const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";

export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "S3Labs";

/** Public website origin — always s3labs.xyz (legacy .id / .fun env values are rewritten). */
export const S3LABS_SITE_URL = RESOLVED_S3LABS_SITE_URL;

export const S3LABS_API_URL = (
  process.env.S3LABS_API_URL || "https://api.syraa.fun"
).replace(/\/$/, "");

export const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== "false";

export const EMAIL_BCC_BATCH_SIZE = Math.min(
  Math.max(Number(process.env.EMAIL_BCC_BATCH_SIZE) || 50, 1),
  100,
);

/**
 * @returns {boolean}
 */
export function isEmailConfigured() {
  return EMAIL_ENABLED && Boolean(GMAIL_USER) && Boolean(GMAIL_APP_PASSWORD);
}

/**
 * @returns {string}
 */
export function getEmailFromAddress() {
  return `"${EMAIL_FROM_NAME}" <${GMAIL_USER}>`;
}

/**
 * @param {string} token
 * @returns {string}
 */
export function buildUnsubscribeUrl(token) {
  return `${S3LABS_API_URL}/kol/unsubscribe?token=${encodeURIComponent(token)}`;
}
