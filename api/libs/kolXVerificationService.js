/**
 * X account verification via post-a-code flow.
 */
import crypto from "node:crypto";
import KolXVerification from "../models/KolXVerification.js";
import {
  getUserInfo,
  getUserLastTweets,
  isTwitterApiIoConfigured,
} from "./twitterApiIoClient.js";
import { normalizeWallet } from "./kolEngagementService.js";

const CODE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * @param {string} handle
 */
function normalizeHandle(handle) {
  return String(handle || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

/**
 * @param {string} handle
 */
function displayHandle(handle) {
  const clean = String(handle || "")
    .trim()
    .replace(/^@/, "");
  return clean || "";
}

function generateVerificationCode() {
  const suffix = crypto.randomBytes(4).toString("hex");
  return `s3labs-verify-${suffix}`;
}

function assertTwitter() {
  if (!isTwitterApiIoConfigured()) {
    const err = new Error("TWITTER_API_KEY is not configured");
    err.code = "twitterapi_unavailable";
    throw err;
  }
}

/**
 * @param {import("../models/KolXVerification.js").default | Record<string, unknown>} doc
 */
function serializeVerifiedDoc(doc) {
  return {
    verified: true,
    xHandle: doc.xHandle,
    xHandleKey: doc.xHandleKey,
    wallet: doc.wallet,
    status: "verified",
    alreadyVerified: true,
    verifiedAt: doc.verifiedAt
      ? new Date(doc.verifiedAt).toISOString()
      : null,
    message: "Your X account is already verified for this wallet.",
  };
}

/**
 * @param {{ wallet: string; xHandle: string }} input
 */
export async function requestXVerification(input) {
  assertTwitter();

  const wallet = normalizeWallet(input.wallet);
  if (!wallet) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const xHandle = displayHandle(input.xHandle);
  const xHandleKey = normalizeHandle(xHandle);
  if (!xHandleKey) {
    const err = new Error("xHandle is required");
    err.code = "invalid_handle";
    throw err;
  }

  const existingByWallet = await KolXVerification.findOne({
    wallet,
    status: "verified",
  });
  if (existingByWallet) {
    return serializeVerifiedDoc(existingByWallet);
  }

  const existingVerified = await KolXVerification.findOne({
    xHandleKey,
    status: "verified",
  });

  if (existingVerified) {
    if (existingVerified.wallet === wallet) {
      return serializeVerifiedDoc(existingVerified);
    }
    const err = new Error(
      "This X account is already verified by another wallet",
    );
    err.code = "handle_already_verified";
    throw err;
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  const doc = await KolXVerification.findOneAndUpdate(
    { xHandleKey },
    {
      $set: {
        xHandle,
        wallet,
        code,
        status: "pending",
        verifiedAt: null,
        expiresAt,
      },
    },
    { upsert: true, new: true },
  );

  return {
    xHandle: doc.xHandle,
    xHandleKey: doc.xHandleKey,
    wallet: doc.wallet,
    code: doc.code,
    status: doc.status,
    alreadyVerified: false,
    expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : null,
    instructions:
      `Post a tweet containing "${doc.code}" or add it to your X bio, then click Verify.`,
  };
}

/**
 * @param {string} text
 * @param {string} code
 */
function textContainsCode(text, code) {
  return String(text || "").toLowerCase().includes(String(code).toLowerCase());
}

/**
 * @param {string} xHandle
 * @param {string} code
 */
async function findCodeOnXProfile(xHandle, code) {
  const { user } = await getUserInfo(xHandle);
  if (textContainsCode(user.description, code)) {
    return { found: true, source: "bio" };
  }

  const { tweets } = await getUserLastTweets({ userName: xHandle });
  for (const tweet of tweets.slice(0, 20)) {
    if (textContainsCode(tweet.text, code)) {
      return { found: true, source: "tweet" };
    }
  }

  return { found: false, source: null };
}

/**
 * @param {{ wallet: string; xHandle: string }} input
 */
export async function confirmXVerification(input) {
  assertTwitter();

  const wallet = normalizeWallet(input.wallet);
  if (!wallet) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const xHandle = displayHandle(input.xHandle);
  const xHandleKey = normalizeHandle(xHandle);
  if (!xHandleKey) {
    const err = new Error("xHandle is required");
    err.code = "invalid_handle";
    throw err;
  }

  const existingByWallet = await KolXVerification.findOne({
    wallet,
    status: "verified",
  });
  if (existingByWallet) {
    return serializeVerifiedDoc(existingByWallet);
  }

  const doc = await KolXVerification.findOne({ xHandleKey, wallet });
  if (!doc) {
    const err = new Error("Verification request not found — request a code first");
    err.code = "not_found";
    throw err;
  }

  if (doc.status === "verified") {
    return serializeVerifiedDoc(doc);
  }

  if (doc.expiresAt && new Date() > new Date(doc.expiresAt)) {
    const err = new Error("Verification code expired — request a new code");
    err.code = "verification_expired";
    throw err;
  }

  const check = await findCodeOnXProfile(doc.xHandle, doc.code);
  if (!check.found) {
    const err = new Error(
      `Code not found on @${doc.xHandle}. Post "${doc.code}" on X or add it to your bio, then try again.`,
    );
    err.code = "verification_code_not_found";
    throw err;
  }

  doc.status = "verified";
  doc.verifiedAt = new Date();
  await doc.save();

  return {
    verified: true,
    xHandle: doc.xHandle,
    xHandleKey: doc.xHandleKey,
    wallet: doc.wallet,
    verifiedAt: doc.verifiedAt.toISOString(),
    verifiedVia: check.source,
  };
}

/**
 * @param {string} wallet
 */
export async function getWalletVerification(wallet) {
  const kolWallet = normalizeWallet(wallet);
  if (!kolWallet) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const doc = await KolXVerification.findOne({
    wallet: kolWallet,
    status: "verified",
  }).lean();

  if (!doc) {
    return { verified: false, wallet: kolWallet, xHandle: null };
  }

  return {
    verified: true,
    wallet: kolWallet,
    xHandle: doc.xHandle,
    xHandleKey: doc.xHandleKey,
    verifiedAt: doc.verifiedAt
      ? new Date(doc.verifiedAt).toISOString()
      : null,
  };
}

/**
 * @param {string} xHandleKey
 */
export async function getVerifiedWalletForHandle(xHandleKey) {
  const key = normalizeHandle(xHandleKey);
  if (!key) return null;

  const doc = await KolXVerification.findOne({
    xHandleKey: key,
    status: "verified",
  }).lean();

  return doc?.wallet ?? null;
}
