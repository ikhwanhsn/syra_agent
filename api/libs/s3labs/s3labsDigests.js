/**
 * Telegram formatters per S3Labs forum topic (English + agent identity).
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
function formatUtcNow() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
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
      const eventDate = new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
      lines.push(`📌 Event date: ${eventDate}`, "");
    } else {
      lines.push("📌 Event Calendar", "");
    }
  }

  lines.push(pick.title, "", pick.summary, "", "💡 Why it matters:", pick.whyItMatters, "");

  if (pick.url) {
    lines.push("🔗 Full details:", pick.url, "");
  }

  lines.push(
    `📰 Source: ${pick.source}`,
    `🕐 ${formatUtcNow()} UTC`,
    "",
    `— ${agentTag} · topic t.me/s3labs/${def.threadId}`,
  );

  return lines.join("\n").trim();
}
