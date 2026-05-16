/**
 * Smoke test internal news agent (no HTTP server required).
 * Usage: node -r dotenv/config scripts/smoke-internal-news.mjs
 */
import {
  fetchNewsCategoryGeneral,
  fetchTrendingHeadlinesGeneral,
  fetchEventsGeneral,
  fetchSundownDigest,
  fetchSentimentGeneral,
} from "../libs/internalNewsAgent.js";

async function main() {
  console.log("[smoke] news general...");
  const news = await fetchNewsCategoryGeneral(10);
  console.log(`  articles: ${news.length}`, news[0]?.title?.slice(0, 60) || "(empty)");

  console.log("[smoke] trending...");
  const trending = await fetchTrendingHeadlinesGeneral();
  console.log(`  headlines: ${trending.length}`, trending[0]?.headline?.slice(0, 60) || "(empty)");

  console.log("[smoke] events...");
  const events = await fetchEventsGeneral();
  const eventDates = Object.keys(events);
  console.log(`  dates: ${eventDates.length}`, eventDates[0] || "(empty)");

  console.log("[smoke] sundown...");
  const sundown = await fetchSundownDigest();
  console.log(`  items: ${sundown.length}`, sundown[0]?.title?.slice(0, 60) || "(empty)");

  console.log("[smoke] sentiment (mongo)...");
  const sentiment = await fetchSentimentGeneral();
  console.log(`  days: ${Object.keys(sentiment).length}`);

  if (news.length === 0) {
    console.error("FAIL: no news articles");
    process.exit(1);
  }
  console.log("OK: internal news smoke passed");
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
