/**
 * Smoke test: send to each S3Labs forum topic.
 *
 * Usage: node -r dotenv/config scripts/test-s3labs-telegram.js [news|developer|event|all]
 */

import { S3LABS_AGENT_DEFINITIONS } from "../config/s3labsAgentsConfig.js";
import {
  getS3labsTelegramConfig,
  isS3labsTelegramConfigured,
  sendS3labsTelegram,
} from "../libs/s3labsTelegramNotifier.js";

const arg = (process.argv[2] || "all").toLowerCase();

async function sendTest(def) {
  const text = [
    `${def.headerEmoji} Test: ${def.topicLabel}`,
    "",
    `Forum topic: t.me/s3labs/${def.threadId}`,
    `Agent: ${def.kind}`,
    `Time: ${new Date().toISOString()}`,
  ].join("\n");

  const ok = await sendS3labsTelegram(text, {
    messageThreadId: def.threadId,
    disableWebPagePreview: true,
  });

  console.log(`[test-s3labs] ${def.kind} (thread ${def.threadId}):`, ok ? "OK" : "FAILED");
  return ok;
}

async function main() {
  if (!isS3labsTelegramConfigured()) {
    console.error("Missing S3LABS_TELEGRAM_BOT_TOKEN or S3LABS_TELEGRAM_CHAT_ID");
    process.exit(1);
  }

  const { token, chatId } = getS3labsTelegramConfig();
  console.log("[test-s3labs] chat:", chatId, "| token:", token.slice(0, 8) + "…");

  const targets =
    arg === "all"
      ? S3LABS_AGENT_DEFINITIONS
      : S3LABS_AGENT_DEFINITIONS.filter((d) => d.kind === arg);

  if (targets.length === 0) {
    console.error("Unknown agent. Use: news | developer | event | all");
    process.exit(1);
  }

  let allOk = true;
  for (const def of targets) {
    const ok = await sendTest(def);
    if (!ok) allOk = false;
    if (targets.length > 1) await new Promise((r) => setTimeout(r, 1500));
  }

  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
