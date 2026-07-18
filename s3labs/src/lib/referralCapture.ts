import { claimReferralAttribution, KolApiError } from "@/lib/kolApi";

const STORAGE_KEY = "s3labs-pending-referral";

const CODE_RE = /^[a-z0-9][a-z0-9_-]{2,19}$/;

export function normalizeReferralCode(raw: string | null | undefined): string | null {
  const code = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  if (!code || !CODE_RE.test(code)) return null;
  return code;
}

export function persistPendingReferral(code: string | null | undefined): void {
  const normalized = normalizeReferralCode(code);
  if (!normalized || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // ignore quota / private mode
  }
}

export function readPendingReferral(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeReferralCode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearPendingReferral(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Capture `?ref=` from the current URL into localStorage (does not strip the query).
 */
export function captureReferralFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const code = normalizeReferralCode(params.get("ref"));
  if (code) persistPendingReferral(code);
  return code;
}

/**
 * Claim pending referral for a connected wallet. Clears storage on success
 * or when attribution is already bound / self-referral / invalid.
 */
export async function claimIfNeeded(wallet: string | null | undefined): Promise<boolean> {
  const address = String(wallet || "").trim();
  const code = readPendingReferral();
  if (!address || !code) return false;

  try {
    await claimReferralAttribution({ wallet: address, code });
    clearPendingReferral();
    return true;
  } catch (e) {
    if (e instanceof KolApiError) {
      if (
        e.code === "self_referral" ||
        e.code === "not_found" ||
        e.code === "invalid_code"
      ) {
        clearPendingReferral();
      }
      // already attributed is returned as success from API; leave other errors for retry
    }
    return false;
  }
}
