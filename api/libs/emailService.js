/**
 * Email transport — Gmail SMTP via nodemailer.
 * No-ops safely when credentials are not configured.
 */
import nodemailer from "nodemailer";
import {
  getEmailFromAddress,
  GMAIL_APP_PASSWORD,
  GMAIL_USER,
  isEmailConfigured,
} from "../config/emailConfig.js";

/** @type {import("nodemailer").Transporter | null} */
let transporter = null;

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

/**
 * Verify SMTP credentials on startup (logs clear error if Gmail app password is invalid).
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function verifyEmailTransport() {
  const transport = getTransporter();
  if (!transport) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    await transport.verify();
    return { ok: true };
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error(
      "[email] SMTP verify failed — campaign alerts will not send. Regenerate Gmail App Password for",
      GMAIL_USER,
    );
    console.error("[email] Details:", reason);
    return { ok: false, reason };
  }
}

/**
 * @param {{ to: string | string[], bcc?: string | string[], subject: string, html: string, text: string }} opts
 * @returns {Promise<{ sent: boolean, messageId?: string, reason?: string }>}
 */
export async function sendEmail({ to, bcc, subject, html, text }) {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[email] Skipped send — email not configured (set GMAIL_APP_PASSWORD)");
    return { sent: false, reason: "not_configured" };
  }

  try {
    const info = await transport.sendMail({
      from: getEmailFromAddress(),
      to,
      bcc,
      subject,
      html,
      text,
    });
    return { sent: true, messageId: info.messageId };
  } catch (e) {
    console.warn(
      "[email] Send failed:",
      e instanceof Error ? e.message : e,
    );
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
