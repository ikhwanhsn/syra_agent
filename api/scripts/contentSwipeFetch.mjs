/**
 * Content swipe fetch — read-only X pull for Chronicle `/ideas`.
 *
 * Loads `.cursor/agents/content-swipe/watchlist.json`, scores each handle with
 * xApiClient + xProjectScoring (not the paid x-project-analyzer), writes
 * `.cursor/agents/state/content-swipe-latest.json` (gitignored).
 *
 * If X_BEARER_TOKEN is missing, exits 0 with a skip payload so Ideas mode
 * can degrade to STYLE_PLAYBOOK.md + Syra facts.
 *
 * Usage (repo root or api/):
 *   node api/scripts/contentSwipeFetch.mjs
 *   node scripts/contentSwipeFetch.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pLimit from "p-limit";
import {
  getUserByUsername,
  getUserTweets,
  isXApiBearerConfigured,
} from "../libs/xApiClient.js";
import { computeXProjectScore } from "../libs/xProjectScoring.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const API_DIR = path.resolve(SCRIPT_DIR, "..");
const REPO_ROOT = path.resolve(API_DIR, "..");

dotenv.config({ path: path.join(API_DIR, ".env"), quiet: true });
dotenv.config({ path: path.join(REPO_ROOT, ".env"), quiet: true });

const WATCHLIST_PATH = path.join(
  REPO_ROOT,
  ".cursor/agents/content-swipe/watchlist.json",
);
const OUT_PATH = path.join(
  REPO_ROOT,
  ".cursor/agents/state/content-swipe-latest.json",
);

const USERNAME_RE = /^[A-Za-z0-9_]{1,15}$/;
const USER_FIELDS =
  "created_at,description,public_metrics,verified,url,verified_type";
const TWEET_FIELDS = "created_at,public_metrics,text";
const MAX_RESULTS = 20;
const TOP_N = 8;
const TEXT_MAX = 500;

function parseConcurrency() {
  const raw = process.env.CONTENT_SWIPE_CONCURRENCY;
  const n =
    raw != null && raw !== "" ? Number.parseInt(String(raw).trim(), 10) : NaN;
  if (Number.isFinite(n) && n >= 1) return Math.min(5, n);
  return 2;
}

function tweetEngagement(tweet) {
  const m = tweet?.public_metrics;
  if (!m || typeof m !== "object") return 0;
  return (
    (Number(m.like_count) || 0) +
    (Number(m.retweet_count) || 0) +
    (Number(m.reply_count) || 0) +
    (Number(m.quote_count) || 0)
  );
}

function trimText(text) {
  if (typeof text !== "string") return "";
  return text.length > TEXT_MAX ? `${text.slice(0, TEXT_MAX)}…` : text;
}

function hasUrl(text) {
  return /https?:\/\/\S+/i.test(text) || /\bx\.com\/\S+/i.test(text);
}

function isThreadish(text) {
  return /🧵|\b\d+\s*\/\s*\d+\b|^\s*\d+\//m.test(text);
}

/**
 * @param {unknown[]} tweets
 */
function styleHintsFromTweets(tweets) {
  const list = Array.isArray(tweets) ? tweets : [];
  const n = list.length;
  if (n === 0) {
    return {
      sampleSize: 0,
      avgChars: 0,
      urlShare: 0,
      questionShare: 0,
      threadShare: 0,
    };
  }
  let chars = 0;
  let urls = 0;
  let questions = 0;
  let threads = 0;
  for (const t of list) {
    const text = typeof t?.text === "string" ? t.text : "";
    chars += text.length;
    if (hasUrl(text)) urls += 1;
    if (text.includes("?")) questions += 1;
    if (isThreadish(text)) threads += 1;
  }
  const round = (x) => Math.round(x * 1000) / 1000;
  return {
    sampleSize: n,
    avgChars: Math.round(chars / n),
    urlShare: round(urls / n),
    questionShare: round(questions / n),
    threadShare: round(threads / n),
  };
}

/**
 * @param {unknown[]} tweets
 * @param {number} limit
 */
function pickTopTweets(tweets, limit) {
  if (!Array.isArray(tweets) || tweets.length === 0) return [];
  const scored = tweets.map((t) => ({ t, engagement: tweetEngagement(t) }));
  scored.sort((a, b) => b.engagement - a.engagement);
  const out = [];
  const seen = new Set();
  for (const { t, engagement } of scored) {
    const id = t?.id != null ? String(t.id) : "";
    const key = id || trimText(t?.text).slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: id || undefined,
      created_at: t?.created_at,
      text: trimText(t?.text),
      engagement,
      public_metrics:
        t?.public_metrics && typeof t.public_metrics === "object"
          ? t.public_metrics
          : undefined,
    });
    if (out.length >= limit) break;
  }
  return out;
}

function trimUser(user) {
  if (!user || typeof user !== "object") return {};
  const pm =
    user.public_metrics && typeof user.public_metrics === "object"
      ? user.public_metrics
      : {};
  const desc = typeof user.description === "string" ? user.description : "";
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    description: desc.length > 180 ? `${desc.slice(0, 180)}…` : desc,
    verified: user.verified === true,
    followers_count: Number(pm.followers_count) || 0,
    following_count: Number(pm.following_count) || 0,
    tweet_count: Number(pm.tweet_count) || 0,
  };
}

async function writePayload(payload) {
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function printDigest(payload) {
  if (!payload.ok) {
    const reason = payload.reason || "unknown";
    if (reason === "X_BEARER_TOKEN_MISSING") {
      console.log(
        "content-swipe: skip (X_BEARER_TOKEN not set). Ideas mode will use STYLE_PLAYBOOK.md + Syra facts only.",
      );
      return;
    }
    console.log(`content-swipe: skip (${reason}).`);
    return;
  }
  const s = payload.summary || {};
  console.log(
    `content-swipe: ${s.total ?? 0} accounts, ${s.succeeded ?? 0} ok, ${s.failed ?? 0} failed`,
  );
  for (const row of payload.accounts || []) {
    if (!row.ok) {
      console.log(`  @${row.handle}  FAIL  ${row.error || "unknown"}`);
      continue;
    }
    const fol = row.user?.followers_count ?? 0;
    const eng = row.signals?.avgEngagementRatePct ?? 0;
    const cad = row.signals?.tweetsPerDay ?? 0;
    const grade = row.grade ?? "-";
    console.log(
      `  @${row.handle}  ${fol.toLocaleString()} fol  ${eng}% eng  cadence ${cad}/d  grade ${grade}`,
    );
  }
  console.log(`wrote ${path.relative(REPO_ROOT, OUT_PATH)}`);
}

/**
 * @param {{ handle: string; tier: string; watchFor: string }} account
 */
async function fetchAccount(account) {
  const handle = String(account.handle || "")
    .trim()
    .replace(/^@/, "");
  const base = {
    handle,
    tier: account.tier === "bluechip" ? "bluechip" : "niche",
    watchFor: typeof account.watchFor === "string" ? account.watchFor : "",
  };
  if (!USERNAME_RE.test(handle)) {
    return {
      ...base,
      ok: false,
      error: "Invalid username (1–15 chars: letters, numbers, underscore)",
    };
  }

  const userRes = await getUserByUsername(handle, USER_FIELDS);
  if (userRes.errors?.length) {
    return {
      ...base,
      ok: false,
      error: userRes.errors[0]?.message || "X API user error",
    };
  }
  if (!userRes.data?.id) {
    return { ...base, ok: false, error: "User not found" };
  }

  const user = userRes.data;
  const tweetsRes = await getUserTweets(user.id, {
    max_results: MAX_RESULTS,
    tweetFields: TWEET_FIELDS,
  });
  if (tweetsRes.errors?.length) {
    return {
      ...base,
      ok: false,
      error: tweetsRes.errors[0]?.message || "X API tweets error",
    };
  }

  const tweets = Array.isArray(tweetsRes.data) ? tweetsRes.data : [];
  const scored = computeXProjectScore({ user, tweets });
  const topTweets = pickTopTweets(tweets, TOP_N);

  return {
    ...base,
    ok: true,
    user: trimUser(user),
    score: scored.score,
    grade: scored.grade,
    signals: scored.signals,
    redFlags: scored.redFlags,
    styleHints: styleHintsFromTweets(tweets),
    topTweets,
  };
}

async function loadWatchlist() {
  const raw = await fs.readFile(WATCHLIST_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const accounts = Array.isArray(parsed?.accounts) ? parsed.accounts : [];
  return accounts.filter((a) => a && typeof a.handle === "string");
}

async function main() {
  if (!isXApiBearerConfigured()) {
    const payload = {
      ok: false,
      reason: "X_BEARER_TOKEN_MISSING",
      fetchedAt: new Date().toISOString(),
      accounts: [],
      summary: { total: 0, succeeded: 0, failed: 0 },
    };
    await writePayload(payload);
    printDigest(payload);
    return;
  }

  let accounts;
  try {
    accounts = await loadWatchlist();
  } catch (err) {
    const payload = {
      ok: false,
      reason: "WATCHLIST_UNREADABLE",
      error: err instanceof Error ? err.message : String(err),
      fetchedAt: new Date().toISOString(),
      accounts: [],
      summary: { total: 0, succeeded: 0, failed: 0 },
    };
    await writePayload(payload);
    printDigest(payload);
    return;
  }

  const limit = pLimit(parseConcurrency());
  const rows = await Promise.all(accounts.map((a) => limit(() => fetchAccount(a))));
  const succeeded = rows.filter((r) => r.ok).length;
  const payload = {
    ok: succeeded > 0,
    reason: succeeded > 0 ? undefined : "ALL_ACCOUNTS_FAILED",
    fetchedAt: new Date().toISOString(),
    watchlistPath: path.relative(REPO_ROOT, WATCHLIST_PATH),
    summary: {
      total: rows.length,
      succeeded,
      failed: rows.length - succeeded,
    },
    accounts: rows,
  };
  await writePayload(payload);
  printDigest(payload);
}

main().catch(async (err) => {
  const payload = {
    ok: false,
    reason: "FETCH_CRASHED",
    error: err instanceof Error ? err.message : String(err),
    fetchedAt: new Date().toISOString(),
    accounts: [],
    summary: { total: 0, succeeded: 0, failed: 0 },
  };
  try {
    await writePayload(payload);
  } catch {
    // ignore write failure after crash
  }
  console.error("content-swipe: crashed", payload.error);
  process.exitCode = 0;
});
