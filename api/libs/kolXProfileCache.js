/**
 * KOL marketplace X profile cache — daily refresh, DB reads on public routes.
 */
import KolCampaign from "../models/KolCampaign.js";
import KolSubmission from "../models/KolSubmission.js";
import KolXProfile from "../models/KolXProfile.js";
import { getUserInfo, isTwitterApiIoConfigured } from "./twitterApiIoClient.js";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REFRESH_DELAY_MS = 400;

/**
 * @param {string} handle
 */
export function normalizeHandleKey(handle) {
  return String(handle || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function getTtlMs() {
  const raw = Number(process.env.KOL_X_PROFILE_TTL_MS || DEFAULT_TTL_MS);
  return Number.isFinite(raw) && raw >= 60_000 ? raw : DEFAULT_TTL_MS;
}

function getRefreshDelayMs() {
  const raw = Number(process.env.KOL_X_PROFILE_REFRESH_DELAY_MS || DEFAULT_REFRESH_DELAY_MS);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_REFRESH_DELAY_MS;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {Record<string, unknown>} doc
 */
function serializeCachedProfile(doc) {
  return {
    handleKey: String(doc.handleKey),
    handle: String(doc.handle),
    name: doc.name != null ? String(doc.name) : null,
    followers: doc.followers != null && Number.isFinite(Number(doc.followers)) ? Number(doc.followers) : null,
    following: doc.following != null && Number.isFinite(Number(doc.following)) ? Number(doc.following) : null,
    verified: Boolean(doc.verified),
    description: doc.description != null ? String(doc.description) : null,
    profilePicture: doc.profilePicture != null ? String(doc.profilePicture) : null,
    tweetCount: doc.tweetCount != null && Number.isFinite(Number(doc.tweetCount)) ? Number(doc.tweetCount) : null,
    refreshedAt: doc.refreshedAt ? new Date(doc.refreshedAt).toISOString() : null,
  };
}

/**
 * @param {string} handle
 */
export async function getCachedXProfile(handle) {
  const handleKey = normalizeHandleKey(handle);
  if (!handleKey) return null;

  const doc = await KolXProfile.findOne({ handleKey }).lean();
  return doc ? serializeCachedProfile(doc) : null;
}

/**
 * @param {string[]} handles
 */
export async function getCachedXProfiles(handles) {
  const keys = [...new Set(handles.map(normalizeHandleKey).filter(Boolean))];
  if (keys.length === 0) return new Map();

  const docs = await KolXProfile.find({ handleKey: { $in: keys } }).lean();
  return new Map(docs.map((doc) => [String(doc.handleKey), serializeCachedProfile(doc)]));
}

/**
 * Seed or lightly update cache from tweet/author data (no X API call).
 * @param {{ userName?: string; name?: string; followers?: number; verified?: boolean; description?: string; profilePicture?: string }} author
 */
export async function seedXProfileFromAuthor(author) {
  const handle = String(author?.userName || "")
    .trim()
    .replace(/^@/, "");
  const handleKey = normalizeHandleKey(handle);
  if (!handleKey) return null;

  const now = new Date();
  const existing = await KolXProfile.findOne({ handleKey }).lean();

  const patch = {
    handle,
    name: String(author?.name || handle).trim() || handle,
    followers:
      author?.followers != null && Number.isFinite(Number(author.followers))
        ? Number(author.followers)
        : (existing?.followers ?? null),
    verified: author?.verified != null ? Boolean(author.verified) : Boolean(existing?.verified),
    description: author?.description != null ? String(author.description) : (existing?.description ?? null),
    profilePicture:
      author?.profilePicture != null
        ? String(author.profilePicture)
        : (existing?.profilePicture ?? null),
  };

  if (!existing) {
    patch.refreshedAt = now;
  }

  const doc = await KolXProfile.findOneAndUpdate(
    { handleKey },
    { $set: patch, $setOnInsert: { handleKey, refreshedAt: now } },
    { upsert: true, new: true },
  ).lean();

  return doc ? serializeCachedProfile(doc) : null;
}

/**
 * @param {string} handle
 */
async function syncCampaignAuthorsFromProfile(handleKey, profile) {
  const handleRegex = new RegExp(
    `^${handleKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    "i",
  );

  await KolCampaign.updateMany(
    { sourceAuthorHandle: handleRegex },
    {
      $set: {
        sourceAuthorName: profile.name ?? profile.handle,
        sourceAuthorFollowers: profile.followers,
        sourceAuthorVerified: profile.verified,
      },
    },
  );
}

/**
 * Fetch one handle from twitterapi.io and persist.
 * @param {string} handle
 */
export async function refreshXProfile(handle) {
  const handleKey = normalizeHandleKey(handle);
  if (!handleKey) {
    return { success: false, error: "invalid_handle" };
  }

  if (!isTwitterApiIoConfigured()) {
    return { success: false, error: "twitterapi_unavailable", handleKey };
  }

  const displayHandle = String(handle).trim().replace(/^@/, "") || handleKey;

  try {
    const { user } = await getUserInfo(displayHandle);
    const refreshedAt = new Date();
    const profile = {
      handleKey,
      handle: user.userName || displayHandle,
      name: user.name || displayHandle,
      followers: user.followers ?? null,
      following: user.following ?? null,
      verified: Boolean(user.verified),
      description: user.description ?? null,
      profilePicture: user.profilePicture ?? null,
      tweetCount: user.tweetCount ?? null,
      refreshedAt,
      lastError: null,
    };

    await KolXProfile.findOneAndUpdate({ handleKey }, { $set: profile }, { upsert: true });
    await syncCampaignAuthorsFromProfile(handleKey, profile);

    return {
      success: true,
      handleKey,
      refreshedAt: refreshedAt.toISOString(),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await KolXProfile.findOneAndUpdate(
      { handleKey },
      {
        $set: { lastError: message },
        $setOnInsert: {
          handleKey,
          handle: displayHandle,
          name: displayHandle,
          refreshedAt: new Date(0),
        },
      },
      { upsert: true },
    );
    return { success: false, handleKey, error: message };
  }
}

/**
 * Collect all X handles referenced by marketplace campaigns and submissions.
 */
export async function collectMarketplaceHandles() {
  const [campaignHandles, submissionHandles] = await Promise.all([
    KolCampaign.distinct("sourceAuthorHandle", { sourceAuthorHandle: { $nin: [null, ""] } }),
    KolSubmission.distinct("authorHandle", { authorHandle: { $nin: [null, ""] } }),
  ]);

  const keys = new Set();
  for (const raw of [...campaignHandles, ...submissionHandles]) {
    const key = normalizeHandleKey(raw);
    if (key) keys.add(key);
  }
  return [...keys];
}

/**
 * Refresh stale (or all) marketplace X profiles. Called by daily scheduler.
 * @param {{ force?: boolean; limit?: number }} [opts]
 */
export async function refreshAllMarketplaceXProfiles(opts = {}) {
  if (!isTwitterApiIoConfigured()) {
    return { refreshed: 0, failed: 0, skipped: true, reason: "twitterapi_unavailable" };
  }

  const ttlMs = getTtlMs();
  const staleBefore = new Date(Date.now() - ttlMs);
  const force = Boolean(opts.force);
  const limit = Math.min(Math.max(Number(opts.limit) || 500, 1), 1000);

  let handleKeys = await collectMarketplaceHandles();
  if (!force) {
    const freshKeys = new Set(
      (
        await KolXProfile.find({
          handleKey: { $in: handleKeys },
          refreshedAt: { $gte: staleBefore },
          lastError: null,
        })
          .select("handleKey")
          .lean()
      ).map((d) => String(d.handleKey)),
    );
    handleKeys = handleKeys.filter((k) => !freshKeys.has(k));
  }

  handleKeys = handleKeys.slice(0, limit);

  let refreshed = 0;
  let failed = 0;
  const errors = [];
  const delayMs = getRefreshDelayMs();

  for (const handleKey of handleKeys) {
    const result = await refreshXProfile(handleKey);
    if (result.success) {
      refreshed += 1;
    } else {
      failed += 1;
      if (result.error) errors.push({ handleKey, error: result.error });
    }
    if (delayMs > 0) await sleep(delayMs);
  }

  return {
    refreshed,
    failed,
    attempted: handleKeys.length,
    errors: errors.slice(0, 10),
  };
}
