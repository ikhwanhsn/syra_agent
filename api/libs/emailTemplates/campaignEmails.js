/**
 * Professional HTML + plaintext email templates for S3Labs campaign notifications.
 */
import { S3LABS_SITE_URL, buildS3labsSiteUrl } from "../../config/emailConfig.js";

const BRAND_COLOR = "#7c3aed";
const BG_COLOR = "#0a0a0f";
const CARD_BG = "#12121a";
const TEXT_COLOR = "#e4e4e7";
const MUTED_COLOR = "#a1a1aa";
const BORDER_COLOR = "#27272a";

/**
 * @param {{ title: string, preheader?: string, bodyHtml: string, unsubscribeUrl: string }} opts
 * @returns {string}
 */
function wrapEmailLayout({ title, preheader = "", bodyHtml, unsubscribeUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:${BG_COLOR};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>` : ""}
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:${TEXT_COLOR};letter-spacing:-0.02em;">S3 Labs</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:${CARD_BG};border:1px solid ${BORDER_COLOR};border-radius:16px;padding:32px 28px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${MUTED_COLOR};">
                S3 Labs &mdash; Growth partner for Solana developers
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED_COLOR};">
                <a href="${S3LABS_SITE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">s3labs.xyz</a>
                &nbsp;&middot;&nbsp;
                <a href="${unsubscribeUrl}" style="color:${MUTED_COLOR};text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * @param {string} href
 * @param {string} label
 * @returns {string}
 */
function ctaButton(href, label) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px;">
  <tr>
    <td style="border-radius:9999px;background:linear-gradient(135deg,${BRAND_COLOR},#a855f7);">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9999px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string | null | undefined} iso
 * @returns {string}
 */
function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

/**
 * @param {{ unsubscribeUrl: string }} opts
 * @returns {{ subject: string, html: string, text: string }}
 */
export function buildWelcomeEmail({ unsubscribeUrl }) {
  const subject = "You're subscribed — S3Labs alerts";
  const preheader =
    "We'll notify you when new KOL campaigns and missions go live on S3Labs.";

  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${TEXT_COLOR};letter-spacing:-0.02em;">
      Welcome to S3Labs alerts
    </h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:${MUTED_COLOR};">
      Thank you for subscribing. You will receive a notification each time a new
      KOL campaign or S3Labs mission goes live.
    </p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.65;color:${MUTED_COLOR};">
      Campaign alerts include the reward pool and a join link. Mission alerts
      include the points reward and a link to complete the mission.
    </p>
    ${ctaButton(buildS3labsSiteUrl("/kol"), "Browse KOL Marketplace")}
    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${MUTED_COLOR};">
      You can unsubscribe at any time using the link below.
    </p>`;

  const html = wrapEmailLayout({ title: subject, preheader, bodyHtml, unsubscribeUrl });

  const text = `Welcome to S3Labs alerts

Thank you for subscribing. You will receive a notification each time a new KOL campaign or S3Labs mission goes live.

Campaign alerts include the reward pool and a join link. Mission alerts include the points reward and a link to complete the mission.

Browse campaigns: ${buildS3labsSiteUrl("/kol")}
Browse missions: ${buildS3labsSiteUrl("/profile/missions")}

---
S3 Labs — Growth partner for Solana developers
${S3LABS_SITE_URL}

Unsubscribe: ${unsubscribeUrl}`;

  return { subject, html, text };
}

/**
 * @param {{ campaign: Record<string, unknown>, unsubscribeUrl: string }} opts
 * @returns {{ subject: string, html: string, text: string }}
 */
export function buildCampaignLiveEmail({ campaign, unsubscribeUrl }) {
  const title = String(campaign.title || "New campaign");
  const description = String(campaign.description || "").trim();
  const rewardSol = Number(campaign.rewardSol ?? 0);
  const kolPoolSol = Number(campaign.kolRewardPoolSol ?? rewardSol);
  const handle = campaign.sourceAuthorHandle
    ? `@${String(campaign.sourceAuthorHandle).replace(/^@/, "")}`
    : null;
  const endAt = campaign.endAt ? String(campaign.endAt) : null;
  const durationDays = campaign.durationDays ?? null;
  const campaignId = String(campaign.id || "");
  const campaignUrl = buildS3labsSiteUrl(
    `/kol?campaign=${encodeURIComponent(campaignId)}`,
  );

  const subject = `New campaign live: ${title}`;
  const preheader = `${kolPoolSol.toFixed(2)} SOL KOL reward pool — join now on S3Labs`;

  const metaRows = [
    { label: "KOL reward pool", value: `${kolPoolSol.toFixed(2)} SOL` },
    { label: "Total deposit", value: `${rewardSol.toFixed(2)} SOL` },
    durationDays ? { label: "Duration", value: `${durationDays} day${durationDays === 1 ? "" : "s"}` } : null,
    endAt ? { label: "Ends", value: formatDate(endAt) } : null,
    handle ? { label: "Project", value: handle } : null,
  ].filter(Boolean);

  const metaHtml = metaRows
    .map(
      (row) => `<tr>
        <td style="padding:10px 0;font-size:13px;color:${MUTED_COLOR};border-bottom:1px solid ${BORDER_COLOR};width:40%;">${escapeHtml(row.label)}</td>
        <td style="padding:10px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};border-bottom:1px solid ${BORDER_COLOR};text-align:right;">${escapeHtml(row.value)}</td>
      </tr>`,
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:${BRAND_COLOR};">
      New campaign live
    </p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${TEXT_COLOR};letter-spacing:-0.02em;line-height:1.3;">
      ${escapeHtml(title)}
    </h1>
    ${
      description
        ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${MUTED_COLOR};">${escapeHtml(description)}</p>`
        : ""
    }
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
      ${metaHtml}
    </table>
    ${ctaButton(campaignUrl, "View campaign & participate")}
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:${MUTED_COLOR};">
      Reply or quote the source post on X, submit your engagement link, and earn your share of the reward pool when the campaign ends.
    </p>`;

  const html = wrapEmailLayout({ title: subject, preheader, bodyHtml, unsubscribeUrl });

  const metaText = metaRows.map((r) => `${r.label}: ${r.value}`).join("\n");
  const text = `New campaign live on S3Labs

${title}
${description ? `\n${description}\n` : ""}
${metaText}

View campaign: ${campaignUrl}

Reply or quote the source post on X, submit your engagement link, and earn your share when the campaign ends.

---
S3 Labs — Growth partner for Solana developers
${S3LABS_SITE_URL}

Unsubscribe: ${unsubscribeUrl}`;

  return { subject, html, text };
}

/**
 * Truncate tweet copy for subject / headline.
 * @param {string} text
 * @param {number} [max]
 * @returns {string}
 */
function truncateText(text, max = 90) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "New S3Labs mission";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * @param {{ mission: Record<string, unknown>, unsubscribeUrl: string }} opts
 * @returns {{ subject: string, html: string, text: string }}
 */
export function buildMissionLiveEmail({ mission, unsubscribeUrl }) {
  const text = String(mission.text || "").trim();
  const headline = truncateText(text, 90);
  const pointsReward = Number(mission.pointsReward ?? 0.3);
  const handle = mission.authorHandle
    ? `@${String(mission.authorHandle).replace(/^@/, "")}`
    : "@s3labs_";
  const tweetUrl =
    typeof mission.tweetUrl === "string" && mission.tweetUrl
      ? String(mission.tweetUrl)
      : null;
  const postedAt = mission.tweetCreatedAt ? String(mission.tweetCreatedAt) : null;
  const likeCount = Math.max(0, Math.floor(Number(mission.likeCount) || 0));
  const replyCount = Math.max(0, Math.floor(Number(mission.replyCount) || 0));
  const missionUrl = buildS3labsSiteUrl("/profile/missions");

  const subject = `New mission live: ${headline}`;
  const preheader = `Earn ${pointsReward.toFixed(1)} S3Labs Points — reply or quote on X, then submit your link`;

  const metaRows = [
    { label: "Points reward", value: `+${pointsReward.toFixed(1)} pts` },
    { label: "From", value: handle },
    postedAt ? { label: "Posted", value: formatDate(postedAt) } : null,
    likeCount > 0 || replyCount > 0
      ? {
          label: "Engagement",
          value: `${likeCount} likes · ${replyCount} replies`,
        }
      : null,
  ].filter(Boolean);

  const metaHtml = metaRows
    .map(
      (row) => `<tr>
        <td style="padding:10px 0;font-size:13px;color:${MUTED_COLOR};border-bottom:1px solid ${BORDER_COLOR};width:40%;">${escapeHtml(row.label)}</td>
        <td style="padding:10px 0;font-size:14px;font-weight:600;color:${TEXT_COLOR};border-bottom:1px solid ${BORDER_COLOR};text-align:right;">${escapeHtml(row.value)}</td>
      </tr>`,
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:${BRAND_COLOR};">
      New mission live
    </p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${TEXT_COLOR};letter-spacing:-0.02em;line-height:1.3;">
      ${escapeHtml(headline)}
    </h1>
    ${
      text && text !== headline
        ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:${MUTED_COLOR};">${escapeHtml(truncateText(text, 280))}</p>`
        : ""
    }
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
      ${metaHtml}
    </table>
    ${ctaButton(missionUrl, "Open missions & earn points")}
    ${
      tweetUrl
        ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${MUTED_COLOR};">
      Source post: <a href="${escapeHtml(tweetUrl)}" style="color:${BRAND_COLOR};text-decoration:none;">View on X</a>
    </p>`
        : ""
    }
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:${MUTED_COLOR};">
      Reply or quote the S3Labs post from your verified X account, then paste your link on the missions page to claim points.
    </p>`;

  const html = wrapEmailLayout({ title: subject, preheader, bodyHtml, unsubscribeUrl });

  const metaText = metaRows.map((r) => `${r.label}: ${r.value}`).join("\n");
  const textBody = `New mission live on S3Labs

${headline}
${text ? `\n${text}\n` : ""}
${metaText}

Open missions: ${missionUrl}
${tweetUrl ? `Source post: ${tweetUrl}\n` : ""}
Reply or quote the S3Labs post from your verified X account, then paste your link on the missions page to claim points.

---
S3 Labs — Growth partner for Solana developers
${S3LABS_SITE_URL}

Unsubscribe: ${unsubscribeUrl}`;

  return { subject, html, text: textBody };
}

/**
 * @param {{ success: boolean, email?: string }} opts
 * @returns {string}
 */
export function buildUnsubscribePageHtml({ success, email }) {
  const title = success ? "Unsubscribed" : "Invalid link";
  const message = success
    ? `You have been unsubscribed from S3Labs campaign and mission alerts${email ? ` for <strong>${escapeHtml(email)}</strong>` : ""}.`
    : "This unsubscribe link is invalid or has already been used.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — S3Labs</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
      background:#0a0a0f; color:#e4e4e7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
    .card { max-width:420px; padding:40px 32px; text-align:center; background:#12121a;
      border:1px solid #27272a; border-radius:16px; margin:16px; }
    h1 { font-size:22px; margin:0 0 12px; }
    p { color:#a1a1aa; line-height:1.6; margin:0 0 24px; }
    a { color:#7c3aed; text-decoration:none; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${buildS3labsSiteUrl("/kol")}">Return to KOL Marketplace</a>
  </div>
</body>
</html>`;
}
