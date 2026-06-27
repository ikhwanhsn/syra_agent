/**
 * Email transport — Gmail SMTP via nodemailer.
 * No-ops safely when credentials are not configured.
 */
import nodemailer from "nodemailer";
import { getEmailFromAddress, GMAIL_USER, isEmailConfigured } from "../config/emailConfig.js";

/** @type {import("nodemailer").Transporter | null} */
let transporter = null;

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
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
