/**
 * Send a test KOL campaign notification email.
 * Usage: node -r dotenv/config scripts/sendTestCampaignEmail.js [email]
 */
import connectMongoose from "../config/mongoose.js";
import { isEmailConfigured } from "../config/emailConfig.js";
import { sendTestCampaignEmail } from "../libs/emailSubscriberService.js";

const email = process.argv[2] || "ikhwanulhusna111@gmail.com";

async function main() {
  console.log("[test-email] Target:", email);
  console.log("[test-email] Configured:", isEmailConfigured());

  await connectMongoose({ required: true });

  const result = await sendTestCampaignEmail(email);
  console.log("[test-email] Success:", JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error("[test-email] Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
