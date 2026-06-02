/**
 * Telegram formatters per S3Labs forum topic (Bahasa Indonesia + agent identity).
 */

import { getS3labsAgentDefinition } from "../../config/s3labsAgentsConfig.js";

/**
 * @typedef {import("./s3labsPickLlm.js").S3labsPickOutput & {
 *   agentId?: string;
 *   agentName?: string;
 *   agentTag?: string;
 * }} S3labsPickOutputWithIdentity
 */

/**
 * @returns {string}
 */
function formatWibNow() {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

/**
 * @param {import("../../config/s3labsAgentsConfig.js").S3labsAgentKind} kind
 * @param {S3labsPickOutputWithIdentity} data
 * @returns {string | null}
 */
export function formatS3labsAgentTelegram(kind, data) {
  const def = getS3labsAgentDefinition(kind);
  const pick = data.pick;
  if (!pick) return null;

  const agentName = data.agentName || def.agentName;
  const agentId = data.agentId || def.agentId;
  const agentTag = data.agentTag || def.agentTag;

  const lines = [
    `${def.headerEmoji} ${def.topicLabel} · S3Labs`,
    `🤖 ${agentName}`,
    `🆔 ${agentId} · #${agentTag}`,
    "",
  ];

  if (kind === "news") {
    const cat =
      pick.category === "crypto" ? "Crypto" : pick.category === "web3" ? "Web3" : "Web3 & Crypto";
    lines.push(`📌 ${cat}`, "");
  } else if (kind === "developer") {
    lines.push("📌 Engineering & Dev Tools", "");
  } else if (kind === "event") {
    if (pick.eventDate && /^\d{4}-\d{2}-\d{2}$/.test(pick.eventDate)) {
      const d = new Date(`${pick.eventDate}T12:00:00Z`);
      const tanggal = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
      lines.push(`📌 Tanggal event: ${tanggal}`, "");
    } else {
      lines.push("📌 Kalender Event", "");
    }
  }

  lines.push(pick.title, "", pick.summary, "", "💡 Kenapa penting:", pick.whyItMatters, "");

  if (pick.url) {
    lines.push("🔗 Info lengkap:", pick.url, "");
  }

  lines.push(
    `📰 Sumber: ${pick.source}`,
    `🕐 ${formatWibNow()} WIB`,
    "",
    `— ${agentTag} · topik t.me/s3labs/${def.threadId}`,
  );

  return lines.join("\n").trim();
}
