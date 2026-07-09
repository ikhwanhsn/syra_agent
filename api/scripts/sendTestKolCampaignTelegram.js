/**
 * Send a test KOL campaign alert to the S3Labs Telegram group.
 * Usage: node -r dotenv/config scripts/sendTestKolCampaignTelegram.js
 */
import { sendTestKolCampaignTelegram } from "../libs/kolCampaignTelegramNotifier.js";
import { isS3labsTelegramConfigured } from "../libs/s3labsTelegramNotifier.js";

async function main() {
  console.log("[test-kol-telegram] configured:", isS3labsTelegramConfigured());
  const result = await sendTestKolCampaignTelegram();
  console.log("[test-kol-telegram] result:", JSON.stringify(result, null, 2));
  process.exit(result.sent ? 0 : 1);
}

main().catch((e) => {
  console.error("[test-kol-telegram] failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
