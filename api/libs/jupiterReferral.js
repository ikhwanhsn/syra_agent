/**
 * Jupiter Swap API V1 referral / platform fee helpers.
 * Applies fees only when the referral token account exists on-chain (pre-created on referral.jup.ag).
 */
import { PublicKey } from "@solana/web3.js";

export const JUPITER_REFERRAL_PROGRAM_ID = "REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3";

const DEFAULT_REFERRAL_ACCOUNT = "9zFnqSZiJkAqaj5o4eFsSacgb6k2YzD8HEECS3ssgLBZ";
const DEFAULT_PLATFORM_FEE_BPS = 100;
const EXISTENCE_CACHE_TTL_MS = 5 * 60 * 1000;

/** @type {Map<string, { exists: boolean; ts: number }>} */
const existenceCache = new Map();

function logReferral(message, meta = {}) {
  const payload = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  console.info(`[jupiter-referral] ${message}${payload}`);
}

/**
 * @returns {PublicKey | null}
 */
export function getReferralAccount() {
  const raw = (process.env.JUPITER_REFERRAL_ACCOUNT || DEFAULT_REFERRAL_ACCOUNT).trim();
  if (!raw) return null;
  try {
    return new PublicKey(raw);
  } catch {
    logReferral("invalid_referral_account", { raw });
    return null;
  }
}

/**
 * @returns {number} 0–255
 */
export function getPlatformFeeBps() {
  const raw = process.env.JUPITER_PLATFORM_FEE_BPS;
  if (raw == null || String(raw).trim() === "") {
    return DEFAULT_PLATFORM_FEE_BPS;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_PLATFORM_FEE_BPS;
  return Math.max(0, Math.min(255, Math.floor(n)));
}

/**
 * Derive the Jupiter referral token account PDA for a given output mint.
 * @param {string} mint — output mint (fee is taken on output for ExactIn swaps)
 * @param {PublicKey} [referralAccount] — defaults to getReferralAccount()
 * @returns {{ referralTokenAccount: PublicKey; referralAccount: PublicKey } | null}
 */
export function deriveReferralTokenAccount(mint, referralAccount = getReferralAccount()) {
  if (!referralAccount) return null;
  const mintKey = String(mint || "").trim();
  if (!mintKey) return null;
  try {
    const mintPk = new PublicKey(mintKey);
    const programId = new PublicKey(JUPITER_REFERRAL_PROGRAM_ID);
    const [referralTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("referral_ata"), referralAccount.toBuffer(), mintPk.toBuffer()],
      programId,
    );
    return { referralTokenAccount, referralAccount };
  } catch (err) {
    logReferral("derive_failed", {
      mint: mintKey,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * @param {import("@solana/web3.js").Connection} connection
 * @param {string} mint
 * @returns {Promise<boolean>}
 */
async function referralTokenAccountExists(connection, mint) {
  const derived = deriveReferralTokenAccount(mint);
  if (!derived) return false;

  const cacheKey = derived.referralTokenAccount.toBase58();
  const cached = existenceCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.ts < EXISTENCE_CACHE_TTL_MS) {
    return cached.exists;
  }

  let exists = false;
  try {
    const info = await connection.getAccountInfo(derived.referralTokenAccount, "confirmed");
    exists = info != null;
  } catch (err) {
    logReferral("existence_check_failed", {
      mint,
      feeAccount: cacheKey,
      error: err instanceof Error ? err.message : String(err),
    });
    exists = false;
  }

  existenceCache.set(cacheKey, { exists, ts: now });
  return exists;
}

/**
 * Resolve platform fee params for a Jupiter V1 swap (guarded — never breaks swaps).
 * @param {import("@solana/web3.js").Connection} connection
 * @param {string} outputMint — ExactIn output mint (fee is taken on output)
 * @returns {Promise<{ platformFeeBps: number; feeAccount: string | null }>}
 */
export async function resolveReferralFee(connection, outputMint) {
  const bps = getPlatformFeeBps();
  const referralAccount = getReferralAccount();
  if (!referralAccount || bps <= 0) {
    logReferral("skipped", {
      mint: outputMint,
      reason: !referralAccount ? "no_referral_account" : "fee_bps_zero",
    });
    return { platformFeeBps: 0, feeAccount: null };
  }

  const derived = deriveReferralTokenAccount(outputMint, referralAccount);
  if (!derived) {
    logReferral("skipped", { mint: outputMint, reason: "derive_failed" });
    return { platformFeeBps: 0, feeAccount: null };
  }

  const exists = await referralTokenAccountExists(connection, outputMint);
  if (!exists) {
    logReferral("skipped", {
      mint: outputMint,
      feeAccount: derived.referralTokenAccount.toBase58(),
      reason: "referral_token_account_missing",
    });
    return { platformFeeBps: 0, feeAccount: null };
  }

  const feeAccount = derived.referralTokenAccount.toBase58();
  logReferral("applied", {
    mint: outputMint,
    feeAccount,
    platformFeeBps: bps,
    referralAccount: referralAccount.toBase58(),
  });
  return { platformFeeBps: bps, feeAccount };
}

/** Clear existence cache (for tests). */
export function clearReferralExistenceCache() {
  existenceCache.clear();
}
